import type { PricingContext } from "./types";

export function buildPricingPrompt(contexts: PricingContext[]): string {
  const contextText = contexts
    .map(
      (ctx) => `
## ${ctx.roomTypeName} (${ctx.hotelName})
- ราคาปัจจุบัน: ${ctx.currentPrice} บาท
- กรอบราคา: ${ctx.pricingBoundaries.minPrice ?? "ไม่กำหนด"} - ${ctx.pricingBoundaries.maxPrice ?? "ไม่กำหนด"} บาท
- ส่วนลดสูงสุด: ${ctx.pricingBoundaries.maxDiscountPercent ?? 20}%
- ราคาล่าสุดจาก OTA:
${ctx.recentRates.map((r) => `  - ${r.date} (${r.otaName}): ${r.price} บาท`).join("\n")}
- Booking pace: ${ctx.bookingPace.totalBookings7Days} bookings ใน 7 วัน, ${ctx.bookingPace.totalBookings14Days} ใน 14 วัน
- Occupancy rate: ${ctx.bookingPace.occupancyRate}%
${
  ctx.recentFeedback.length > 0
    ? `- Feedback จากเจ้าของ:\n${ctx.recentFeedback.map((f) => `  - ปฏิเสธเพราะ: ${f.reason}${f.note ? ` (${f.note})` : ""}`).join("\n")}`
    : ""
}`
    )
    .join("\n");

  return `คุณเป็นผู้เชี่ยวชาญด้าน Revenue Management สำหรับโรงแรมในไทย

## กฎสำคัญ (Expert Rules)
1. ราคาแนะนำต้องอยู่ในกรอบ min/max ที่เจ้าของตั้งไว้เสมอ
2. ไม่แนะนำลดราคามากกว่า max discount % จากราคาปกติ
3. ถ้า booking pace สูงกว่าปกติ → แนะนำขึ้นราคา
4. ถ้า occupancy ต่ำ + booking pace ช้า → แนะนำลดราคาเล็กน้อย
5. วันหยุดสุดสัปดาห์/เทศกาล → แนะนำขึ้นราคา 10-20%
6. ให้เหตุผลเป็นภาษาไทยที่เจ้าของโรงแรมเข้าใจง่าย
7. ถ้ามี feedback จากเจ้าของ ให้พิจารณาปรับคำแนะนำตาม

## ข้อมูลห้องพัก
${contextText}

## คำสั่ง
วิเคราะห์ข้อมูลข้างต้นและสร้างคำแนะนำราคาสำหรับ 7 วันข้างหน้า

ตอบเป็น JSON array เท่านั้น (ไม่ต้องมี markdown code block):
[
  {
    "roomTypeName": "ชื่อห้อง",
    "targetDate": "YYYY-MM-DD",
    "recommendedPrice": 0,
    "reason": "เหตุผลภาษาไทย"
  }
]`;
}
