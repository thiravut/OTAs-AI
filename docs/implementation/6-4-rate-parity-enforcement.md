# Story 6.4: Rate Parity Enforcement

Status: in-progress

## Story

As a **เจ้าของโรงแรม**,
I want **ระบบ push ราคาเดียวกันไปทุก OTA (rate parity)**,
So that **ไม่ละเมิด rate parity agreement กับ OTA**.

## Acceptance Criteria

1. เมื่อ push ราคา → push ราคาเดียวกันไปทุก OTA ที่มี room type mapping
2. Rate parity check หลัง push: ตรวจสอบว่าราคาทุก OTA ตรงกัน
3. ถ้าไม่ตรงกัน → แสดง warning badge บน rate parity view
4. ถ้า push สำเร็จบาง OTA ไม่สำเร็จบาง OTA → แจ้งเตือน + retry option

## Tasks

- [ ] Task 1: Rate parity check utility
- [ ] Task 2: Warning badge on pricing page
- [ ] Task 3: Tests + build

## Dev Agent Record
### Agent Model Used
### Completion Notes List
### File List
