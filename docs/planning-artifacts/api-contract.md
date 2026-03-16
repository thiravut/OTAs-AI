---
project: RateGenie
date: 2026-03-17
version: MVP-0
author: Pond + BMad Master
---

# API Contract — RateGenie MVP-0

**Base URL:** `https://{domain}/api`
**Authentication:** JWT via httpOnly cookie (NextAuth.js)
**Content-Type:** `application/json`
**Language:** Response messages ภาษาไทย

---

## Common Patterns

### Authentication Header

ทุก API route (ยกเว้น auth + webhooks) ต้องมี session cookie จาก NextAuth.js
ถ้าไม่มี session → `401 Unauthorized`

### Hotel Scoping

ทุก route ที่มี `:hotelId` → middleware ตรวจว่า user มีสิทธิ์เข้าถึงโรงแรมนี้
ถ้าไม่มีสิทธิ์ → `403 Forbidden`

### Error Response Format

```json
{
  "error": "ข้อความ error ภาษาไทย",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Pagination (สำหรับ list endpoints)

```
?page=1&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Common Status Codes

| Code | ความหมาย |
|------|---------|
| `200` | สำเร็จ |
| `201` | สร้างสำเร็จ |
| `400` | ข้อมูลไม่ถูกต้อง (validation error) |
| `401` | ไม่ได้เข้าสู่ระบบ |
| `403` | ไม่มีสิทธิ์ |
| `404` | ไม่พบข้อมูล |
| `409` | ข้อมูลซ้ำ (duplicate) |
| `429` | เรียกบ่อยเกินไป (rate limit) |
| `500` | เกิดข้อผิดพลาดในระบบ |

---

## 1. Authentication (Epic 1)

### POST /api/auth/register

สร้างบัญชีใหม่

**Request:**
```json
{
  "email": "wichai@example.com",
  "password": "securePassword123",
  "name": "วิชัย สมบูรณ์"
}
```

**Response 201:**
```json
{
  "message": "ลงทะเบียนสำเร็จ",
  "user": {
    "id": "uuid",
    "email": "wichai@example.com",
    "name": "วิชัย สมบูรณ์"
  }
}
```

**Errors:**
- `400` — password น้อยกว่า 8 ตัวอักษร / email format ผิด
- `409` — `{ "error": "อีเมลนี้ถูกใช้แล้ว", "code": "EMAIL_EXISTS" }`

---

### POST /api/auth/login

เข้าสู่ระบบ (handled by NextAuth.js `signIn()`)

**Request:**
```json
{
  "email": "wichai@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "message": "เข้าสู่ระบบสำเร็จ",
  "user": {
    "id": "uuid",
    "email": "wichai@example.com",
    "name": "วิชัย สมบูรณ์",
    "role": "OWNER"
  }
}
```

**Errors:**
- `401` — `{ "error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "code": "INVALID_CREDENTIALS" }`

---

### GET /api/auth/session

