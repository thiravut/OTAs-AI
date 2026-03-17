import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้แล้ว", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
      },
    });

    // Accept pending invitations for this email
    const pendingInvitations = await prisma.invitation.findMany({
      where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    });

    for (const invitation of pendingInvitations) {
      await prisma.hotelUser.create({
        data: {
          userId: user.id,
          hotelId: invitation.hotelId,
          role: invitation.role,
        },
      });
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
    }

    logger.info("User registered", {
      userId: user.id,
      action: "register",
      invitationsAccepted: pendingInvitations.length,
    });

    return NextResponse.json(
      {
        message: "ลงทะเบียนสำเร็จ",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration failed", {
      action: "register",
      error: String(error),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
