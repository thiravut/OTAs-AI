import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string; connectionId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId, connectionId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  const connection = await prisma.otaConnection.findFirst({
    where: { id: connectionId, hotelId },
  });

  if (!connection) {
    return NextResponse.json(
      { error: "ไม่พบการเชื่อมต่อ", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  await prisma.otaConnection.update({
    where: { id: connectionId },
    data: { status: "DISCONNECTED" },
  });

  const label = connection.otaName === "agoda" ? "Agoda" : "Booking.com";

  logger.info("OTA disconnected", {
    userId: session!.user.id,
    hotelId,
    action: "ota_disconnect",
    otaName: connection.otaName,
  });

  return NextResponse.json({
    message: `ยกเลิกการเชื่อมต่อ ${label} สำเร็จ`,
  });
}
