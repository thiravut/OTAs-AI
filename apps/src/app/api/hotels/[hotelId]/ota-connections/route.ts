import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { verifyConnection } from "@/lib/channex/client";

const SUPPORTED_OTAS = ["agoda", "booking"] as const;

const createConnectionSchema = z.object({
  otaName: z.enum(SUPPORTED_OTAS, {
    error: "OTA ไม่รองรับ กรุณาเลือก agoda หรือ booking",
  }),
  channexPropertyId: z.string().min(1, "กรุณากรอก Channex Property ID"),
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
    ["OWNER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = createConnectionSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { otaName, channexPropertyId } = parsed.data;

    // Check duplicate
    const existing = await prisma.otaConnection.findUnique({
      where: { hotelId_otaName: { hotelId, otaName } },
    });

    if (existing && existing.status !== "DISCONNECTED") {
      const label = otaName === "agoda" ? "Agoda" : "Booking.com";
      return NextResponse.json(
        { error: `เชื่อมต่อ ${label} อยู่แล้ว`, code: "OTA_ALREADY_CONNECTED" },
        { status: 409 }
      );
    }

    // Verify connection with Channex
    const isValid = await verifyConnection(channexPropertyId);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "ไม่สามารถเชื่อมต่อ Channex ได้ กรุณาตรวจสอบ Property ID",
          code: "CONNECTION_FAILED",
        },
        { status: 400 }
      );
    }

    // Create or reactivate connection
    const connection = existing
      ? await prisma.otaConnection.update({
          where: { id: existing.id },
          data: {
            channexPropertyId,
            status: "CONNECTED",
            lastError: null,
            retryCount: 0,
          },
        })
      : await prisma.otaConnection.create({
          data: { hotelId, otaName, channexPropertyId },
        });

    const label = otaName === "agoda" ? "Agoda" : "Booking.com";

    logger.info("OTA connected", {
      userId: session!.user.id,
      hotelId,
      action: "ota_connect",
      otaName,
    });

    return NextResponse.json(
      {
        message: `เชื่อมต่อ ${label} สำเร็จ`,
        connection: {
          id: connection.id,
          otaName: connection.otaName,
          status: connection.status,
          lastSyncAt: connection.lastSyncAt,
          createdAt: connection.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("OTA connection failed", {
      userId: session!.user.id,
      hotelId,
      action: "ota_connect",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  const connections = await prisma.otaConnection.findMany({
    where: { hotelId, status: { not: "DISCONNECTED" } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: connections.map((c) => ({
      id: c.id,
      otaName: c.otaName,
      status: c.status,
      lastSyncAt: c.lastSyncAt,
      lastError: c.lastError,
    })),
  });
}
