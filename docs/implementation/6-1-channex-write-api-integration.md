# Story 6.1: Channex Write API Integration

Status: ready-for-dev

## Story

As a **developer (Pond)**,
I want **เชื่อมต่อ Channex Write API เพื่อ push ราคาไป OTA**,
So that **ระบบสามารถปรับราคาบน OTA ได้อัตโนมัติ ไม่ต้องเข้า extranet เอง**.

## Acceptance Criteria

1. **Given** Channex API credentials ถูกตั้งค่า **When** ระบบเรียก rate update API **Then** สามารถ push ราคาใหม่ไป property/room type/date ที่ระบุได้
2. รองรับ push ไปหลาย OTA พร้อมกัน (Agoda + Booking.com) ผ่าน Channex single API
3. Retry 3 ครั้ง exponential backoff เมื่อ push ล้มเหลว
4. ทุก push operation ถูก log ไว้ใน PriceUpdateLog (status, timestamp, OTA, response)
5. Mock mode สำหรับ development โดยไม่ push จริง (DEMO_MODE=true)
6. API endpoint: POST /api/hotels/[hotelId]/push-price ที่รับ { roomTypeId, date, price } แล้ว push ไป Channex
7. Prisma model PriceUpdateLog สำหรับ track ทุก push operation
8. Integration กับ existing recommendation approve flow (Story 6.2 จะต่อ)

## Tasks / Subtasks

- [ ] Task 1: Prisma Schema — เพิ่ม PriceUpdateLog model (AC: #4)
  - [ ] 1.1 เพิ่ม model PriceUpdateLog ใน schema.prisma
  - [ ] 1.2 รัน prisma migrate dev
- [ ] Task 2: Channex Write Functions (AC: #1, #2, #3)
  - [ ] 2.1 เพิ่ม `updateRate()` ใน lib/channex/client.ts — push ราคาไป Channex Rate API
  - [ ] 2.2 เพิ่ม `updateRates()` (batch) — push หลาย rate พร้อมกัน
  - [ ] 2.3 เพิ่ม mock version ใน lib/channex/mock.ts สำหรับ demo mode
  - [ ] 2.4 เพิ่ม ChannexRateUpdate type ใน types.ts
- [ ] Task 3: Push Price Service (AC: #4, #5)
  - [ ] 3.1 สร้าง lib/channex/push.ts — orchestrate push + log ผลลัพธ์
  - [ ] 3.2 Push ไปทุก OTA ที่มี room type mapping สำหรับ room type นั้น
  - [ ] 3.3 Log ทุก push operation ลง PriceUpdateLog
  - [ ] 3.4 Handle partial failure (บาง OTA สำเร็จ บางไม่)
- [ ] Task 4: API Endpoint (AC: #6)
  - [ ] 4.1 สร้าง POST /api/hotels/[hotelId]/push-price route
  - [ ] 4.2 Auth + RBAC (Owner, Revenue Manager เท่านั้น)
  - [ ] 4.3 Validate input: roomTypeId, date, price (ต้องอยู่ใน pricing boundaries)
  - [ ] 4.4 Return push results per OTA
- [ ] Task 5: Push Status API (AC: #4)
  - [ ] 5.1 สร้าง GET /api/hotels/[hotelId]/push-history route
  - [ ] 5.2 Return push logs with pagination, filter by status/date
- [ ] Task 6: Tests (AC: all)
  - [ ] 6.1 Unit tests สำหรับ push service
  - [ ] 6.2 API test สำหรับ push-price endpoint

## Dev Notes

### Channex Rate Update API

Channex uses REST API to update rates:
```
PUT /api/v1/properties/{property_id}/rates
Headers: user-api-key: {CHANNEX_API_KEY}
Body: {
  "rates": [{
    "room_type_id": "channex-room-id",
    "date": "2026-03-20",
    "rate": 2800.00,
    "currency": "THB"
  }]
}
```

### Existing Code to Build On

- `apps/src/lib/channex/client.ts` — existing channexFetch(), isUsingMock(), retry logic
- `apps/src/lib/channex/mock.ts` — existing mock data layer
- `apps/src/lib/channex/types.ts` — existing Channex types
- `apps/src/lib/channex/sync.ts` — existing sync orchestration (read model)
- `apps/src/utils/retry.ts` — existing withRetry utility
- `apps/src/utils/currency.ts` — bahtToSatang/satangToBaht

### PriceUpdateLog Schema

```prisma
model PriceUpdateLog {
  id              String   @id @default(uuid())
  hotelId         String
  hotel           Hotel    @relation(fields: [hotelId], references: [id])
  roomTypeId      String
  roomType        RoomType @relation(fields: [roomTypeId], references: [id])
  otaName         String
  targetDate      DateTime @db.Date
  previousPrice   Int      // satang
  newPrice        Int      // satang
  status          String   // SUCCESS, FAILED, PENDING, ROLLED_BACK
  channexResponse Json?
  error           String?
  triggeredBy     String   // "recommendation_approve", "manual", "rule"
  recommendationId String?
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())

  @@index([hotelId, createdAt])
  @@index([status])
}
```

### Project Structure Notes

- Channex write functions go in existing `apps/src/lib/channex/client.ts`
- Push orchestration in new `apps/src/lib/channex/push.ts`
- API routes in `apps/src/app/api/hotels/[hotelId]/push-price/route.ts`
- Push history in `apps/src/app/api/hotels/[hotelId]/push-history/route.ts`
- Prices stored in satang (integer) in database, convert to baht for Channex API

### Key Constraints

- ราคาที่ push ต้องอยู่ภายใน pricing boundaries ที่เจ้าของตั้งไว้เสมอ
- Demo mode: log "[DEMO] Price push skipped" + return mock success
- Push ไปทุก OTA ที่มี OtaRoomMapping สำหรับ room type นั้น
- ถ้า push บาง OTA สำเร็จ บางไม่ → return partial result + log per OTA
- Channex push เป็น batch-capable: ส่งหลาย rate ใน 1 request ได้

### References

- [Source: docs/planning-artifacts/epics.md#Epic 6 Story 6.1]
- [Source: docs/planning-artifacts/architecture.md#Channex Integration]
- [Source: docs/planning-artifacts/prd.md#MVP-1]
- [Source: apps/src/lib/channex/client.ts — existing read API pattern]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
