import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const REJECTION_REASONS = [
  "LOCAL_EVENT",
  "PRICE_TOO_HIGH",
  "PRICE_TOO_LOW",
  "MARKET_KNOWLEDGE",
  "OTHER",
] as const;

const rejectSchema = z.object({
  rejectionReason: z.enum(REJECTION_REASONS),
  rejectionNote: z.string().optional(),
});

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ hotelId: string; recommendationId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId, recommendationId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { rejectionReason, rejectionNote } = parsed.data;

    // Require note for "OTHER"
    if (rejectionReason === "OTHER" && !rejectionNote) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผลเพิ่มเติม", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const rec = await prisma.recommendation.findFirst({
      where: { id: recommendationId, hotelId },
    });

    if (!rec) {
      return NextResponse.json(
        { error: "ไม่พบคำแนะนำ", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (rec.status !== "PENDING") {
      if (rec.status === "EXPIRED") {
        return NextResponse.json(
          {
            error: "คำแนะนำนี้หมดอายุแล้ว",
            code: "RECOMMENDATION_EXPIRED",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "คำแนะนำนี้ถูกดำเนินการแล้ว", code: "ALREADY_DECIDED" },
        { status: 409 }
      );
    }

    const updated = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        status: "REJECTED",
        rejectionReason,
        rejectionNote: rejectionNote ?? null,
        decidedAt: new Date(),
        decidedById: session!.user.id,
      },
      include: {
        decidedBy: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        hotelId,
        userId: session!.user.id,
        action: "recommendation_rejected",
        entityType: "Recommendation",
        entityId: recommendationId,
        details: JSON.parse(
          JSON.stringify({ rejectionReason, rejectionNote })
        ),
      },
    });

    logger.info("Recommendation rejected", {
      userId: session!.user.id,
      hotelId,
      action: "reject_recommendation",
      rejectionReason,
    });

    return NextResponse.json({
      message: "ปฏิเสธแล้ว ขอบคุณสำหรับ feedback",
      recommendation: {
        id: updated.id,
        status: "rejected",
        rejectionReason: updated.rejectionReason?.toLowerCase(),
        rejectionNote: updated.rejectionNote,
        decidedAt: updated.decidedAt,
        decidedBy: updated.decidedBy,
      },
    });
  } catch (err) {
    logger.error("Recommendation rejection failed", {
      userId: session!.user.id,
      hotelId,
      action: "reject_recommendation",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
