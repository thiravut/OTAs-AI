import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { satangToBaht } from "@/utils/currency";
import { updateRates } from "./client";
import type { ChannexRateUpdate } from "./types";

export interface PushPriceRequest {
  hotelId: string;
  roomTypeId: string;
  targetDate: string; // YYYY-MM-DD
  newPrice: number; // satang
  triggeredBy: "recommendation_approve" | "manual" | "rule";
  recommendationId?: string;
  userId?: string;
}

export interface PushPriceResult {
  success: boolean;
  otaResults: {
    otaName: string;
    success: boolean;
    error?: string;
  }[];
  logIds: string[];
}

/**
 * Push a price update to all connected OTAs for a room type.
 * Logs every push attempt to PriceUpdateLog.
 */
export async function pushPrice(req: PushPriceRequest): Promise<PushPriceResult> {
  const { hotelId, roomTypeId, targetDate, newPrice, triggeredBy, recommendationId, userId } = req;

  // Find all OTA connections + room mappings for this room type
  const mappings = await prisma.otaRoomMapping.findMany({
    where: { roomTypeId },
  });

  const connections = await prisma.otaConnection.findMany({
    where: {
      hotelId,
      status: "CONNECTED",
      otaName: { in: mappings.map((m) => m.otaName) },
    },
  });

  if (connections.length === 0) {
    logger.warn("No connected OTAs for push", { hotelId, roomTypeId });
    return { success: false, otaResults: [], logIds: [] };
  }

  // Get current price for logging
  const currentSnapshot = await prisma.rateSnapshot.findFirst({
    where: {
      roomTypeId,
      hotelId,
      date: new Date(targetDate),
    },
    orderBy: { syncedAt: "desc" },
  });

  const previousPrice = currentSnapshot?.price ?? 0;
  const priceInBaht = satangToBaht(newPrice);

  const otaResults: PushPriceResult["otaResults"] = [];
  const logIds: string[] = [];

  // Push to each connected OTA
  for (const conn of connections) {
    const mapping = mappings.find((m) => m.otaName === conn.otaName);
    if (!mapping) continue;

    // Create pending log entry
    const log = await prisma.priceUpdateLog.create({
      data: {
        hotelId,
        roomTypeId,
        otaName: conn.otaName,
        targetDate: new Date(targetDate),
        previousPrice,
        newPrice,
        status: "PENDING",
        triggeredBy,
        recommendationId: recommendationId ?? null,
        userId: userId ?? null,
      },
    });

    logIds.push(log.id);

    try {
      const updates: ChannexRateUpdate[] = [
        {
          roomTypeId: mapping.otaRoomTypeId,
          date: targetDate,
          rate: priceInBaht,
          currency: "THB",
        },
      ];

      const results = await updateRates(conn.channexPropertyId, updates);
      const result = results[0];

      if (result?.success) {
        await prisma.priceUpdateLog.update({
          where: { id: log.id },
          data: {
            status: "SUCCESS",
            channexResponse: { pushed: true, otaRoomTypeId: mapping.otaRoomTypeId },
          },
        });

        otaResults.push({ otaName: conn.otaName, success: true });

        logger.info("Price pushed to OTA", {
          action: "price_push_success",
          hotelId,
          otaName: conn.otaName,
          roomTypeId,
          targetDate,
          priceInBaht,
        });
      } else {
        throw new Error(result?.error ?? "Push returned unsuccessful");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await prisma.priceUpdateLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: errorMsg },
      });

      otaResults.push({ otaName: conn.otaName, success: false, error: errorMsg });

      logger.error("Price push failed", {
        action: "price_push_failed",
        hotelId,
        otaName: conn.otaName,
        roomTypeId,
        error: errorMsg,
      });
    }
  }

  const allSuccess = otaResults.every((r) => r.success);
  const anySuccess = otaResults.some((r) => r.success);

  if (anySuccess) {
    logger.info("Price push completed", {
      action: "price_push_complete",
      hotelId,
      roomTypeId,
      targetDate,
      totalOTAs: otaResults.length,
      successful: otaResults.filter((r) => r.success).length,
      failed: otaResults.filter((r) => !r.success).length,
    });
  }

  return { success: allSuccess, otaResults, logIds };
}

/**
 * Rollback a price update — push the previous price back to the OTA.
 */
export async function rollbackPrice(logId: string): Promise<{ success: boolean; error?: string }> {
  const log = await prisma.priceUpdateLog.findUnique({
    where: { id: logId },
    include: { roomType: { include: { otaMappings: true } } },
  });

  if (!log) return { success: false, error: "Log not found" };
  if (log.status !== "SUCCESS") return { success: false, error: "Can only rollback successful pushes" };

  const mapping = log.roomType.otaMappings.find((m) => m.otaName === log.otaName);
  if (!mapping) return { success: false, error: "No OTA mapping found" };

  const conn = await prisma.otaConnection.findFirst({
    where: { hotelId: log.hotelId, otaName: log.otaName, status: "CONNECTED" },
  });

  if (!conn) return { success: false, error: "OTA not connected" };

  try {
    const updates: ChannexRateUpdate[] = [
      {
        roomTypeId: mapping.otaRoomTypeId,
        date: log.targetDate.toISOString().split("T")[0],
        rate: satangToBaht(log.previousPrice),
        currency: "THB",
      },
    ];

    await updateRates(conn.channexPropertyId, updates);

    await prisma.priceUpdateLog.update({
      where: { id: logId },
      data: { status: "ROLLED_BACK" },
    });

    logger.info("Price rollback successful", {
      action: "price_rollback",
      logId,
      otaName: log.otaName,
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Price rollback failed", { action: "price_rollback_failed", logId, error: errorMsg });
    return { success: false, error: errorMsg };
  }
}