ดึงข้อมูล session ปัจจุบัน (NextAuth.js built-in)

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "wichai@example.com",
    "name": "วิชัย สมบูรณ์",
    "role": "OWNER"
  },
  "expires": "2026-04-17T00:00:00.000Z"
}
```

---

### POST /api/auth/logout

ออกจากระบบ (NextAuth.js `signOut()`)

**Response 200:**
```json
{
  "message": "ออกจากระบบสำเร็จ"
}
```

---

## 2. User Management (Epic 1)

### GET /api/users/me

ดึงข้อมูล profile ของตัวเอง

**Roles:** ทุก role

**Response 200:**
```json
{
  "id": "uuid",
  "email": "wichai@example.com",
  "name": "วิชัย สมบูรณ์",
  "role": "OWNER",
  "notificationChannel": "LINE",
  "lineUserId": "U1234567890",
  "telegramChatId": null,
  "createdAt": "2026-03-17T00:00:00.000Z"
}
```

---

### PUT /api/users/me

แก้ไข profile ของตัวเอง

**Roles:** ทุก role

**Request:**
```json
{
  "name": "วิชัย สมบูรณ์ดี",
  "notificationChannel": "TELEGRAM"
}
```

**Response 200:**
```json
{
  "message": "อัปเดตข้อมูลสำเร็จ",
  "user": { ... }
}
```

---

## 3. Hotel Management (Epic 1)

### POST /api/hotels

เพิ่มโรงแรมใหม่

**Roles:** OWNER

**Request:**
```json
{
  "name": "โรงแรมภูเก็ตพาราไดซ์",
  "location": "ภูเก็ต",
  "totalRooms": 80
}
```

**Response 201:**
```json
{
  "message": "เพิ่มโรงแรมสำเร็จ",
  "hotel": {
    "id": "uuid",
    "name": "โรงแรมภูเก็ตพาราไดซ์",
    "location": "ภูเก็ต",
    "totalRooms": 80,
    "ownerId": "uuid",
    "createdAt": "2026-03-17T00:00:00.000Z"
  }
}
```

**Errors:**
- `400` — ข้อมูลไม่ครบ
- `403` — `{ "error": "จำนวนโรงแรมเกินจำนวนที่แพ็คเกจอนุญาต", "code": "HOTEL_LIMIT_EXCEEDED" }`

---

### GET /api/hotels

ดึงรายการโรงแรมที่มีสิทธิ์เข้าถึง

**Roles:** ทุก role (filtered ตาม access)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "โรงแรมภูเก็ตพาราไดซ์",
      "location": "ภูเก็ต",
      "totalRooms": 80,
      "role": "OWNER",
      "syncStatus": "connected",
      "lastSyncAt": "2026-03-17T08:00:00.000Z",
      "pendingRecommendations": 3
    }
  ]
}
```

---

### GET /api/hotels/:hotelId

ดึงข้อมูลโรงแรมเดียว

**Roles:** ทุก role (ที่มี access)

**Response 200:**
```json
{
  "id": "uuid",
  "name": "โรงแรมภูเก็ตพาราไดซ์",
  "location": "ภูเก็ต",
  "totalRooms": 80,
  "ownerId": "uuid",
  "syncStatus": "connected",
  "lastSyncAt": "2026-03-17T08:00:00.000Z",
  "connectedOTAs": ["agoda", "booking"],
  "notificationChannel": "LINE",
  "createdAt": "2026-03-17T00:00:00.000Z"
}
```

---

### POST /api/hotels/:hotelId/invite

เชิญผู้ใช้เข้ามาดูแลโรงแรม

**Roles:** OWNER

**Request:**
```json
{
  "email": "prae@example.com",
  "role": "REVENUE_MANAGER"
}
```

**Response 201:**
```json
{
  "message": "ส่งคำเชิญไปยัง prae@example.com แล้ว",
  "invitation": {
    "id": "uuid",
    "email": "prae@example.com",
    "role": "REVENUE_MANAGER",
    "status": "pending",
    "expiresAt": "2026-03-24T00:00:00.000Z"
  }
}
```

**Errors:**
- `400` — role ไม่ถูกต้อง (ต้องเป็น REVENUE_MANAGER หรือ FRONT_DESK)
- `409` — `{ "error": "ผู้ใช้นี้มีสิทธิ์เข้าถึงโรงแรมนี้อยู่แล้ว", "code": "ALREADY_MEMBER" }`

---

## 4. OTA Connection (Epic 2)

### POST /api/hotels/:hotelId/ota-connections

เชื่อมต่อ OTA ผ่าน Channex

**Roles:** OWNER, SYSTEM_ADMIN

**Request:**
```json
{
  "otaName": "agoda",
  "channexPropertyId": "channex-prop-123"
}
```

**Response 201:**
```json
{
  "message": "เชื่อมต่อ Agoda สำเร็จ",
  "connection": {
    "id": "uuid",
    "otaName": "agoda",
    "status": "connected",
    "lastSyncAt": null,
    "createdAt": "2026-03-17T00:00:00.000Z"
  }
}
```

**Errors:**
- `400` — OTA ไม่รองรับ / credentials ผิด
- `409` — `{ "error": "เชื่อมต่อ Agoda อยู่แล้ว", "code": "OTA_ALREADY_CONNECTED" }`

---

### GET /api/hotels/:hotelId/ota-connections

ดึงรายการ OTA ที่เชื่อมต่อ

