import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { syncAllHotels } from "@/lib/channex/sync";

export async function GET(request: Request) {
  // Simple auth: check cron secret header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  logger.info("Cron sync started", { action: "cron_sync_start" });

  try {
    await syncAllHotels();
    return NextResponse.json({ message: "Sync completed" });
  } catch (err) {
    logger.error("Cron sync failed", {
      action: "cron_sync_failed",
      error: String(err),
    });
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
