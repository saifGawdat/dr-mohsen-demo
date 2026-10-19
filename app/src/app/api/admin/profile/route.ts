import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, rotateSession, unauthorized, verifyPassword } from "@/lib/auth";
import { emailSchema, passwordSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = profileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const { name, email, currentPassword, newPassword } = parsed.data;
  const data: { name?: string; email?: string; password?: string } = {};

  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;

  if (newPassword !== undefined && newPassword !== "") {
    const check = passwordSchema.safeParse(newPassword);
    if (!check.success) {
      return NextResponse.json({ error: check.error.issues[0]?.message }, { status: 400 });
    }

    // A password change requires the current one. The comparison reads the
    // stored hash fresh — not the session — so a stolen tab cannot re-key.
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { password: true },
    });

    if (!dbUser?.password || !(await verifyPassword(currentPassword ?? "", dbUser.password))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    data.password = await hashPassword(newPassword);
  }

  const user = await prisma.user.update({
    where: { id: authUser.id },
    data,
    select: { id: true, name: true, email: true },
  });

  // A password change invalidates other devices; a name change does not need to.
  if (data.password) await rotateSession(authUser.id);

  return NextResponse.json({ user });
}