**Roles:** OWNER, REVENUE_MANAGER, SYSTEM_ADMIN

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "otaName": "agoda",
      "status": "connected",
      "lastSyncAt": "2026-03-17T08:00:00.000Z",
      "lastError": null
    },
    {
      "id": "uuid",
      "otaName": "booking",
      "status": "error",
      "lastSyncAt": "2026-03-17T06:00:00.000Z",
      "lastError": "Authentication failed"
    }
  ]
}
```

---

### DELETE /api/hotels/:hotelId/ota-connections/:connectionId

ยกเลิกการเชื่อมต่อ OTA

**Roles:** OWNER, SYSTEM_ADMIN

**Response 200:**
```json
{
  "message": "ยกเลิกการเชื่อมต่อ Agoda สำเร็จ"
}
```

---

## 5. Room Types & Pricing Boundaries (Epic 2)

### GET /api/hotels/:hotelId/room-types

ดึง room types ทั้งหมด (รวม mapping กับ OTA)

**Roles:** OWNER, REVENUE_MANAGER

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Deluxe Room",
      "otaMappings": {
        "agoda": { "otaRoomTypeId": "ag-123", "otaRoomName": "Deluxe King" },
        "booking": { "otaRoomTypeId": "bk-456", "otaRoomName": "Deluxe Room with Balcony" }
      },
      "pricingBoundaries": {
        "minPrice": 1500,
        "maxPrice": 5000,
        "maxDiscountPercent": 20
      },
      "currentPrices": {
        "agoda": { "price": 2800, "currency": "THB", "syncedAt": "2026-03-17T08:00:00.000Z" },
        "booking": { "price": 2900, "currency": "THB", "syncedAt": "2026-03-17T08:00:00.000Z" }
      }
    }
  ]
}
```

---

### PUT /api/hotels/:hotelId/room-types/:roomTypeId/mapping

จับคู่ room type กับ OTA

**Roles:** OWNER

**Request:**
```json
{
  "otaMappings": {
    "agoda": { "otaRoomTypeId": "ag-123" },
    "booking": { "otaRoomTypeId": "bk-456" }
  }
}
```

**Response 200:**
```json
{
  "message": "จับคู่ room type สำเร็จ",
  "roomType": { ... }
}
```

---

### PUT /api/hotels/:hotelId/room-types/:roomTypeId/boundaries

ตั้งค่า pricing boundaries

**Roles:** OWNER

**Request:**
```json
{
  "minPrice": 1500,
  "maxPrice": 5000,
  "maxDiscountPercent": 20
}
```

**Response 200:**
```json
{
  "message": "ตั้งค่ากรอบราคาสำเร็จ",
  "pricingBoundaries": {
    "minPrice": 1500,
    "maxPrice": 5000,
    "maxDiscountPercent": 20
  }
}
```

**Errors:**
- `400` — `{ "error": "ราคาต่ำสุดต้องน้อยกว่าราคาสูงสุด", "code": "INVALID_BOUNDARIES" }`

---

## 6. OTA Sync (Epic 2)

### GET /api/hotels/:hotelId/sync-status

ดูสถานะ sync ของแต่ละ OTA

**Roles:** OWNER, REVENUE_MANAGER, SYSTEM_ADMIN

**Response 200:**
```json
{
  "overallStatus": "healthy",
  "connections": [
    {
      "otaName": "agoda",
      "status": "connected",
      "lastSyncAt": "2026-03-17T08:00:00.000Z",
      "nextSyncAt": "2026-03-17T08:05:00.000Z",
      "lastError": null
    },
    {
      "otaName": "booking",
      "status": "error",
      "lastSyncAt": "2026-03-17T06:00:00.000Z",
      "nextSyncAt": "2026-03-17T08:05:00.000Z",
      "lastError": "API rate limit exceeded",
      "retryCount": 2
    }
  ]
}
```

---

### POST /api/hotels/:hotelId/sync/trigger

Trigger manual sync (สำหรับ debug/admin)

**Roles:** OWNER, SYSTEM_ADMIN

**Response 202:**
```json
{
  "message": "กำลังดึงข้อมูลจาก OTA ทั้งหมด",
  "syncJobId": "uuid"
}
```

