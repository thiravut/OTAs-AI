import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { bahtToSatang } from "@/utils/currency";
import type { ChannexWebhookPayload, ChannexBooking } from "./types";

export async function handleWebhook(payload: ChannexWebhookPayload) {
  const { event, property_id } = payload;

  logger.info("Channex webhook received", {
    action: "webhook_received",
    event,
    propertyId: property_id,
  });

  // Find hotel by channex property ID
  const connection = await prisma.otaConnection.findFirst({
    where: { channexPropertyId: property_id },
    include: { hotel: true },
  });

  if (!connection) {
    logger.warn("Webhook for unknown property", {
      action: "webhook_unknown_property",
      propertyId: property_id,
    });
    return;
  }

  const hotelId = connection.hotelId;

  switch (event) {
    case "booking_created":
    case "booking_modified":
    case "booking_cancelled":
      await handleBookingEvent(hotelId, event, payload.data as ChannexBooking);
      break;
    default:
      logger.info("Unhandled webhook event", {
        action: "webhook_unhandled",
        event,
        hotelId,
      });
  }
}

async function handleBookingEvent(
  hotelId: string,
  event: string,
  booking: ChannexBooking
) {
  // Idempotent: check if already processed
  const existing = await prisma.booking.findUnique({
    where: { channexBookingId: booking.id },
  });

  const status =
    event === "booking_cancelled"
      ? "CANCELLED"
      : event === "booking_modified"
        ? "MODIFIED"
        : "CONFIRMED";

  // Find room type mapping
  const mapping = await prisma.otaRoomMapping.findFirst({
    where: {
      otaRoomTypeId: booking.roomTypeId,
      roomType: { hotelId },
    },
  });

  if (existing) {
    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: status as "CONFIRMED" | "CANCELLED" | "MODIFIED",
        totalPrice: bahtToSatang(booking.totalPrice),
        guestName: booking.guestName,
        rawData: booking.rawData ? JSON.parse(JSON.stringify(booking.rawData)) : undefined,
      },
    });
  } else {
    await prisma.booking.create({
      data: {
        hotelId,
        channexBookingId: booking.id,
        otaName: booking.otaName,
        roomTypeId: mapping?.roomTypeId ?? null,
        guestName: booking.guestName,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        status: status as "CONFIRMED" | "CANCELLED" | "MODIFIED",
        totalPrice: bahtToSatang(booking.totalPrice),
        currency: booking.currency,
        rawData: booking.rawData ? JSON.parse(JSON.stringify(booking.rawData)) : undefined,
      },
    });
  }

  logger.info("Booking event processed", {
    hotelId,
    action: "webhook_booking_processed",
    event,
    bookingId: booking.id,
  });
}
