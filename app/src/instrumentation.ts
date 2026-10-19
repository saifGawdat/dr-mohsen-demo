/**
 * Next.js calls `register` once per server instance, before the first request is
 * handled. It is the only hook the framework offers for work that has to happen
 * on boot rather than on a request, which makes it where background schedules
 * belong.
 *
 * The media cleanup sweep is started here because nothing else would start it.
 * It is exposed as `/api/cron/media-cleanup` for an external scheduler, and
 * listed in `vercel.json`, but that file is read only by Vercel — on a plain
 * container host the route sits there and is never called. Scheduling it in the
 * server keeps the behaviour identical wherever the container runs, with no
 * platform cron to configure and nothing to forget when the app is redeployed.
 */
export async function register(): Promise<void> {
  // Next runs this file in the edge runtime too, which has neither a filesystem
  // nor Prisma. The import is dynamic so that runtime never loads either.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startMediaCleanupSchedule } = await import("@/lib/media/cleanup");
  startMediaCleanupSchedule();
}
