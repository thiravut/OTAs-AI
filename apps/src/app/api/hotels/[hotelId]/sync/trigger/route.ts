import { NextResponse } from "next/server";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { syncHotelData } from "@/lib/channex/sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  logger.info("Manual sync triggered", {
    userId: session!.user.id,
    hotelId,
    action: "manual_sync",
  });

  // Run sync in background (don't await)
  syncHotelData(hotelId).catch((err) => {
    logger.error("Manual sync failed", {
      hotelId,
      action: "manual_sync_failed",
      error: String(err),
    });
  });

  return NextResponse.json(
    { message: "กำลังดึงข้อมูลจาก OTA ทั้งหมด" },
    { status: 202 }
  );
}
