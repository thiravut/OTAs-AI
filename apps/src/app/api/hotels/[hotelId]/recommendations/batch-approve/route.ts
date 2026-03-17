import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const batchSchema = z.object({
  recommendationIds: z.array(z.string().uuid()).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { recommendationIds } = parsed.data;
    const results: { id: string; status: string }[] = [];
    let approved = 0;
    let failed = 0;

    for (const id of recommendationIds) {
      const rec = await prisma.recommendation.findFirst({
        where: { id, hotelId, status: "PENDING" },
      });

      if (!rec || new Date() > rec.expiresAt) {
        results.push({ id, status: "failed" });
        failed++;
        continue;
      }

      await prisma.recommendation.update({
        where: { id },
        data: {
          status: "APPROVED",
          decidedAt: new Date(),
          decidedById: session!.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          hotelId,
          userId: session!.user.id,
          action: "recommendation_approved",
          entityType: "Recommendation",
          entityId: id,
        },
      });

      results.push({ id, status: "approved" });
      approved++;
    }

    logger.info("Batch approve completed", {
      userId: session!.user.id,
      hotelId,
      action: "batch_approve",
      approved,
      failed,
    });

    return NextResponse.json({
      message: `อนุมัติ ${approved} รายการสำเร็จ`,
      approved,
      failed,
      results,
      note: "กรุณาไปปรับราคาบน OTA ด้วยตัวเอง (MVP-0)",
    });
  } catch (err) {
    logger.error("Batch approve failed", {
      userId: session!.user.id,
      hotelId,
      action: "batch_approve",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
