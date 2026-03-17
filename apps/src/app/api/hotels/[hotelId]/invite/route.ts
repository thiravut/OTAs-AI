import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const inviteSchema = z.object({
  email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
  role: z.enum(["REVENUE_MANAGER", "FRONT_DESK"], {
    error: "role ต้องเป็น REVENUE_MANAGER หรือ FRONT_DESK",
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  // Only OWNER and SYSTEM_ADMIN can invite
  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if user already has access
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingAccess = await prisma.hotelUser.findUnique({
        where: {
          userId_hotelId: { userId: existingUser.id, hotelId },
        },
      });

      if (existingAccess) {
        return NextResponse.json(
          {
            error: "ผู้ใช้นี้มีสิทธิ์เข้าถึงโรงแรมนี้อยู่แล้ว",
            code: "ALREADY_MEMBER",
          },
          { status: 409 }
        );
      }
    }

    // Check existing pending invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email_hotelId: { email, hotelId } },
    });

    if (existingInvitation && existingInvitation.status === "PENDING") {
      // Update existing invitation
      await prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else if (existingInvitation) {
      // Re-create expired/accepted invitation
      await prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          role,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await prisma.invitation.create({
        data: {
          email,
          hotelId,
          role,
          senderId: session!.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // If user already registered, auto-accept invitation
    if (existingUser) {
      await prisma.hotelUser.create({
        data: {
          userId: existingUser.id,
          hotelId,
          role,
        },
      });

      await prisma.invitation.update({
        where: { email_hotelId: { email, hotelId } },
        data: { status: "ACCEPTED" },
      });

      logger.info("Invitation auto-accepted (user exists)", {
        userId: session!.user.id,
        hotelId,
        action: "invite_user",
        invitedEmail: email,
      });
    } else {
      logger.info("Invitation sent", {
        userId: session!.user.id,
        hotelId,
        action: "invite_user",
        invitedEmail: email,
      });
    }

    return NextResponse.json(
      {
        message: `ส่งคำเชิญไปยัง ${email} แล้ว`,
        invitation: {
          email,
          role,
          status: existingUser ? "ACCEPTED" : "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Invitation failed", {
      userId: session!.user.id,
      hotelId,
      action: "invite_user",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
