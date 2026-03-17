import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      notificationChannel: true,
      lineUserId: true,
      telegramChatId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "ไม่พบผู้ใช้", code: "USER_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  notificationChannel: z.enum(["LINE", "TELEGRAM"]).nullable().optional(),
});

export async function PUT(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session!.user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        notificationChannel: true,
        lineUserId: true,
        telegramChatId: true,
        createdAt: true,
      },
    });

    logger.info("User profile updated", {
      userId: session!.user.id,
      action: "update_profile",
    });

    return NextResponse.json({
      message: "อัปเดตข้อมูลสำเร็จ",
      user,
    });
  } catch (err) {
    logger.error("Profile update failed", {
      userId: session!.user.id,
      action: "update_profile",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