---

### POST /api/webhooks/channex

Webhook endpoint สำหรับ Channex (booking updates)

**Auth:** Channex webhook signature verification

**Request (from Channex):**
```json
{
  "event": "booking_created",
  "property_id": "channex-prop-123",
  "data": { ... }
}
```

**Response 200:**
```json
{
  "received": true
}
```

---

## 7. AI Recommendations (Epic 3)

### GET /api/hotels/:hotelId/recommendations

ดึงคำแนะนำราคา (pending + recent)

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?status=pending&page=1&limit=20`

**Status filter:** `pending`, `approved`, `rejected`, `expired`, `all`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "roomType": {
        "id": "uuid",
        "name": "Deluxe Room"
      },
      "targetDate": "2026-03-21",
      "currentPrice": 2800,
      "recommendedPrice": 3000,
      "changePercent": 7.14,
      "changeDirection": "up",
      "reason": "booking pace สูงกว่าปกติ 30% และคู่แข่ง 3 ใน 5 แห่งขึ้นราคาแล้ว",
      "status": "pending",
      "createdAt": "2026-03-17T07:00:00.000Z",
      "expiresAt": "2026-03-21T00:00:00.000Z",
      "decidedAt": null,
      "decidedBy": null
    }
  ],
  "pagination": { ... },
  "summary": {
    "pending": 3,
    "approvedToday": 5,
    "rejectedToday": 1,
    "approvalRate": 72
  }
}
```

---

### POST /api/hotels/:hotelId/recommendations/:recommendationId/approve

อนุมัติคำแนะนำ

**Roles:** OWNER, REVENUE_MANAGER

**Request:** (no body needed)

**Response 200:**
```json
{
  "message": "อนุมัติแล้ว",
  "recommendation": {
    "id": "uuid",
    "status": "approved",
    "decidedAt": "2026-03-17T08:30:00.000Z",
    "decidedBy": {
      "id": "uuid",
      "name": "วิชัย สมบูรณ์"
    }
  },
  "note": "กรุณาไปปรับราคาบน OTA ด้วยตัวเอง (MVP-0)"
}
```

**Errors:**
- `400` — `{ "error": "คำแนะนำนี้หมดอายุแล้ว", "code": "RECOMMENDATION_EXPIRED" }`
- `409` — `{ "error": "คำแนะนำนี้ถูกดำเนินการแล้ว", "code": "ALREADY_DECIDED" }`

---

### POST /api/hotels/:hotelId/recommendations/:recommendationId/reject

ปฏิเสธคำแนะนำ พร้อมเหตุผล

**Roles:** OWNER, REVENUE_MANAGER

**Request:**
```json
{
  "rejectionReason": "local_event",
  "rejectionNote": "มีงาน Phuket Food Festival วันที่ 21-23"
}
```

**Rejection reasons (enum):**
- `local_event` — มี local event
- `price_too_high` — ราคาสูงเกินไป
- `price_too_low` — ราคาต่ำเกินไป
- `market_knowledge` — มีข้อมูลตลาดที่ AI ไม่รู้
- `other` — อื่นๆ (ต้องมี rejectionNote)

**Response 200:**
```json
{
  "message": "ปฏิเสธแล้ว ขอบคุณสำหรับ feedback",
  "recommendation": {
    "id": "uuid",
    "status": "rejected",
    "rejectionReason": "local_event",
    "rejectionNote": "มีงาน Phuket Food Festival วันที่ 21-23",
    "decidedAt": "2026-03-17T08:30:00.000Z",
    "decidedBy": { ... }
  }
}
```

---

### POST /api/hotels/:hotelId/recommendations/batch-approve

อนุมัติทั้งหมด

**Roles:** OWNER, REVENUE_MANAGER

