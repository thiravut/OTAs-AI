# สรุปการทดสอบอัตโนมัติ - RateGenie MVP-0

> สร้างเมื่อ: 2026-03-17

## Test Frameworks

| Framework | ใช้สำหรับ | Version |
|---|---|---|
| Vitest | API / Unit tests | 4.1.0 |
| Playwright | E2E tests | 1.58.2 |

## คำสั่งรัน

```bash
npm test           # Vitest API/Unit tests
npm run test:e2e   # Playwright E2E tests
```

## API Tests ที่สร้าง

### Auth
- [x] tests/api/auth/register.test.ts — ลงทะเบียน, อีเมลซ้ำ (409), validation (400), auto-accept invitations

### Hotels
- [x] tests/api/hotels/hotels.test.ts — แสดงรายการ, สร้างโรงแรม, เกิน limit (403), validation (400)

### Recommendations
- [x] tests/api/recommendations/approve-reject.test.ts — อนุมัติ, ปฏิเสธ, หมดอายุ (400), ดำเนินการแล้ว (409), OTHER ต้องมี note

### Users
- [x] tests/api/users/users.test.ts — ดูโปรไฟล์, อัปเดตชื่อ, ไม่พบ (404), validation (400)

### Lib/Utils
- [x] tests/api/lib/currency.test.ts — bahtToSatang, satangToBaht, ปัดเศษ, edge cases
- [x] tests/api/lib/retry.test.ts — สำเร็จครั้งแรก, retry แล้วสำเร็จ, หมด retry

## E2E Tests ที่สร้าง

### Auth Flows
- [x] tests/e2e/auth.spec.ts — หน้าลงทะเบียน, หน้า login, redirect, form validation

### Dashboard
- [x] tests/e2e/dashboard.spec.ts — หน้าแรก, link ระหว่าง login/register

## Coverage

| ประเภท | ครอบคลุม | ทั้งหมด | % |
|---|---|---|---|
| API endpoints (unit) | 8 | 32 | 25% |
| UI pages (e2e) | 3 | 8 | 38% |
| Lib modules | 3 | 13 | 23% |
| **รวม tests ทั้งหมด** | **29** | — | — |

## ผลการทดสอบ

```
✓ Test Files: 6 passed (6)
✓ Tests: 29 passed (29)
✓ Duration: 695ms
```

## ขั้นตอนถัดไป

- เพิ่ม API tests สำหรับ: OTA connections, room types, dashboard, analytics, prices, notifications, webhooks
- เพิ่ม E2E tests สำหรับ: hotels management, recommendations queue, pricing view, revenue analytics
- ตั้งค่า CI pipeline ให้รัน tests อัตโนมัติ
- เพิ่ม test coverage reporting
