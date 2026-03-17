import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const mappingSchema = z.object({
  otaMappings: z.record(
    z.string(),
    z.object({
      otaRoomTypeId: z.string().min(1),
      otaRoomName: z.string().optional(),
    })
  ),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ hotelId: string; roomTypeId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId, roomTypeId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = mappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify room type belongs to hotel
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
    });

    if (!roomType) {
      return NextResponse.json(
        { error: "ไม่พบ room type", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { otaMappings } = parsed.data;

    // Upsert each OTA mapping
    for (const [otaName, mapping] of Object.entries(otaMappings)) {
      await prisma.otaRoomMapping.upsert({
        where: { roomTypeId_otaName: { roomTypeId, otaName } },
        update: {
          otaRoomTypeId: mapping.otaRoomTypeId,
          otaRoomName: mapping.otaRoomName ?? null,
        },
        create: {
          roomTypeId,
          otaName,
          otaRoomTypeId: mapping.otaRoomTypeId,
          otaRoomName: mapping.otaRoomName ?? null,
        },
      });
    }

    logger.info("Room type mapping updated", {
      userId: session!.user.id,
      hotelId,
      action: "update_room_mapping",
      roomTypeId,
    });

    return NextResponse.json({
      message: "จับคู่ room type สำเร็จ",
      roomType: { id: roomTypeId, name: roomType.name, otaMappings },
    });
  } catch (err) {
    logger.error("Room type mapping failed", {
      userId: session!.user.id,
      hotelId,
      action: "update_room_mapping",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
