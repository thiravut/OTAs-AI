import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { bahtToSatang } from "@/utils/currency";
import * as channex from "./client";

export async function syncHotelData(hotelId: string) {
  const connections = await prisma.otaConnection.findMany({
    where: { hotelId, status: { not: "DISCONNECTED" } },
  });

  if (connections.length === 0) {
    logger.info("No active OTA connections, skipping sync", {
      hotelId,
      action: "sync_skip",
    });
    return;
  }

  for (const conn of connections) {
    await syncOtaConnection(hotelId, conn.id, conn.channexPropertyId, conn.otaName);
  }
}

async function syncOtaConnection(
  hotelId: string,
  connectionId: string,
  propertyId: string,
  otaName: string
) {
  const syncLog = await prisma.syncLog.create({
    data: {
      hotelId,
      otaName,
      syncType: "full",
      status: "RUNNING",
    },
  });

  try {
    // Sync rates
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateTo = futureDate.toISOString().split("T")[0];

    const rates = await channex.getPropertyRates(propertyId, today, dateTo);

    // Get room type mappings for this hotel/OTA
    const mappings = await prisma.otaRoomMapping.findMany({
      where: { roomType: { hotelId }, otaName },
      include: { roomType: true },
    });

    const mappingByOtaId = new Map(
      mappings.map((m) => [m.otaRoomTypeId, m])
    );

    let rateCount = 0;
    for (const rate of rates) {
      const mapping = mappingByOtaId.get(rate.roomTypeId);
      if (!mapping) continue;

      await prisma.rateSnapshot.upsert({
        where: {
          roomTypeId_otaName_date: {
            roomTypeId: mapping.roomTypeId,
            otaName,
            date: new Date(rate.date),
          },
        },
        update: {
          price: bahtToSatang(rate.rate),
          currency: rate.currency,
          syncedAt: new Date(),
        },
        create: {
          roomTypeId: mapping.roomTypeId,
          hotelId,
          otaName,
          date: new Date(rate.date),
          price: bahtToSatang(rate.rate),
          currency: rate.currency,
        },
      });
      rateCount++;
    }

    // Sync bookings
    const bookings = await channex.getPropertyBookings(propertyId);

    let bookingCount = 0;
    for (const booking of bookings) {
      const mapping = mappingByOtaId.get(booking.roomTypeId);

      await prisma.booking.upsert({
        where: { channexBookingId: booking.id },
        update: {
          status:
            booking.status === "cancelled" ? "CANCELLED" :
            booking.status === "modified" ? "MODIFIED" : "CONFIRMED",
          totalPrice: bahtToSatang(booking.totalPrice),
          guestName: booking.guestName,
          updatedAt: new Date(),
        },
        create: {
          hotelId,
          channexBookingId: booking.id,
          otaName: booking.otaName || otaName,
          roomTypeId: mapping?.roomTypeId ?? null,
          guestName: booking.guestName,
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          status: "CONFIRMED",
          totalPrice: bahtToSatang(booking.totalPrice),
          currency: booking.currency,
          rawData: booking.rawData ? JSON.parse(JSON.stringify(booking.rawData)) : undefined,
        },
      });
      bookingCount++;
    }

    // Update connection status
    await prisma.otaConnection.update({
      where: { id: connectionId },
      data: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        lastError: null,
        retryCount: 0,
      },
    });

    // Complete sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        itemCount: rateCount + bookingCount,
        completedAt: new Date(),
      },
    });

    logger.info("OTA sync completed", {
      hotelId,
      action: "sync_complete",
      otaName,
      rateCount,
      bookingCount,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Update connection status
    const conn = await prisma.otaConnection.findUnique({
      where: { id: connectionId },
    });

    await prisma.otaConnection.update({
      where: { id: connectionId },
      data: {
        status: "ERROR",
        lastError: errMsg,
        retryCount: (conn?.retryCount ?? 0) + 1,
      },
    });

    // Fail sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        error: errMsg,
        completedAt: new Date(),
      },
    });

    logger.error("OTA sync failed", {
      hotelId,
      action: "sync_failed",
      otaName,
      error: errMsg,
    });
  }
}

export async function syncAllHotels() {
  const hotels = await prisma.hotel.findMany({
    where: {
      deletedAt: null,
      otaConnections: { some: { status: { not: "DISCONNECTED" } } },
    },
    select: { id: true },
  });

  logger.info(`Starting sync for ${hotels.length} hotels`, {
    action: "sync_all_start",
  });

  for (const hotel of hotels) {
    await syncHotelData(hotel.id);
  }

  logger.info(`Sync completed for ${hotels.length} hotels`, {
    action: "sync_all_complete",
  });
}