**Request:**
```json
{
  "recommendationIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response 200:**
```json
{
  "message": "อนุมัติ 3 รายการสำเร็จ",
  "approved": 3,
  "failed": 0,
  "results": [
    { "id": "uuid-1", "status": "approved" },
    { "id": "uuid-2", "status": "approved" },
    { "id": "uuid-3", "status": "approved" }
  ],
  "note": "กรุณาไปปรับราคาบน OTA ด้วยตัวเอง (MVP-0)"
}
```

---

### GET /api/hotels/:hotelId/recommendations/history

ดูประวัติคำแนะนำทั้งหมด

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?from=2026-03-01&to=2026-03-17&roomTypeId=uuid&status=approved&page=1&limit=50`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "roomType": { "id": "uuid", "name": "Deluxe Room" },
      "targetDate": "2026-03-15",
      "currentPrice": 2500,
      "recommendedPrice": 2800,
      "changePercent": 12.0,
      "reason": "...",
      "status": "approved",
      "rejectionReason": null,
      "rejectionNote": null,
      "decidedAt": "2026-03-14T08:00:00.000Z",
      "decidedBy": { "name": "วิชัย สมบูรณ์" },
      "createdAt": "2026-03-14T07:00:00.000Z"
    }
  ],
  "pagination": { ... },
  "stats": {
    "totalRecommendations": 150,
    "approved": 108,
    "rejected": 30,
    "expired": 12,
    "approvalRate": 72
  }
}
```

---

### GET /api/hotels/:hotelId/recommendations/stats

สถิติ AI recommendations

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?period=30d`

**Response 200:**
```json
{
  "period": "30d",
  "totalRecommendations": 150,
  "approved": 108,
  "rejected": 30,
  "expired": 12,
  "approvalRate": 72,
  "approvalRateTrend": [
    { "week": "2026-W10", "rate": 65 },
    { "week": "2026-W11", "rate": 72 },
    { "week": "2026-W12", "rate": 78 }
  ],
  "topRejectionReasons": [
    { "reason": "local_event", "count": 12 },
    { "reason": "price_too_high", "count": 10 },
    { "reason": "market_knowledge", "count": 5 }
  ]
}
```

---

## 8. Notifications (Epic 4)

### POST /api/users/me/notifications/line/connect

เชื่อมต่อ LINE

**Roles:** ทุก role

**Response 200:**
```json
{
  "connectUrl": "https://line.me/R/ti/p/@rategenie",
  "qrCodeUrl": "https://qr-official.line.me/...",
  "verificationCode": "ABC123",
  "message": "กรุณาเพิ่มเพื่อน LINE แล้วส่งรหัส ABC123"
}
```

---

### POST /api/users/me/notifications/telegram/connect

เชื่อมต่อ Telegram

**Roles:** ทุก role

**Response 200:**
```json
{
  "botUrl": "https://t.me/RateGenieBot",
  "verificationCode": "XYZ789",
  "message": "กรุณาเปิด Telegram bot แล้วส่งรหัส XYZ789"
}
```

---

### DELETE /api/users/me/notifications/:channel/disconnect

ยกเลิกการเชื่อมต่อ notification channel

**Roles:** ทุก role

**Params:** `:channel` = `line` | `telegram`

**Response 200:**
```json
{
  "message": "ยกเลิกการเชื่อมต่อ LINE สำเร็จ"
}
```

---

### POST /api/webhooks/line

Webhook สำหรับ LINE (user verification + events)

**Auth:** LINE webhook signature verification

**Response 200:**
```json
{
  "received": true
}
```

---

### POST /api/webhooks/telegram

Webhook สำหรับ Telegram (user verification + events)

**Auth:** Telegram bot token verification

**Response 200:**
```json
{
  "received": true
}
```

---

## 9. Dashboard (Epic 5)

### GET /api/hotels/:hotelId/dashboard

ดึงข้อมูลหน้า dashboard หลัก

**Roles:** OWNER, REVENUE_MANAGER

**Response 200:**
```json
{
  "hotel": {
    "id": "uuid",
    "name": "โรงแรมภูเก็ตพาราไดซ์"
  },
  "occupancy": {
    "today": 75,
    "forecast7Days": [
      { "date": "2026-03-17", "occupancy": 75 },
      { "date": "2026-03-18", "occupancy": 82 },
      { "date": "2026-03-19", "occupancy": 68 },
      { "date": "2026-03-20", "occupancy": 71 },
      { "date": "2026-03-21", "occupancy": 90 },
      { "date": "2026-03-22", "occupancy": 95 },
      { "date": "2026-03-23", "occupancy": 88 }
    ]
  },
  "revenue": {
    "thisMonth": 847500,
    "lastMonth": 742500,
    "changePercent": 14.14,
    "changeDirection": "up"
  },
  "recommendations": {
    "pending": 3,
    "approvedToday": 5,
    "approvalRate": 72
  },
  "syncStatus": {
    "overallStatus": "healthy",
    "connections": [
      { "otaName": "agoda", "status": "connected", "lastSyncAt": "2026-03-17T08:00:00.000Z" },
      { "otaName": "booking", "status": "connected", "lastSyncAt": "2026-03-17T08:00:00.000Z" }
    ]
  }
}
```

