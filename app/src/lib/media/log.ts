/**
 * Deliberately thin. Media operations are rare and low-volume, so structured
 * console lines are enough to answer "did that upload work" from `docker logs`
 * without adding a logging dependency to a small server.
 *
 * Never given a filesystem path, a credential, or image bytes — ids and counts
 * only, so the log stays safe to read and to share.
 */
type Fields = Record<string, string | number | boolean | undefined>;

function format(event: string, fields: Fields): string {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);

  return `[media] ${event}${parts.length ? " " + parts.join(" ") : ""}`;
}

export function logInfo(event: string, fields: Fields = {}): void {
  console.log(format(event, fields));
}

export function logError(event: string, fields: Fields = {}, error?: unknown): void {
  const reason = error instanceof Error ? error.message : error ? String(error) : undefined;
  console.error(format(event, { ...fields, reason }));
}
