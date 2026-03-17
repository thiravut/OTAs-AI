import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { handleWebhook } from "@/lib/channex/webhook-handler";
import type { ChannexWebhookPayload } from "@/lib/channex/types";

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.CHANNEX_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-channex-signature");
      if (!signature) {
        logger.warn("Channex webhook missing signature", {
          action: "webhook_auth_failed",
        });
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 }
        );
      }
      // TODO: implement HMAC verification when Channex docs confirm signature format
    }

    const payload: ChannexWebhookPayload = await request.json();

    // Process async — acknowledge immediately
    handleWebhook(payload).catch((err) => {
      logger.error("Webhook processing failed", {
        action: "webhook_process_failed",
        error: String(err),
      });
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Webhook parse error", {
      action: "webhook_parse_error",
      error: String(err),
    });
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }
}