---

## 10. Price Management (Epic 5)

### GET /api/hotels/:hotelId/prices

ดูราคาทุก room type ทุก OTA

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?dateFrom=2026-03-17&dateTo=2026-03-23`

**Response 200:**
```json
{
  "dateRange": {
    "from": "2026-03-17",
    "to": "2026-03-23"
  },
  "roomTypes": [
    {
      "id": "uuid",
      "name": "Deluxe Room",
      "prices": [
        {
          "date": "2026-03-17",
          "otas": {
            "agoda": { "price": 2800, "syncedAt": "2026-03-17T08:00:00.000Z" },
            "booking": { "price": 2900, "syncedAt": "2026-03-17T08:00:00.000Z" }
          },
          "hasPriceDifference": true
        }
      ]
    }
  ]
}
```

---

### GET /api/hotels/:hotelId/prices/:roomTypeId/history

ดู price history ของ room type เดียว

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?period=30d`

**Response 200:**
```json
{
  "roomType": { "id": "uuid", "name": "Deluxe Room" },
  "period": "30d",
  "history": [
    {
      "date": "2026-03-01",
      "agoda": 2500,
      "booking": 2500,
      "recommended": null
    },
    {
      "date": "2026-03-15",
      "agoda": 2800,
      "booking": 2900,
      "recommended": 3000
    }
  ]
}
```

---

## 11. Analytics (Epic 5)

### GET /api/hotels/:hotelId/analytics

ข้อมูล revenue comparison + AI performance

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?period=30d`

**Response 200:**
```json
{
  "period": "30d",
  "revenue": {
    "before": {
      "period": "2026-02-01 to 2026-02-28",
      "total": 742500,
      "avgDaily": 26518
    },
    "after": {
      "period": "2026-03-01 to 2026-03-17",
      "total": 480000,
      "avgDaily": 28235,
      "projected": 875300
    },
    "changePercent": 14.14,
    "changeDirection": "up"
  },
  "occupancy": {
    "before": { "average": 62 },
    "after": { "average": 71 },
    "changePercent": 14.52
  },
  "aiPerformance": {
    "totalRecommendations": 150,
    "approvalRate": 72,
    "approvalRateTrend": "improving",
    "topRejectionReasons": [
      { "reason": "local_event", "label": "มี local event", "count": 12 }
    ]
  }
}
```

---

### GET /api/hotels/:hotelId/analytics/export

Export ข้อมูลเป็น CSV

**Roles:** OWNER, REVENUE_MANAGER

**Query params:** `?period=30d&format=csv`

**Response 200:** (Content-Type: text/csv)
```
วันที่,Room Type,OTA,ราคา,AI แนะนำ,สถานะ,เหตุผล
2026-03-17,Deluxe Room,Agoda,2800,3000,approved,booking pace สูง
...
```

---

## API Summary

| Epic | Endpoints | Total |
|------|----------|-------|
| **Epic 1: Auth & Hotels** | register, login, logout, session, me, hotels CRUD, invite | 8 |
| **Epic 2: OTA Connection** | ota-connections CRUD, room-types, boundaries, sync-status, sync/trigger, webhook/channex | 8 |
| **Epic 3: AI Recommendations** | recommendations list, approve, reject, batch-approve, history, stats | 6 |
| **Epic 4: Notifications** | LINE connect, Telegram connect, disconnect, webhooks LINE/Telegram | 5 |
| **Epic 5: Dashboard & Analytics** | dashboard, prices, price-history, analytics, export | 5 |
| **Total** | | **32 endpoints** |
