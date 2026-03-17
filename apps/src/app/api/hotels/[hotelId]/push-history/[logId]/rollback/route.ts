import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { rollbackPrice } from "@/lib/channex/push";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string; logId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId, logId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  // Verify log belongs to this hotel
  const log = await prisma.priceUpdateLog.findFirst({
    where: { id: logId, hotelId },
  });

  if (!log) {
    return NextResponse.json(
      { error: "ไม่พบรายการ push นี้", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (log.status !== "SUCCESS") {
    return NextResponse.json(
      { error: "สามารถ rollback ได้เฉพาะรายการที่ push สำเร็จเท่านั้น", code: "INVALID_STATUS" },
      { status: 400 }
    );
  }

  const result = await rollbackPrice(logId);

  // Audit log
  await prisma.auditLog.create({
    data: {
      hotelId,
      userId: session!.user.id,
      action: "price_rollback",
      entityType: "PriceUpdateLog",
      entityId: logId,
      details: { success: result.success, error: result.error },
    },
  });

  if (result.success) {
    logger.info("Price rollback completed", {
      userId: session!.user.id,
      hotelId,
      logId,
      action: "rollback_price",
    });

    return NextResponse.json({
      message: "Rollback ราคาสำเร็จ — ราคาเดิมถูก push กลับไป OTA แล้ว",
      success: true,
    });
  }

  return NextResponse.json(
    {
      error: result.error ?? "ไม่สามารถ rollback ได้",
      code: "ROLLBACK_FAILED",
    },
    { status: 500 }
  );
}
