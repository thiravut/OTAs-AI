import { NextResponse } from "next/server";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { generateRecommendations } from "@/lib/ai/recommendation-engine";

export async function POST(
  _request: Request,
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

  logger.info("Manual AI generation triggered", {
    userId: session!.user.id,
    hotelId,
    action: "manual_ai_generate",
  });

  try {
    const recommendations = await generateRecommendations(hotelId);
    return NextResponse.json({
      message: `สร้างคำแนะนำ ${recommendations.length} รายการสำเร็จ`,
      count: recommendations.length,
    });
  } catch (err) {
    logger.error("AI generation failed", {
      userId: session!.user.id,
      hotelId,
      action: "manual_ai_generate",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างคำแนะนำ", code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
