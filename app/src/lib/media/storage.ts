import { mkdir, rename, rm, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { TEMP_DIR, UPLOAD_DIR } from "./config";

/**
 * The seam between the application and wherever bytes actually live.
 *
 * Nothing outside this module touches the filesystem for media. Moving storage
 * to S3, R2 or anything else later means writing one more implementation of this
 * interface, not auditing the whole codebase for `writeFile` calls.
 */
export interface ImageStorage {
  /** Writes `data` at `key`, or leaves nothing behind. Never a partial file. */
  write(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  /** Returns false when the object was already gone — that is not an error. */
  remove(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  /** Every stored key, used by the cleanup sweep to find untracked files. */
  list(): Promise<string[]>;
  /** Bytes currently stored, for the maintenance report. */
  totalBytes(): Promise<number>;
}

/**
 * Keys are generated from database ids, never from anything a client sent, so
 * this should be unreachable. It exists because "should be unreachable" is not a
 * security control.
 */
function resolveKey(key: string): string {
  const resolved = path.resolve(UPLOAD_DIR, key);
  const root = path.resolve(UPLOAD_DIR);

  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Refusing to operate outside the upload directory");
  }

  return resolved;
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

export const filesystemStorage: ImageStorage = {
  /**
   * Written to a temporary name first and renamed into place, so a crash or a
   * full disk mid-write leaves a stray temp file rather than a truncated image
   * that looks valid to everything downstream. `rename` within one filesystem is
   * atomic, which is why the temp directory sits inside the upload directory.
   */
  async write(key, data) {
    const destination = resolveKey(key);

    await mkdir(path.dirname(destination), { recursive: true });
    await mkdir(TEMP_DIR, { recursive: true });

    const tempPath = path.join(
      TEMP_DIR,
      `${path.basename(key)}.${process.pid}.part`
    );

    try {
      await writeFile(tempPath, data);
      await rename(tempPath, destination);
    } catch (error) {
      await rm(tempPath, { force: true }).catch(() => {});
      throw error;
    }
  },

  async read(key) {
    return readFile(resolveKey(key));
  },

  async remove(key) {
    try {
      await rm(resolveKey(key), { force: false });
      return true;
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  },

  async exists(key) {
    try {
      await stat(resolveKey(key));
      return true;
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  },

  async list() {
    try {
      const entries = await readdir(UPLOAD_DIR, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
        .map((entry) => entry.name);
    } catch (error) {
      if (isMissing(error)) return [];
      throw error;
    }
  },

  async totalBytes() {
    const keys = await this.list();
    let total = 0;

    for (const key of keys) {
      try {
        total += (await stat(resolveKey(key))).size;
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
    }

    return total;
  },
};

/** Temp files older than this are debris from a crashed write, not work in progress. */
const TEMP_FILE_MAX_AGE_MS = 60 * 60 * 1000;

/** Clears `.part` files left behind by writes that died before their rename. */
export async function purgeStaleTempFiles(now = Date.now()): Promise<number> {
  let removed = 0;

  let entries: string[];
  try {
    entries = await readdir(TEMP_DIR);
  } catch (error) {
    if (isMissing(error)) return 0;
    throw error;
  }

  for (const name of entries) {
    const fullPath = path.join(TEMP_DIR, name);
    try {
      const info = await stat(fullPath);
      if (now - info.mtimeMs < TEMP_FILE_MAX_AGE_MS) continue;
      await rm(fullPath, { force: true });
      removed += 1;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }

  return removed;
}
