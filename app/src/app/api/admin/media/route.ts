import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mediaUrl } from "@/lib/media/config";
import { logError } from "@/lib/media/log";
import { deleteImage } from "@/lib/media/service";

export const runtime = "nodejs";

/**
 * The library is a database query, not a directory listing.
 *
 * The previous implementation read the upload directory with `readdir`, which
 * meant the filesystem was the source of truth and nothing could tell a real
 * image from a stray file. Listing PENDING rows is likewise avoided: an upload
 * that never completed is not something to offer an admin.
 */
export async function GET() {
  try {
    const authUser = await getCurrentUser();

    if (authUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.media.findMany({
      where: { status: "READY", storageKey: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storageKey: true,
        sizeBytes: true,
        width: true,
        height: true,
        purpose: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      files: rows.map((row) => ({
        id: row.id,
        url: mediaUrl(row.storageKey as string),
        size: row.sizeBytes ?? 0,
        width: row.width ?? 0,
        height: row.height ?? 0,
        purpose: row.purpose,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logError("library.list.failed", {}, error);
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
  }
}

/**
 * Deletes by media id, through the same service every other caller uses, so the
 * file and its row can never go out of step.
 *
 * Note this does not check whether the image is still in use. Deleting an image
 * a product is showing leaves that product with a broken picture — the same
 * behaviour as before, and the admin asked for it explicitly.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();

    if (authUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No image specified" }, { status: 400 });
    }

    const removed = await deleteImage(id);

    if (!removed) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("library.delete.failed", {}, error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
