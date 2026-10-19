import prisma from "@/lib/prisma";
import { cleanupIntervalDays, pendingTtlHours, unreferencedTtlHours } from "./config";
import { logError, logInfo } from "./log";
import {
  REFERENCE_SOURCE_COUNT,
  collectReferencedMediaIds,
  filenamesForId,
} from "./references";
import { filesystemStorage, purgeStaleTempFiles, type ImageStorage } from "./storage";

export interface CleanupPassResult {
  /** Rows or files that matched the pass. */
  candidates: number;
  /** How many were actually removed. Equals 0 in a dry run. */
  removed: number;
  /** Ones that threw. The pass continues past them; they are retried next run. */
  failed: number;
}

export interface CleanupReport {
  dryRun: boolean;
  stalePending: CleanupPassResult;
  unreferenced: CleanupPassResult;
  untrackedFiles: CleanupPassResult;
  staleTempFiles: number;
  pendingTtlHours: number;
  unreferencedTtlHours: number;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Removes the stored file for a media id. A row's actual storageKey is
 * authoritative when present; otherwise both possible derived names (image and
 * document) are tried, because a crashed upload could have been either.
 */
async function removeStoredKey(
  storage: ImageStorage,
  storageKey: string | null,
  id: string
): Promise<void> {
  if (storageKey) {
    await storage.remove(storageKey);
    return;
  }
  for (const key of filenamesForId(id)) {
    await storage.remove(key);
  }
}

/**
 * Pass 1 — rows that never finished.
 *
 * A PENDING row older than the TTL is an upload whose process died between
 * reserving the row and publishing it. The file may or may not exist; both are
 * expected, so a missing file is not an error.
 */
async function sweepStalePending(
  storage: ImageStorage,
  dryRun: boolean
): Promise<CleanupPassResult> {
  const cutoff = hoursAgo(pendingTtlHours());

  const rows = await prisma.media.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true, storageKey: true },
  });

  const result: CleanupPassResult = { candidates: rows.length, removed: 0, failed: 0 };

  for (const row of rows) {
    if (dryRun) continue;

    try {
      // File first, then the row — a crash between the two leaves a row with no
      // file, which the next run can still find and finish.
      await removeStoredKey(storage, row.storageKey, row.id);
      await prisma.media.delete({ where: { id: row.id } });
      result.removed += 1;
    } catch (error) {
      // One bad row must not abandon the rest of the sweep.
      result.failed += 1;
      logError("cleanup.pending.failed", { id: row.id }, error);
    }
  }

  return result;
}

/**
 * Pass 2 — finished files nothing points at any more.
 *
 * IMPORTANT — Any new table or column that can hold a media URL must be added to
 * REFERENCE_SOURCES in ./references.ts, or the images it points at will be
 * incorrectly deleted as unreferenced. Images are referenced by URL string
 * rather than by a foreign key, so the database cannot enforce this for us.
 *
 * The age check is what makes this safe against the ordinary case of an admin
 * who has uploaded an image but not yet saved the form that will reference it:
 * such a row is unreferenced and entirely legitimate, and is left alone until it
 * is old enough that no editing session could still be holding it.
 */
async function sweepUnreferenced(
  storage: ImageStorage,
  dryRun: boolean
): Promise<CleanupPassResult> {
  const cutoff = hoursAgo(unreferencedTtlHours());

  // Read every reference before deleting anything, so nothing is judged against
  // a half-built picture of what is in use.
  const referenced = await collectReferencedMediaIds();

  const rows = await prisma.media.findMany({
    where: { status: "READY", createdAt: { lt: cutoff } },
    select: { id: true, storageKey: true },
  });

  const orphans = rows.filter((row) => !referenced.has(row.id));
  const result: CleanupPassResult = { candidates: orphans.length, removed: 0, failed: 0 };

  for (const row of orphans) {
    if (dryRun) continue;

    try {
      await removeStoredKey(storage, row.storageKey, row.id);
      await prisma.media.delete({ where: { id: row.id } });
      result.removed += 1;
    } catch (error) {
      result.failed += 1;
      logError("cleanup.unreferenced.failed", { id: row.id }, error);
    }
  }

  return result;
}

/**
 * Pass 3 — files on disk with no row at all.
 *
 * The upload flow makes this state unreachable, so anything found here means
 * something wrote to the upload directory outside the service, or a row was
 * deleted directly. It is kept as a backstop and logged loudly, because a hit is
 * a signal that an assumption has broken rather than routine housekeeping.
 */
async function sweepUntrackedFiles(
  storage: ImageStorage,
  dryRun: boolean
): Promise<CleanupPassResult> {
  const files = await storage.list();
  if (files.length === 0) {
    return { candidates: 0, removed: 0, failed: 0 };
  }

  const known = await prisma.media.findMany({ select: { id: true, storageKey: true } });
  const knownKeys = new Set<string>();
  for (const row of known) {
    for (const key of (row.storageKey ? [row.storageKey] : filenamesForId(row.id))) knownKeys.add(key);
  }

  const untracked = files.filter((name) => !knownKeys.has(name));
  const result: CleanupPassResult = { candidates: untracked.length, removed: 0, failed: 0 };

  if (untracked.length > 0) {
    logError("cleanup.untracked.detected", { count: untracked.length });
  }

  for (const name of untracked) {
    if (dryRun) continue;

    try {
      await storage.remove(name);
      result.removed += 1;
    } catch (error) {
      result.failed += 1;
      logError("cleanup.untracked.failed", { file: name }, error);
    }
  }

  return result;
}

