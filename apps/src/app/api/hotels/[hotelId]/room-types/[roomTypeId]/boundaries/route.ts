import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { bahtToSatang, satangToBaht } from "@/utils/currency";

const boundariesSchema = z
  .object({
    minPrice: z.number().min(0, "ราคาต่ำสุดต้องไม่ติดลบ"),
    maxPrice: z.number().min(0, "ราคาสูงสุดต้องไม่ติดลบ"),
    maxDiscountPercent: z
      .number()
      .min(0)
      .max(100, "% ลดต้องอยู่ระหว่าง 0-100")
      .optional(),
  })
  .refine((data) => data.minPrice < data.maxPrice, {
    message: "ราคาต่ำสุดต้องน้อยกว่าราคาสูงสุด",
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
    const parsed = boundariesSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "INVALID_BOUNDARIES" },
        { status: 400 }
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
    });

    if (!roomType) {
      return NextResponse.json(
        { error: "ไม่พบ room type", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { minPrice, maxPrice, maxDiscountPercent } = parsed.data;

    const updated = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        minPrice: bahtToSatang(minPrice),
        maxPrice: bahtToSatang(maxPrice),
        maxDiscountPercent: maxDiscountPercent ?? null,
      },
    });

    logger.info("Pricing boundaries updated", {
      userId: session!.user.id,
      hotelId,
      action: "update_boundaries",
      roomTypeId,
    });

    return NextResponse.json({
      message: "ตั้งค่ากรอบราคาสำเร็จ",
      pricingBoundaries: {
        minPrice: updated.minPrice ? satangToBaht(updated.minPrice) : null,
        maxPrice: updated.maxPrice ? satangToBaht(updated.maxPrice) : null,
        maxDiscountPercent: updated.maxDiscountPercent,
      },
    });
  } catch (err) {
    logger.error("Pricing boundaries update failed", {
      userId: session!.user.id,
      hotelId,
      action: "update_boundaries",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
