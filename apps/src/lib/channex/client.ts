import { logger } from "@/lib/logger";
import { withRetry } from "@/utils/retry";
import type {
  ChannexProperty,
  ChannexRoomType,
  ChannexRate,
  ChannexBooking,
  ChannexRateUpdate,
  ChannexRateUpdateResult,
} from "./types";
import {
  getMockProperties,
  getMockRoomTypes,
  getMockRates,
  getMockBookings,
  mockUpdateRates,
} from "./mock";

const CHANNEX_API_BASE = "https://app.channex.io/api/v1";

function isUsingMock(): boolean {
  return !process.env.CHANNEX_API_KEY || process.env.USE_MOCK_CHANNEX === "true";
}

async function channexFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.CHANNEX_API_KEY;
  if (!apiKey) throw new Error("CHANNEX_API_KEY is not configured");

  const url = `${CHANNEX_API_BASE}${path}`;
  const startTime = Date.now();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "user-api-key": apiKey,
      ...options.headers,
    },
  });

  const elapsed = Date.now() - startTime;

  logger.info("Channex API call", {
    action: "channex_api",
    path,
    method: options.method ?? "GET",
    status: response.status,
    elapsedMs: elapsed,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Channex API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function listProperties(): Promise<ChannexProperty[]> {
  if (isUsingMock()) return getMockProperties();

  return withRetry(
    () =>
      channexFetch<{ data: ChannexProperty[] }>("/properties").then(
        (r) => r.data
      ),
    { context: "channex.listProperties" }
  );
}

export async function getPropertyRoomTypes(
  propertyId: string
): Promise<ChannexRoomType[]> {
  if (isUsingMock()) return getMockRoomTypes(propertyId);

  return withRetry(
    () =>
      channexFetch<{ data: ChannexRoomType[] }>(
        `/properties/${propertyId}/room_types`
      ).then((r) => r.data),
    { context: "channex.getPropertyRoomTypes" }
  );
}

export async function getPropertyRates(
  propertyId: string,
  dateFrom: string,
  dateTo: string
): Promise<ChannexRate[]> {
  if (isUsingMock()) return getMockRates(propertyId, dateFrom, dateTo);

  return withRetry(
    () =>
      channexFetch<{ data: ChannexRate[] }>(
        `/properties/${propertyId}/rates?date_from=${dateFrom}&date_to=${dateTo}`
      ).then((r) => r.data),
    { context: "channex.getPropertyRates" }
  );
}

export async function getPropertyBookings(
  propertyId: string
): Promise<ChannexBooking[]> {
  if (isUsingMock()) return getMockBookings(propertyId);

  return withRetry(
    () =>
      channexFetch<{ data: ChannexBooking[] }>(
        `/properties/${propertyId}/bookings`
      ).then((r) => r.data),
    { context: "channex.getPropertyBookings" }
  );
}

/** Push a single rate update to Channex */
export async function updateRate(
  propertyId: string,
  update: ChannexRateUpdate
): Promise<ChannexRateUpdateResult> {
  return updateRates(propertyId, [update]).then((r) => r[0]);
}

/** Push multiple rate updates in a single Channex API call */
export async function updateRates(
  propertyId: string,
  updates: ChannexRateUpdate[]
): Promise<ChannexRateUpdateResult[]> {
  if (isUsingMock()) return mockUpdateRates(updates);

  return withRetry(
    async () => {
      const body = {
        rates: updates.map((u) => ({
          room_type_id: u.roomTypeId,
          date: u.date,
          rate: u.rate,
          currency: u.currency,
        })),
      };

      await channexFetch(`/properties/${propertyId}/rates`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      return updates.map((u) => ({
        success: true,
        roomTypeId: u.roomTypeId,
        date: u.date,
      }));
    },
    { context: "channex.updateRates" }
  );
}

export async function verifyConnection(
  propertyId: string
): Promise<boolean> {
  try {
    if (isUsingMock()) return true;
    await listProperties();
    const roomTypes = await getPropertyRoomTypes(propertyId);
    return roomTypes.length >= 0;
  } catch {
    return false;
  }
}