/**
 * Runs every pass. Safe to call as often as wanted; it does nothing when there
 * is nothing outstanding.
 *
 * `dryRun` reports exactly what would be removed and touches nothing, which is
 * the intended way to check the sweep before letting it delete anything.
 */
export async function cleanupMedia(
  { dryRun = false }: { dryRun?: boolean } = {},
  storage: ImageStorage = filesystemStorage
): Promise<CleanupReport> {
  const stalePending = await sweepStalePending(storage, dryRun);
  const unreferenced = await sweepUnreferenced(storage, dryRun);
  const untrackedFiles = await sweepUntrackedFiles(storage, dryRun);
  const staleTempFiles = dryRun ? 0 : await purgeStaleTempFiles();

  const report: CleanupReport = {
    dryRun,
    stalePending,
    unreferenced,
    untrackedFiles,
    staleTempFiles,
    pendingTtlHours: pendingTtlHours(),
    unreferencedTtlHours: unreferencedTtlHours(),
  };

  // Logged on every run, including quiet ones, so silence in the logs means the
  // job is not running rather than that it found nothing.
  logInfo("cleanup.run", {
    dryRun,
    sourcesScanned: REFERENCE_SOURCE_COUNT,
    pendingCandidates: stalePending.candidates,
    pendingRemoved: stalePending.removed,
    pendingFailed: stalePending.failed,
    unreferencedCandidates: unreferenced.candidates,
    unreferencedRemoved: unreferenced.removed,
    unreferencedFailed: unreferenced.failed,
    untrackedCandidates: untrackedFiles.candidates,
    untrackedRemoved: untrackedFiles.removed,
    staleTempFiles,
  });

  return report;
}

/**
 * ---------------------------------------------------------------------------
 * Self-scheduling
 * ---------------------------------------------------------------------------
 *
 * The sweep is also exposed as `/api/cron/media-cleanup` for an external
 * scheduler, but nothing schedules it on a plain container host: `vercel.json`
 * is read only by Vercel. Rather than depend on a platform feature, the server
 * runs it itself — started from `src/instrumentation.ts` when the Node server
 * boots.
 */

const CLEANUP_JOB_NAME = "media-cleanup";

/**
 * How often the process wakes to ask whether the sweep is due. Deliberately far
 * shorter than the interval itself: the schedule lives in the database, so a
 * cheap hourly question is what lets a container which restarts several times a
 * day still honour a multi-day cadence.
 */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Delay before the first check. A boot has just run `db:deploy` and the seeder;
 * there is nothing to gain from competing with them, and a sweep is never
 * urgent.
 */
const FIRST_CHECK_DELAY_MS = 5 * 60 * 1000;

/**
 * Takes the run, or declines it.
 *
 * The conditional UPDATE is the entire concurrency control. It matches only a
 * row that is genuinely due and the database serialises the writers, so however
 * many containers ask at the same moment, exactly one is told to proceed.
 *
 * `lastRunAt` moves before the sweep rather than after it. A sweep that throws
 * therefore waits a full interval instead of being retried on the next tick,
 * which is the safer failure: a cleanup that is failing should not be run in a
 * loop.
 */
async function claimCleanupRun(): Promise<boolean> {
  const cutoff = new Date(
    Date.now() - cleanupIntervalDays() * 24 * 60 * 60 * 1000
  );

  const { count } = await prisma.scheduledJobRun.updateMany({
    where: { name: CLEANUP_JOB_NAME, lastRunAt: { lt: cutoff } },
    data: { lastRunAt: new Date() },
  });

  if (count > 0) return true;

  // No row at all means this is the first boot to get here. Start the clock now
  // instead of sweeping immediately: a newly deployed shop should get a full
  // interval to have its images uploaded before anything is reclaimed.
  // `skipDuplicates` covers two containers booting together.
  await prisma.scheduledJobRun.createMany({
    data: { name: CLEANUP_JOB_NAME, lastRunAt: new Date() },
    skipDuplicates: true,
  });

  return false;
}

async function cleanupTick(): Promise<void> {
  try {
    if (!(await claimCleanupRun())) return;

    const report = await cleanupMedia();
    logInfo("cleanup.scheduled.ran", {
      intervalDays: cleanupIntervalDays(),
      pendingRemoved: report.stalePending.removed,
      unreferencedRemoved: report.unreferenced.removed,
      untrackedRemoved: report.untrackedFiles.removed,
    });
  } catch (error) {
    // A database that is briefly unreachable, or a sweep that throws, must never
    // take the web server down with it. Logged and retried on the next tick.
    logError("cleanup.scheduled.failed", {}, error);
  }
}

/** Guards against a second start from a hot reload in development. */
let cleanupScheduleStarted = false;

/**
 * Starts the background schedule. Safe to call more than once; only the first
 * call does anything.
 *
 * Both timers are `unref`d so they never hold the process open — a container
 * asked to stop should stop, not wait out an hour-long timer.
 */
export function startMediaCleanupSchedule(): void {
  if (cleanupScheduleStarted) return;

  if (process.env.MEDIA_CLEANUP_ENABLED === "false") {
    logInfo("cleanup.scheduled.disabled");
    return;
  }

  cleanupScheduleStarted = true;

  setTimeout(() => {
    void cleanupTick();
    setInterval(() => void cleanupTick(), CHECK_INTERVAL_MS).unref();
  }, FIRST_CHECK_DELAY_MS).unref();

  logInfo("cleanup.scheduled.started", {
    intervalDays: cleanupIntervalDays(),
    checkIntervalMinutes: CHECK_INTERVAL_MS / 60000,
  });
}

