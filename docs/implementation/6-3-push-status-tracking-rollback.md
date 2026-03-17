# Story 6.3: Push Status Tracking & Rollback

Status: in-progress

## Story

As a **เจ้าของโรงแรม**,
I want **ดูสถานะ push ทุกรายการ และ rollback ราคาได้ถ้าจำเป็น**,
So that **มั่นใจว่าราคาบน OTA ถูกต้อง และแก้ไขได้ถ้าผิดพลาด**.

## Acceptance Criteria

1. หน้า Push History แสดงรายการ push ทั้งหมด: วันเวลา, room type, OTA, ราคาเก่า→ใหม่, สถานะ
2. กด [Rollback] → ระบบ push ราคาเดิมกลับไป OTA
3. Rollback ถูก log เป็น audit trail
4. แสดงสถานะ rollback: "กำลัง rollback..." → "rollback สำเร็จ"
5. API endpoint: POST /api/hotels/[hotelId]/push-history/[logId]/rollback

## Tasks

- [ ] Task 1: Rollback API endpoint
- [ ] Task 2: Push History UI page
- [ ] Task 3: Tests + build

## Dev Agent Record
### Agent Model Used
### Completion Notes List
### File List
