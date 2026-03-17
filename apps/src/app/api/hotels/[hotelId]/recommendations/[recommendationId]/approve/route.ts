import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

export async function POST(
  _request: Request,
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
        { error: "คำแนะนำนี้หมดอายุแล้ว", code: "RECOMMENDATION_EXPIRED" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "คำแนะนำนี้ถูกดำเนินการแล้ว", code: "ALREADY_DECIDED" },
      { status: 409 }
    );
  }

  // Check expiry
  if (new Date() > rec.expiresAt) {
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "คำแนะนำนี้หมดอายุแล้ว", code: "RECOMMENDATION_EXPIRED" },
      { status: 400 }
    );
  }

  const updated = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      status: "APPROVED",
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
      action: "recommendation_approved",
      entityType: "Recommendation",
      entityId: recommendationId,
    },
  });

  logger.info("Recommendation approved", {
    userId: session!.user.id,
    hotelId,
    action: "approve_recommendation",
  });

  return NextResponse.json({
    message: "อนุมัติแล้ว",
    recommendation: {
      id: updated.id,
      status: "approved",
      decidedAt: updated.decidedAt,
      decidedBy: updated.decidedBy,
    },
    note: "กรุณาไปปรับราคาบน OTA ด้วยตัวเอง (MVP-0)",
  });
}
