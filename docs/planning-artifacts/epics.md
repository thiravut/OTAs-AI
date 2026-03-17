---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - 'docs/planning-artifacts/prd.md'
  - 'docs/planning-artifacts/architecture.md'
---

# RateGenie - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for RateGenie, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: ระบบสามารถดึงข้อมูลราคาห้องพักปัจจุบันจาก Agoda ได้
- FR2: ระบบสามารถดึงข้อมูลราคาห้องพักปัจจุบันจาก Booking.com ได้
- FR3: ระบบสามารถดึงข้อมูล booking (จองใหม่, ยกเลิก, availability) จาก OTA ที่เชื่อมต่อได้
- FR4: ระบบสามารถ sync ข้อมูลจาก OTA ได้อัตโนมัติตามรอบเวลาที่กำหนด
- FR5: ระบบสามารถแสดงราคาปัจจุบันของทุก OTA ที่เชื่อมต่อในหน้าเดียวได้
- FR6: ระบบสามารถแจ้งเตือนเมื่อ sync กับ OTA ล้มเหลว
- FR7: AI สามารถวิเคราะห์ข้อมูลจาก OTAs + booking pace แล้วสร้างคำแนะนำราคาได้
- FR8: AI สามารถแสดงเหตุผลประกอบคำแนะนำราคาเป็นภาษาไทยที่เข้าใจง่าย
- FR9: เจ้าของโรงแรมสามารถอนุมัติหรือปฏิเสธคำแนะนำราคาจาก AI ได้
- FR10: เจ้าของโรงแรมสามารถเลือกเหตุผลที่ปฏิเสธคำแนะนำ (structured feedback) ได้
- FR11: ระบบสามารถบันทึก feedback จากการปฏิเสธเพื่อปรับปรุง AI ได้
- FR12: ระบบสามารถแสดงประวัติคำแนะนำทั้งหมด (approved/rejected) พร้อมเหตุผลได้
- FR13: ระบบสามารถส่ง notification ผ่าน LINE เมื่อมีคำแนะนำราคาใหม่ได้
- FR14: ระบบสามารถส่ง notification ผ่าน Telegram เมื่อมีคำแนะนำราคาใหม่ได้
- FR15: Notification สามารถมี link ไปหน้า approve/reject บน web dashboard ได้
- FR16: ระบบสามารถแจ้งเตือนเมื่อ OTA sync ล้มเหลวผ่าน LINE/Telegram ได้
- FR17: เจ้าของโรงแรมสามารถดูภาพรวม occupancy และ revenue บน dashboard ได้
- FR18: เจ้าของโรงแรมสามารถดูราคาปัจจุบันของทุก room type บนทุก OTA ได้
- FR19: เจ้าของโรงแรมสามารถดูรายการคำแนะนำ AI ที่รอ approve ได้
- FR20: เจ้าของโรงแรมสามารถดู revenue comparison ก่อน/หลังใช้ระบบได้
- FR21: Dashboard รองรับภาษาไทย
- FR22: ผู้ใช้สามารถลงทะเบียนและสร้างบัญชีได้
- FR23: ผู้ใช้สามารถเพิ่มโรงแรมเข้าในบัญชีได้ตามจำนวนที่ package อนุญาต
- FR24: Owner สามารถ invite ผู้ใช้อื่น (Revenue Manager, Front Desk) เข้ามาดูแลโรงแรมของตนได้
- FR25: ระบบรองรับ role-based access control (Owner, Revenue Manager, Front Desk, System Admin)
- FR26: Revenue Manager สามารถเข้าถึงโรงแรมหลายแห่งจากหลาย owner ที่ authorize ให้ได้
- FR27: เจ้าของโรงแรมสามารถเชื่อมต่อ OTA credentials ของโรงแรมได้
- FR28: เจ้าของโรงแรมสามารถกำหนด room types และ mapping กับ OTA ได้
- FR29: เจ้าของโรงแรมสามารถตั้งค่า pricing boundaries (ราคาต่ำสุด/สูงสุด) ได้
- FR30: เจ้าของโรงแรมสามารถเลือก notification channel ที่ต้องการ (LINE/Telegram) ได้
- FR31: ข้อมูลของแต่ละโรงแรมต้องแยกจากกัน (tenant isolation)
- FR32: ระบบต้องเข้ารหัสข้อมูลทั้ง at rest และ in transit
- FR33: ระบบต้องบันทึก audit log ของทุกการเปลี่ยนแปลงราคาและ AI recommendations
- FR34: เจ้าของโรงแรมสามารถ export ข้อมูลของตัวเองได้

### NonFunctional Requirements

- NFR1: OTA data sync อัปเดตภายใน 5 นาที
- NFR2: Dashboard load time โหลดภายใน 3 วินาที
- NFR3: AI recommendation สร้างภายใน 30 วินาทีหลังข้อมูลเข้า
- NFR4: LINE/Telegram notification ส่งถึงภายใน 1 นาที
- NFR5: Data encryption AES-256 at rest + TLS 1.2+ in transit
- NFR6: Tenant isolation ข้อมูลข้ามโรงแรมเข้าถึงไม่ได้ทุกกรณี
- NFR7: OTA credentials storage encryption แยก ไม่อยู่ใน main database
- NFR8: Authentication OAuth 2.0 / JWT + session timeout
- NFR9: PDPA compliance ปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
- NFR10: MVP-0 capacity รองรับ 20 โรงแรม pilot
- NFR11: Growth capacity scale ถึง 500+ โรงแรมโดยไม่ต้อง re-architect
- NFR12: OTA extensibility เพิ่ม OTA ใหม่โดยสร้างแค่ adapter ใหม่
- NFR13: Graceful degradation ระบบทำงานต่อได้เมื่อ OTA API ล่ม
- NFR14: Retry mechanism exponential backoff สูงสุด 3 ครั้ง
- NFR15: Notification fallback แสดงบน web dashboard เมื่อ push ไม่สำเร็จ
- NFR16: System uptime 99.5%+
- NFR17: Data backup ทุกวัน + retention 30 วัน
- NFR18: Error logging log ทุก error + context สำหรับ debugging

### Additional Requirements

**From Architecture:**
- Starter Template: `npx create-next-app@latest apps --typescript --app --src-dir --import-alias "@/*"` (impacts Epic 1 Story 1)
- Docker Compose setup: PostgreSQL + Next.js + Nginx on Contabo VPS
- Channex White Label API integration ($130/เดือน) — REST + JSON + Webhooks
- Claude API for AI recommendations + expert rules (ไม่ custom ML model)
- LINE Messaging API + Telegram Bot API for notifications
- NextAuth.js + Email/Password + JWT authentication
- Prisma ORM with PostgreSQL
- RBAC middleware: Owner, Revenue Manager, Front Desk, System Admin
- OTA Adapter Pattern via Channex (single integration point for 50+ OTAs)
- Modular Monolith architecture — all code in `apps/` directory
- Linux cron for OTA sync every 5 minutes
- Nginx reverse proxy + Let's Encrypt SSL
- pg_dump backup script daily
- Structured JSON logging
- Project root: `apps/` directory

### FR Coverage Map

| FR | Epic | คำอธิบาย |
|----|------|---------|
| FR1 | Epic 2 | ดึงราคาจาก Agoda |
| FR2 | Epic 2 | ดึงราคาจาก Booking.com |
| FR3 | Epic 2 | ดึง booking data จาก OTA |
| FR4 | Epic 2 | Auto sync ตามรอบเวลา |
| FR5 | Epic 5 | แสดงราคาทุก OTA ในหน้าเดียว |
| FR6 | Epic 4 | แจ้งเตือน sync ล้มเหลว |
| FR7 | Epic 3 | AI วิเคราะห์และสร้างคำแนะนำ |
| FR8 | Epic 3 | AI แสดงเหตุผลภาษาไทย |
| FR9 | Epic 3 | Approve/reject คำแนะนำ |
| FR10 | Epic 3 | Structured feedback เมื่อ reject |
| FR11 | Epic 3 | บันทึก feedback ปรับปรุง AI |
| FR12 | Epic 3 | ประวัติคำแนะนำทั้งหมด |
| FR13 | Epic 4 | LINE notification |
| FR14 | Epic 4 | Telegram notification |
| FR15 | Epic 4 | Notification มี link ไป web |
| FR16 | Epic 4 | แจ้งเตือน sync ล้มเหลวผ่าน LINE/Telegram |
| FR17 | Epic 5 | Dashboard occupancy + revenue |
| FR18 | Epic 5 | ราคาทุก room type ทุก OTA |
| FR19 | Epic 5 | รายการคำแนะนำ AI รอ approve |
| FR20 | Epic 5 | Revenue comparison before/after |
| FR21 | Epic 5 | Dashboard ภาษาไทย |
| FR22 | Epic 1 | ลงทะเบียน |
| FR23 | Epic 1 | เพิ่มโรงแรมตาม package |
| FR24 | Epic 1 | Invite users |
| FR25 | Epic 1 | RBAC 4 roles |
| FR26 | Epic 1 | Revenue Manager cross-hotel access |
| FR27 | Epic 2 | เชื่อมต่อ OTA credentials |
| FR28 | Epic 2 | กำหนด room types + mapping |
| FR29 | Epic 2 | ตั้ง pricing boundaries |
| FR30 | Epic 2 | เลือก notification channel |
| FR31 | Epic 1 | Tenant isolation |
| FR32 | Epic 1 | Encryption at rest + in transit |
| FR33 | Epic 3 | Audit log ราคา + AI recommendations |
| FR34 | Epic 5 | Export ข้อมูล |

## Epic List

### Epic 1: Project Foundation & Authentication
เจ้าของโรงแรมสามารถลงทะเบียน เข้าสู่ระบบ และจัดการบัญชีได้ พร้อม infrastructure พื้นฐานที่ทุก epic ต่อมาจะใช้
**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR31, FR32

### Epic 2: Hotel Configuration & OTA Connection
เจ้าของโรงแรมสามารถเพิ่มโรงแรม เชื่อมต่อ OTA credentials และตั้งค่าระบบพื้นฐานได้ — ระบบเริ่มดึงข้อมูลจาก OTA
**FRs covered:** FR1, FR2, FR3, FR4, FR27, FR28, FR29, FR30

### Epic 3: AI Pricing Recommendations
เจ้าของโรงแรมได้รับคำแนะนำราคาจาก AI พร้อมเหตุผลภาษาไทย สามารถ approve/reject และให้ feedback ได้ — core value ของ product
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR33

### Epic 4: Notification System (LINE & Telegram)
เจ้าของโรงแรมได้รับแจ้งเตือนผ่าน LINE/Telegram เมื่อมีคำแนะนำใหม่หรือ sync ล้มเหลว พร้อม link ไป approve บน web
**FRs covered:** FR6, FR13, FR14, FR15, FR16

### Epic 5: Dashboard & Analytics
เจ้าของโรงแรมสามารถดูภาพรวม occupancy, revenue, ราคาทุก OTA, คำแนะนำ AI ที่รอ approve, และ revenue comparison ก่อน/หลังใช้ระบบ
**FRs covered:** FR5, FR17, FR18, FR19, FR20, FR21, FR34

---

## Epic 1: Project Foundation & Authentication

**Goal:** ผู้ใช้สามารถลงทะเบียน เข้าสู่ระบบ และจัดการบัญชีได้ พร้อม infrastructure พื้นฐานที่ทุก epic ต่อมาจะใช้
**FRs:** FR22, FR23, FR24, FR25, FR26, FR31, FR32

### Story 1.1: Project Initialization & Infrastructure Setup

As a **developer (Pond)**,
I want **Next.js project initialized with Docker Compose (PostgreSQL + Nginx) deployed on Contabo**,
So that **infrastructure พร้อมสำหรับพัฒนา features ต่อไป**.

**Acceptance Criteria:**

**Given** developer runs `npx create-next-app@latest apps --typescript --app --src-dir --import-alias "@/*"`
**When** project is created and dependencies installed (React-Bootstrap, Prisma, NextAuth.js)
**Then** Next.js dev server starts successfully at localhost:3000
**And** Docker Compose starts PostgreSQL + Next.js + Nginx containers
**And** Prisma connects to PostgreSQL and runs initial migration
**And** Nginx proxies requests with SSL (Let's Encrypt) on Contabo
**And** pg_dump backup cron runs daily
**And** project structure follows `apps/` directory layout from Architecture doc

### Story 1.2: User Registration

As a **เจ้าของโรงแรม**,
I want **ลงทะเบียนด้วย email + password**,
So that **มีบัญชีเพื่อเข้าใช้งานระบบ**.

**Acceptance Criteria:**

**Given** ผู้ใช้ใหม่เข้าหน้า register
**When** กรอก email, password, ชื่อ แล้วกด submit
**Then** ระบบสร้างบัญชีใหม่ + hash password + เก็บ encrypted ใน database
**And** ระบบ redirect ไปหน้า login พร้อมข้อความ "ลงทะเบียนสำเร็จ"
**And** ถ้า email ซ้ำแสดง error "อีเมลนี้ถูกใช้แล้ว"
**And** password ต้องมีอย่างน้อย 8 ตัวอักษร

### Story 1.3: User Login & Session

As a **ผู้ใช้ที่ลงทะเบียนแล้ว**,
I want **เข้าสู่ระบบด้วย email + password**,
So that **เข้าถึง dashboard ได้**.

**Acceptance Criteria:**

**Given** ผู้ใช้ที่มีบัญชีอยู่แล้ว
**When** กรอก email + password ที่ถูกต้อง แล้วกด login
**Then** ระบบสร้าง JWT session + httpOnly cookie
**And** redirect ไปหน้า dashboard
**And** ถ้า password ผิดแสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
**And** session timeout หลังไม่มี activity ตามที่กำหนด

### Story 1.4: RBAC & Hotel Access Control

As a **System Admin**,
I want **ระบบ enforce role-based access control**,
So that **ผู้ใช้แต่ละ role เข้าถึงได้เฉพาะส่วนที่อนุญาต**.

**Acceptance Criteria:**

**Given** ระบบมี 4 roles: Owner, Revenue Manager, Front Desk, System Admin
**When** ผู้ใช้ role ใดก็ตามเรียก API
**Then** middleware ตรวจ auth + role + hotel access ก่อนทุก request
**And** Owner เข้าถึงทุก feature ของโรงแรมตัวเอง
**And** Revenue Manager เข้าถึง pricing/recommendations ของโรงแรมที่ authorize ให้
**And** Front Desk เข้าถึง read-only เฉพาะราคาแนะนำ
**And** System Admin เข้าถึงทุกโรงแรม
**And** ข้อมูลโรงแรม A ไม่สามารถเข้าถึงจากผู้ใช้ที่ไม่ได้ authorize (tenant isolation)

### Story 1.5: Hotel Registration & User Invitation

As a **เจ้าของโรงแรม**,
I want **เพิ่มโรงแรมในบัญชีและ invite ผู้ใช้อื่นเข้ามาดูแล**,
So that **เริ่มใช้งานระบบสำหรับโรงแรมของตัวเอง และมีทีมช่วยดูแล**.

**Acceptance Criteria:**

**Given** เจ้าของที่ login แล้ว
**When** กดเพิ่มโรงแรมใหม่ กรอกชื่อ + ข้อมูลพื้นฐาน
**Then** ระบบสร้าง hotel record + ผูกกับ owner account
**And** จำนวนโรงแรมต้องไม่เกิน limit ของ package
**And** Owner สามารถ invite email อื่นเป็น Revenue Manager หรือ Front Desk
**And** ผู้ได้รับ invite สามารถลงทะเบียน/login แล้วเข้าถึงโรงแรมที่ invite ให้
**And** Revenue Manager สามารถเข้าถึงโรงแรมจากหลาย owner ที่ authorize ให้

---

## Epic 2: Hotel Configuration & OTA Connection

**Goal:** เจ้าของโรงแรมเชื่อมต่อ OTA ผ่าน Channex และระบบเริ่มดึงข้อมูลอัตโนมัติ
**FRs:** FR1, FR2, FR3, FR4, FR27, FR28, FR29, FR30

### Story 2.1: Channex Integration Setup

As a **developer (Pond)**,
I want **เชื่อมต่อ Channex White Label API ให้พร้อมใช้งาน**,
So that **ระบบสามารถดึงข้อมูลจาก OTA ได้ผ่าน Channex**.

**Acceptance Criteria:**

**Given** Channex API credentials ถูกตั้งค่าใน environment
**When** ระบบเรียก Channex API
**Then** สามารถ authenticate และ list properties ได้สำเร็จ
**And** มี OTA adapter layer ที่รองรับ Channex REST API + Webhooks
**And** Webhook endpoint รับ booking updates จาก Channex ได้
**And** Retry logic 3 ครั้ง exponential backoff เมื่อ API error
**And** ทุก API call/response ถูก log ไว้สำหรับ debugging
**And** มี mock data layer ที่ simulate OTA data สำหรับพัฒนา Epic 3-5 ขนานได้ แม้ Channex ยังไม่พร้อม

### Story 2.2: OTA Credentials & Property Connection

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อบัญชี OTA (Agoda, Booking.com) กับระบบ**,
So that **ระบบดึงข้อมูลโรงแรมจาก OTA ได้**.

**Acceptance Criteria:**

**Given** เจ้าของที่มีโรงแรมในระบบแล้ว
**When** กดเชื่อมต่อ OTA แล้วกรอก credentials / เชื่อมผ่าน Channex
**Then** ระบบ verify connection สำเร็จ + แสดงสถานะ "เชื่อมต่อแล้ว"
**And** credentials ถูกเก็บ encrypted แยกจาก main data
**And** ถ้า credentials ผิดแสดง error ชัดเจนพร้อมคำแนะนำ
**And** สามารถเชื่อมต่อ Agoda และ Booking.com ได้อย่างน้อย 2 OTA
**And** เจ้าของเลือก notification channel (LINE/Telegram) ในขั้นตอนนี้

### Story 2.3: Room Type Mapping & Pricing Boundaries

As a **เจ้าของโรงแรม**,
I want **จับคู่ room types ระหว่าง OTA กับระบบ และตั้ง pricing boundaries**,
So that **ระบบรู้ว่าห้องไหนตรงกับห้องไหนบน OTA และ AI ปรับราคาได้ในกรอบที่กำหนด**.

**Acceptance Criteria:**

**Given** โรงแรมเชื่อมต่อ OTA สำเร็จแล้ว
**When** ระบบดึง room types จาก Channex มาแสดง
**Then** เจ้าของสามารถ map room type ของแต่ละ OTA เข้าด้วยกัน (เช่น "Superior" บน Agoda = "Standard King" บน Booking)
**And** เจ้าของตั้ง pricing boundaries ต่อ room type (ราคาต่ำสุด, ราคาสูงสุด, % ลดสูงสุด)
**And** ถ้าไม่ตั้ง boundaries ระบบใช้ค่า default ที่ปลอดภัย
**And** สามารถแก้ไข mapping และ boundaries ได้ภายหลัง

### Story 2.4: Automated OTA Data Sync

As a **เจ้าของโรงแรม**,
I want **ระบบดึงข้อมูลราคาและ booking จาก OTA อัตโนมัติ**,
So that **ข้อมูลในระบบเป็นปัจจุบันเสมอ โดยไม่ต้องทำอะไรเอง**.

**Acceptance Criteria:**

**Given** โรงแรมเชื่อมต่อ OTA + mapping room types เสร็จแล้ว
**When** cron job ทำงานตามรอบ (ทุก 5 นาที)
**Then** ระบบดึงราคาปัจจุบันของทุก room type จากทุก OTA ที่เชื่อมต่อ
**And** ดึง booking data (จองใหม่, ยกเลิก, occupancy)
**And** ข้อมูลถูก normalize เป็นสกุลเงินบาท + format มาตรฐาน
**And** Webhook จาก Channex อัปเดต booking real-time เมื่อมีจองใหม่/ยกเลิก
**And** ถ้า sync ล้มเหลว ระบบ retry 3 ครั้ง แล้ว log error
**And** สถานะ sync แสดงใน dashboard (สำเร็จ/ล้มเหลว + เวลาล่าสุด)

---

## Epic 3: AI Pricing Recommendations

**Goal:** AI วิเคราะห์ข้อมูลและสร้างคำแนะนำราคาพร้อมเหตุผลภาษาไทย เจ้าของ approve/reject + feedback ได้ — core value ของ product
**FRs:** FR7, FR8, FR9, FR10, FR11, FR12, FR33

### Story 3.1: AI Pricing Engine (Claude API + Expert Rules)

As a **developer (Pond)**,
I want **สร้าง AI pricing engine ที่วิเคราะห์ข้อมูล OTA แล้วสร้างคำแนะนำราคา**,
So that **ระบบสามารถแนะนำราคาที่เหมาะสมพร้อมเหตุผลภาษาไทย**.

**Acceptance Criteria:**

**Given** โรงแรมมีข้อมูล OTA sync แล้วอย่างน้อย 3 วัน
**When** AI engine ทำงาน (cron หรือ trigger)
**Then** ระบบส่งข้อมูล (ราคาปัจจุบัน, booking pace, occupancy, historical data) ไปยัง Claude API
**And** Claude API วิเคราะห์แล้วส่งกลับคำแนะนำราคาต่อ room type + วันที่
**And** คำแนะนำมีเหตุผลเป็นภาษาไทยที่เข้าใจง่าย (เช่น "booking pace สูงกว่าปกติ 30% แนะนำขึ้นราคา +200 บาท")
**And** คำแนะนำอยู่ภายใน pricing boundaries ที่เจ้าของตั้งไว้เสมอ
**And** Expert rules ถูก embed ใน prompt (เช่น "ไม่แนะนำลดราคามากกว่า 20% จากราคาปกติ")
**And** ทุกคำแนะนำถูกบันทึกใน database พร้อม audit log

### Story 3.2: Recommendation Review & Approval

As a **เจ้าของโรงแรม**,
I want **ดูคำแนะนำราคาจาก AI แล้ว approve หรือ reject ได้**,
So that **ตัดสินใจเรื่องราคาได้อย่างมั่นใจ โดย AI เป็นผู้แนะนำ ไม่ใช่ผู้ตัดสินใจ**.

**Acceptance Criteria:**

**Given** AI สร้างคำแนะนำราคาใหม่
**When** เจ้าของเปิดหน้า recommendations บน web
**Then** เห็นรายการคำแนะนำ: room type, วันที่, ราคาปัจจุบัน, ราคาแนะนำ, % เปลี่ยนแปลง, เหตุผลภาษาไทย
**And** กด [อนุมัติ] → สถานะเปลี่ยนเป็น "อนุมัติแล้ว" + บันทึกเวลาและผู้อนุมัติ
**And** กด [ปฏิเสธ] → แสดง dropdown เหตุผล (structured feedback)
**And** สามารถ approve/reject ทีละรายการ หรือ batch approve ทั้งหมดได้
**And** คำแนะนำที่หมดอายุ (วันที่ผ่านแล้ว) ถูก mark เป็น "หมดอายุ" อัตโนมัติ

### Story 3.3: Rejection Feedback & AI Learning Loop

As a **เจ้าของโรงแรม**,
I want **ให้เหตุผลเมื่อปฏิเสธคำแนะนำ เพื่อให้ AI เรียนรู้และดีขึ้น**,
So that **คำแนะนำในอนาคตตรงกับความต้องการมากขึ้น**.

**Acceptance Criteria:**

**Given** เจ้าของกด [ปฏิเสธ] คำแนะนำ
**When** เลือกเหตุผลจาก dropdown (เช่น "มี local event", "ราคาสูงเกินไป", "ราคาต่ำเกินไป", "อื่นๆ")
**Then** ระบบบันทึก feedback ลง database ผูกกับ recommendation record
**And** ถ้าเลือก "อื่นๆ" สามารถพิมพ์เหตุผลเพิ่มได้
**And** Feedback ถูกรวมเข้า prompt ของ AI ครั้งถัดไป (context injection)
**And** ระบบ track approval rate ต่อโรงแรม (วัดว่า AI ดีขึ้นไหม)

### Story 3.4: Recommendation History & Audit Trail

As a **เจ้าของโรงแรม**,
I want **ดูประวัติคำแนะนำทั้งหมดและ audit trail**,
So that **ตรวจสอบย้อนหลังได้ว่า AI แนะนำอะไร ตัดสินใจอะไร และผลลัพธ์เป็นอย่างไร**.

**Acceptance Criteria:**

**Given** เจ้าของเปิดหน้า recommendation history
**When** เลือกช่วงวันที่
**Then** เห็นรายการคำแนะนำทั้งหมด: วันที่, room type, ราคาแนะนำ, สถานะ (approve/reject/expired), ผู้ตัดสินใจ, เวลา
**And** ถ้า rejected เห็นเหตุผลที่ให้ไว้
**And** สามารถ filter ตาม room type, สถานะ, OTA
**And** แสดง approval rate summary (เช่น "เดือนนี้ approve 72%")
**And** ทุก action ถูกบันทึกเป็น audit log (ใคร ทำอะไร เมื่อไหร่)

---

## Epic 4: Notification System (LINE & Telegram)

**Goal:** แจ้งเตือนผ่าน LINE/Telegram เมื่อมีคำแนะนำใหม่หรือ sync ล้มเหลว พร้อม link ไป approve บน web
**FRs:** FR6, FR13, FR14, FR15, FR16

### Story 4.1: LINE Messaging Integration

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อบัญชี LINE กับระบบ**,
So that **ได้รับแจ้งเตือนคำแนะนำราคาผ่าน LINE ที่ใช้อยู่ทุกวัน**.

**Acceptance Criteria:**

**Given** เจ้าของเลือก LINE เป็น notification channel ตอน setup
**When** กดเชื่อมต่อ LINE
**Then** ระบบแสดง QR code หรือ link เพื่อ add LINE Official Account เป็นเพื่อน
**And** เมื่อ add เพื่อนสำเร็จ ระบบผูก LINE userId กับบัญชีผู้ใช้
**And** ส่ง welcome message ยืนยันว่าเชื่อมต่อสำเร็จ
**And** สามารถ disconnect/reconnect ได้ภายหลัง

### Story 4.2: Telegram Bot Integration

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อ Telegram กับระบบ**,
So that **ได้รับแจ้งเตือนผ่าน Telegram แทน LINE ถ้าต้องการ**.

**Acceptance Criteria:**

**Given** เจ้าของเลือก Telegram เป็น notification channel
**When** กดเชื่อมต่อ Telegram
**Then** ระบบแสดง link ไป Telegram bot + verification code
**And** ผู้ใช้ส่ง code ให้ bot → ระบบผูก Telegram chatId กับบัญชี
**And** ส่ง welcome message ยืนยันเชื่อมต่อสำเร็จ
**And** สามารถ disconnect/reconnect ได้ภายหลัง

### Story 4.3: AI Recommendation Notifications

As a **เจ้าของโรงแรม**,
I want **ได้รับแจ้งเตือนผ่าน LINE/Telegram เมื่อ AI สร้างคำแนะนำราคาใหม่**,
So that **ไม่พลาดคำแนะนำสำคัญ และ approve ได้เร็วโดยไม่ต้องเปิด web เอง**.

**Acceptance Criteria:**

**Given** AI สร้างคำแนะนำราคาใหม่สำหรับโรงแรม
**When** ระบบส่ง notification
**Then** LINE: ส่ง Flex Message แสดงสรุป (จำนวนคำแนะนำ, room types, ราคาแนะนำหลัก)
**And** Telegram: ส่ง message + inline keyboard แสดงสรุปเดียวกัน
**And** ทั้งสอง channel มี link กดไปหน้า approve บน web โดยตรง
**And** ส่งไปเฉพาะ channel ที่ผู้ใช้เลือกไว้
**And** delivery rate > 95% ภายใน 1 นาที
**And** ถ้าส่งไม่สำเร็จ retry 2 ครั้ง แล้ว log error

### Story 4.4: System Alert Notifications

As a **เจ้าของโรงแรม**,
I want **ได้รับแจ้งเตือนเมื่อ OTA sync ล้มเหลว**,
So that **รู้ทันทีว่าข้อมูลอาจไม่เป็นปัจจุบัน และดำเนินการแก้ไขได้**.

**Acceptance Criteria:**

**Given** OTA sync ล้มเหลวหลัง retry 3 ครั้ง
**When** ระบบ detect sync failure
**Then** ส่งแจ้งเตือนผ่าน LINE/Telegram ตาม channel ที่เลือก
**And** ข้อความระบุชัดว่า OTA ไหนมีปัญหา + เวลาที่ sync สำเร็จล่าสุด
**And** มี link ไปหน้า connection settings บน web เพื่อตรวจสอบ
**And** ไม่ส่ง alert ซ้ำถ้าปัญหาเดิมยังไม่ได้แก้ (throttle 1 ครั้ง/ชั่วโมง)
**And** เมื่อ sync กลับมาปกติ ส่ง "กลับมาปกติแล้ว" อีก 1 ครั้ง

---

## Epic 5: Dashboard & Analytics

**Goal:** เจ้าของโรงแรมดูภาพรวม occupancy, revenue, ราคาทุก OTA, คำแนะนำ AI รอ approve, และ revenue comparison
**FRs:** FR5, FR17, FR18, FR19, FR20, FR21, FR34

### Story 5.1: Main Dashboard Overview

As a **เจ้าของโรงแรม**,
I want **เห็นภาพรวมโรงแรมทั้งหมดในหน้าเดียวเมื่อ login**,
So that **รู้สถานะโรงแรมทันทีโดยไม่ต้องกดหลายหน้า**.

**Acceptance Criteria:**

**Given** เจ้าของ login สำเร็จ
**When** เข้าหน้า dashboard
**Then** เห็น occupancy วันนี้ (%) + กราฟ 7 วันข้างหน้า
**And** เห็น revenue สรุปเดือนนี้ vs เดือนก่อน
**And** เห็นจำนวนคำแนะนำ AI ที่รอ approve (กดไปหน้า recommendations ได้)
**And** เห็นสถานะ OTA sync (เชื่อมต่อปกติ / มีปัญหา)
**And** ทุกข้อความแสดงเป็นภาษาไทย
**And** หน้า load เสร็จภายใน 3 วินาที

### Story 5.2: Price Management View

As a **เจ้าของโรงแรม**,
I want **ดูราคาทุก room type ของทุก OTA ในหน้าเดียว**,
So that **เปรียบเทียบราคาข้าม OTA ได้ง่ายโดยไม่ต้องเปิด extranet แต่ละเจ้า**.

**Acceptance Criteria:**

**Given** เจ้าของเปิดหน้า price management
**When** หน้าโหลด
**Then** แสดงตาราง: แถว = room type, คอลัมน์ = OTA (Agoda, Booking.com)
**And** แต่ละช่องแสดงราคาปัจจุบัน + เวลา sync ล่าสุด
**And** สามารถเลือกดูช่วงวันที่ (วันนี้, 7 วัน, 14 วัน, 30 วัน)
**And** ถ้าราคาต่างกันระหว่าง OTA ไฮไลท์สีเตือน
**And** กดที่ room type ดู price history graph ได้

### Story 5.3: AI Recommendations Queue

As a **เจ้าของโรงแรม**,
I want **ดูรายการคำแนะนำ AI ที่รอ approve ในหน้าเฉพาะ**,
So that **จัดการคำแนะนำได้อย่างมีประสิทธิภาพ ไม่พลาดรายการสำคัญ**.

**Acceptance Criteria:**

**Given** มีคำแนะนำ AI ที่ยัง pending
**When** เจ้าของเปิดหน้า recommendations
**Then** เห็นรายการเรียงตามความเร่งด่วน (วันที่ใกล้สุดอยู่บน)
**And** แต่ละรายการแสดง: room type, วันที่, ราคาปัจจุบัน → ราคาแนะนำ, % เปลี่ยน, เหตุผลภาษาไทย
**And** กด [อนุมัติ] หรือ [ปฏิเสธ] ได้ (ใช้ API จาก Story 3.2 — story นี้เป็น enhanced UI เพิ่ม sorting, filtering, batch operations)
**And** มีปุ่ม "อนุมัติทั้งหมด" สำหรับ batch approve
**And** filter ตามสถานะ: รอดำเนินการ, อนุมัติแล้ว, ปฏิเสธ, หมดอายุ
**And** หน้านี้คือหน้าที่ LINE/Telegram notification link ชี้มา
**Note:** Story 3.2 สร้าง API + basic approve/reject UI ส่วน Story นี้เป็น dedicated page ที่เพิ่ม sorting, filtering, batch operations

### Story 5.4: Revenue Comparison & Analytics

As a **เจ้าของโรงแรม**,
I want **เปรียบเทียบ revenue ก่อนและหลังใช้ระบบ**,
So that **เห็นผลลัพธ์จริงว่า AI ช่วยเพิ่ม revenue ได้จริงหรือไม่**.

**Acceptance Criteria:**

**Given** โรงแรมใช้ระบบมาอย่างน้อย 14 วัน
**When** เจ้าของเปิดหน้า analytics
**Then** แสดง revenue comparison: ก่อนใช้ vs หลังใช้ (กราฟ + ตัวเลข + %)
**And** แสดง AI performance: approval rate, จำนวนคำแนะนำ, % ที่ AI แนะนำถูกต้อง
**And** แสดง occupancy trend เปรียบเทียบ
**And** สามารถเลือกช่วงเวลาเปรียบเทียบได้ (7 วัน, 30 วัน, 90 วัน)
**And** สามารถ export ข้อมูลเป็น CSV/Excel ได้

---

# MVP-1 — Scale Phase

## MVP-1 Functional Requirements

- FR35: ระบบสามารถ push ราคาไป OTA ได้อัตโนมัติเมื่อผู้ใช้ approve คำแนะนำ
- FR36: ระบบรองรับ rate parity enforcement ข้าม OTA เมื่อ push ราคา
- FR37: ระบบสามารถ rollback ราคาที่ push ไปได้ถ้าเกิดข้อผิดพลาด
- FR38: ระบบรองรับ OTA เพิ่มเติม: Expedia, Traveloka, Trip.com
- FR39: เจ้าของโรงแรมสามารถสร้างกฎปรับราคาอัตโนมัติได้ (Rules Engine)
- FR40: กฎสามารถทำงานร่วมกับ AI recommendations ได้ (Hybrid mode)
- FR41: ระบบสามารถดึงข้อมูลราคาคู่แข่งจาก data provider ได้
- FR42: เจ้าของโรงแรมสามารถดูราคาคู่แข่งในย่านเดียวกันบน dashboard ได้
- FR43: AI สามารถนำข้อมูลคู่แข่งมาประกอบการแนะนำราคาได้

### MVP-1 FR Coverage Map

| FR | Epic | คำอธิบาย |
|----|------|---------|
| FR35 | Epic 6 | Auto-push ราคาไป OTA |
| FR36 | Epic 6 | Rate parity enforcement |
| FR37 | Epic 6 | Rollback ราคาที่ push |
| FR38 | Epic 7 | เพิ่ม OTA: Expedia, Traveloka, Trip.com |
| FR39 | Epic 8 | Rules Engine สร้างกฎปรับราคา |
| FR40 | Epic 8 | AI + Rules Hybrid |
| FR41 | Epic 9 | ดึงข้อมูลราคาคู่แข่ง |
| FR42 | Epic 9 | Dashboard ราคาคู่แข่ง |
| FR43 | Epic 9 | AI competitor-aware pricing |

## MVP-1 Epic List

### Epic 6: Auto-Push Pricing to OTAs
เมื่อผู้ใช้ approve คำแนะนำ ระบบ push ราคาไป OTA ให้อัตโนมัติ — ไม่ต้องไปแก้เองบน extranet
**FRs covered:** FR35, FR36, FR37

### Epic 7: Additional OTA Integrations
เพิ่ม OTA Adapter สำหรับ Expedia, Traveloka, Trip.com ผ่าน Channex — ขยาย channel distribution
**FRs covered:** FR38

### Epic 8: Automated Pricing Rules Engine
เจ้าของโรงแรมสร้างกฎปรับราคาอัตโนมัติ เช่น "ถ้า occupancy > 80% → ขึ้นราคา 10%" — ทำงานร่วมกับ AI
**FRs covered:** FR39, FR40

### Epic 9: Competitor Radar
ดูราคาคู่แข่งในย่านเดียวกัน + AI นำข้อมูลคู่แข่งมาประกอบการแนะนำราคา
**FRs covered:** FR41, FR42, FR43

---

## Epic 6: Auto-Push Pricing to OTAs

**Goal:** เมื่อผู้ใช้ approve คำแนะนำ ระบบ push ราคาไป Agoda/Booking.com อัตโนมัติผ่าน Channex write API
**FRs:** FR35, FR36, FR37

### Story 6.1: Channex Write API Integration

As a **developer (Pond)**,
I want **เชื่อมต่อ Channex Write API เพื่อ push ราคาไป OTA**,
So that **ระบบสามารถปรับราคาบน OTA ได้อัตโนมัติ ไม่ต้องเข้า extranet เอง**.

**Acceptance Criteria:**

**Given** Channex Write API credentials ถูกตั้งค่า
**When** ระบบเรียก rate update API
**Then** สามารถ push ราคาใหม่ไป property/room type/date ที่ระบุได้
**And** รองรับ push ไปหลาย OTA พร้อมกัน (Agoda + Booking.com)
**And** Retry 3 ครั้ง exponential backoff เมื่อ push ล้มเหลว
**And** ทุก push operation ถูก log ไว้ใน PriceUpdateLog (status, timestamp, OTA, response)
**And** Mock mode สำหรับ development โดยไม่ push จริง

### Story 6.2: Approval → Auto-Push Flow

As a **เจ้าของโรงแรม**,
I want **เมื่อ approve คำแนะนำ AI ราคาถูก push ไป OTA ให้อัตโนมัติ**,
So that **ไม่ต้องไปแก้ราคาบน extranet เอง ประหยัดเวลา**.

**Acceptance Criteria:**

**Given** เจ้าของกด [อนุมัติ] คำแนะนำราคา
**When** ระบบดำเนินการ push
**Then** ราคาใหม่ถูก push ไปทุก OTA ที่เชื่อมต่อสำหรับ room type + วันที่ที่ระบุ
**And** UI แสดงสถานะ push: "กำลัง push..." → "push สำเร็จ ✅" หรือ "push ล้มเหลว ❌"
**And** เมื่อ push สำเร็จ recommendation status เปลี่ยนเป็น "อนุมัติ + push แล้ว"
**And** เมื่อ push ล้มเหลว แสดง error + option retry
**And** Batch approve → batch push ทำงานได้
**And** ส่ง notification สรุปผล push ผ่าน LINE/Telegram

### Story 6.3: Push Status Tracking & Rollback

As a **เจ้าของโรงแรม**,
I want **ดูสถานะ push ทุกรายการ และ rollback ราคาได้ถ้าจำเป็น**,
So that **มั่นใจว่าราคาบน OTA ถูกต้อง และแก้ไขได้ถ้าผิดพลาด**.

**Acceptance Criteria:**

**Given** มี push history
**When** เจ้าของเปิดหน้า push status
**Then** เห็นรายการ push ทั้งหมด: วันเวลา, room type, OTA, ราคาเก่า → ราคาใหม่, สถานะ (สำเร็จ/ล้มเหลว)
**And** กด [Rollback] → ระบบ push ราคาเดิมกลับไป OTA
**And** Rollback ถูก log เป็น audit trail
**And** แสดงสถานะ rollback: "กำลัง rollback..." → "rollback สำเร็จ"

### Story 6.4: Rate Parity Enforcement

As a **เจ้าของโรงแรม**,
I want **ระบบ push ราคาเดียวกันไปทุก OTA (rate parity)**,
So that **ไม่ละเมิด rate parity agreement กับ OTA**.

**Acceptance Criteria:**

**Given** เจ้าของ approve คำแนะนำสำหรับ room type หนึ่ง
**When** ระบบ push ราคา
**Then** ราคาเดียวกันถูก push ไปทุก OTA ที่มี room type mapping
**And** ถ้า OTA ใดไม่มี mapping ข้าม OTA นั้น
**And** ถ้า push สำเร็จบาง OTA ไม่สำเร็จบาง OTA → แจ้งเตือน + option retry เฉพาะที่ล้มเหลว
**And** Rate parity check: ตรวจสอบว่าราคาทุก OTA ตรงกันหลัง push
**And** ถ้าไม่ตรงกัน → แสดง warning badge บน rate parity view

---

## Epic 7: Additional OTA Integrations

**Goal:** เพิ่ม OTA adapters สำหรับ Expedia, Traveloka, Trip.com ผ่าน Channex
**FRs:** FR38

### Story 7.1: OTA Adapter Factory & Extensibility

As a **developer (Pond)**,
I want **refactor OTA adapter layer เป็น factory pattern**,
So that **เพิ่ม OTA ใหม่ได้โดยสร้างแค่ config + mapping ไม่ต้องเขียน code มาก**.

**Acceptance Criteria:**

**Given** OTA adapter layer ปัจจุบัน
**When** refactor เป็น factory pattern
**Then** แต่ละ OTA เป็น config object: { name, channexId, brandColor, logoUrl, rateMapping }
**And** เพิ่ม OTA ใหม่โดยเพิ่ม config ไม่ต้องเขียน adapter code ใหม่
**And** UI components (badges, tables, charts) render dynamic ตาม OTA list
**And** Prisma schema รองรับ OTA name เป็น string ไม่ใช่ enum (extensible)
**And** Migration ไม่กระทบ data เดิม

### Story 7.2: Expedia Integration

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อ Expedia กับระบบ**,
So that **ดูราคาและ push ราคาไป Expedia ได้ด้วย**.

**Acceptance Criteria:**

**Given** OTA adapter factory พร้อม
**When** เจ้าของเลือกเชื่อมต่อ Expedia
**Then** ระบบเชื่อมต่อผ่าน Channex → Expedia property
**And** Room type mapping ทำงานเหมือน Agoda/Booking.com
**And** Rate sync + push ทำงานปกติ
**And** แสดงบน rate parity view + dashboard

### Story 7.3: Traveloka Integration

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อ Traveloka กับระบบ**,
So that **ครอบคลุมตลาด SEA ที่ Traveloka แข็งแกร่ง**.

**Acceptance Criteria:**

**Given** OTA adapter factory พร้อม
**When** เจ้าของเลือกเชื่อมต่อ Traveloka
**Then** ระบบเชื่อมต่อผ่าน Channex → Traveloka
**And** Room type mapping + rate sync + push ทำงานปกติ
**And** แสดงบน rate parity view + dashboard

### Story 7.4: Trip.com Integration

As a **เจ้าของโรงแรม**,
I want **เชื่อมต่อ Trip.com กับระบบ**,
So that **ครอบคลุมตลาดจีนที่สำคัญสำหรับโรงแรมไทย**.

**Acceptance Criteria:**

**Given** OTA adapter factory พร้อม
**When** เจ้าของเลือกเชื่อมต่อ Trip.com
**Then** ระบบเชื่อมต่อผ่าน Channex → Trip.com
**And** Room type mapping + rate sync + push ทำงานปกติ
**And** แสดงบน rate parity view + dashboard

---

## Epic 8: Automated Pricing Rules Engine

**Goal:** เจ้าของโรงแรมสร้างกฎปรับราคาอัตโนมัติ ทำงานร่วมกับ AI — ลดการ approve ด้วยมือ
**FRs:** FR39, FR40

### Story 8.1: Rules Engine Core

As a **developer (Pond)**,
I want **สร้าง pricing rules engine ที่ evaluate conditions แล้ว trigger price actions**,
So that **ราคาปรับอัตโนมัติตามกฎที่เจ้าของตั้ง โดยไม่ต้อง approve ทุกครั้ง**.

**Acceptance Criteria:**

**Given** Rules engine schema:
```
Rule = { condition: Condition[], action: Action, priority: number, enabled: boolean }
Condition = { metric: string, operator: string, value: number }
Action = { type: "adjust_price", direction: "up"|"down", amount: number, unit: "%"|"baht" }
```
**When** Cron job evaluate rules
**Then** ทุก rule ที่ conditions ตรง → execute action
**And** Actions อยู่ภายใน pricing boundaries เสมอ
**And** ถ้าหลาย rules match → ใช้ priority สูงสุด
**And** Rule execution ถูก log ทุกครั้ง
**And** Prisma models: PricingRule, RuleExecution, RuleCondition

### Story 8.2: Rule Templates & Management UI

As a **เจ้าของโรงแรม**,
I want **สร้างและจัดการกฎปรับราคาผ่าน UI ที่ง่าย**,
So that **ตั้งกฎได้โดยไม่ต้องเป็นโปรแกรมเมอร์**.

**Acceptance Criteria:**

**Given** เจ้าของเปิดหน้า pricing rules
**When** กดสร้างกฎใหม่
**Then** เลือกจาก template ได้:
- "ถ้า occupancy > X% → ขึ้นราคา Y%"
- "ถ้า occupancy < X% → ลดราคา Y%"
- "วันหยุด/วันพิเศษ → ขึ้นราคา Y%"
- "ถ้า booking pace สูงกว่าปกติ → ขึ้นราคา Y บาท"
- "Custom rule" → กำหนดเอง
**And** สามารถเลือก room types ที่ rule apply
**And** สามารถ enable/disable แต่ละ rule
**And** แสดง preview ว่า rule จะมีผลกับราคาอย่างไร
**And** สามารถแก้ไข/ลบ rules ได้

### Story 8.3: Rule Execution & Monitoring

As a **เจ้าของโรงแรม**,
I want **ดูว่ากฎทำงานอย่างไร และผลลัพธ์เป็นอย่างไร**,
So that **มั่นใจว่ากฎทำงานถูกต้อง และปรับแต่งได้**.

**Acceptance Criteria:**

**Given** มี rules ที่ enable อยู่
**When** เจ้าของเปิดหน้า rule monitoring
**Then** เห็นรายการ rule executions: วันเวลา, rule ชื่ออะไร, room type, ราคาเปลี่ยนเท่าไหร่
**And** แสดง success/fail count ต่อ rule
**And** แสดง revenue impact estimate (ถ้ามีข้อมูลเพียงพอ)
**And** Alert ถ้า rule trigger ผิดปกติ (เช่น fire บ่อยเกินไป)

### Story 8.4: AI + Rules Hybrid Mode

As a **เจ้าของโรงแรม**,
I want **AI recommendations ทำงานร่วมกับ rules ได้**,
So that **กฎจัดการ routine pricing ส่วน AI จัดการ complex situations**.

**Acceptance Criteria:**

**Given** ทั้ง AI recommendations และ rules ทำงานอยู่
**When** ทั้งสองแนะนำราคาต่างกัน
**Then** ถ้า rule กับ AI ตรงกัน → auto-execute (ไม่ต้อง approve)
**And** ถ้า rule กับ AI ขัดกัน → แสดงให้เจ้าของเลือก + อธิบายทั้งสอง
**And** เจ้าของตั้งค่าได้ว่า rules override AI หรือ AI override rules
**And** Dashboard แสดง: กี่ครั้งที่ AI กับ rules เห็นตรงกัน vs ขัดกัน

---

## Epic 9: Competitor Radar

**Goal:** ดูราคาคู่แข่งในย่านเดียวกัน + AI นำข้อมูลคู่แข่งมาประกอบการแนะนำราคา
**FRs:** FR41, FR42, FR43

### Story 9.1: Competitor Data Provider Integration

As a **developer (Pond)**,
I want **เชื่อมต่อ competitor price data provider**,
So that **ระบบมีข้อมูลราคาคู่แข่งสำหรับวิเคราะห์**.

**Acceptance Criteria:**

**Given** Data provider API credentials ถูกตั้งค่า (เช่น RateGain, OTA Insight, หรือ scraping service)
**When** ระบบดึงข้อมูลราคาคู่แข่ง
**Then** ดึงราคาของ competitor set (5-10 โรงแรมในย่านเดียวกัน) ได้
**And** ข้อมูลรวม: ชื่อโรงแรม, room type ใกล้เคียง, ราคาต่อ OTA, วันที่
**And** Sync อย่างน้อยวันละ 1 ครั้ง
**And** Prisma models: Competitor, CompetitorRate
**And** Demo mode: ใช้ mock data ที่สมจริง (5 โรงแรมคู่แข่ง)

### Story 9.2: Competitor Dashboard & Radar View

As a **เจ้าของโรงแรม**,
I want **ดูราคาคู่แข่งเทียบกับราคาของตัวเองบน dashboard**,
So that **รู้ว่า position ราคาของตัวเองอยู่ตรงไหนเมื่อเทียบกับตลาด**.

**Acceptance Criteria:**

**Given** มีข้อมูลราคาคู่แข่ง
**When** เจ้าของเปิดหน้า Competitor Radar
**Then** แสดงตาราง: แถว = วันที่, คอลัมน์ = โรงแรมคู่แข่ง + โรงแรมตัวเอง
**And** ไฮไลท์ราคาตัวเอง: เขียว (ถูกกว่า), แดง (แพงกว่า), เหลือง (ใกล้เคียง)
**And** แสดง ranking: โรงแรมเราอยู่อันดับที่เท่าไหร่จากถูกที่สุด
**And** กราฟเปรียบเทียบ price position ย้อนหลัง 30 วัน
**And** เลือกดูต่อ room type ได้
**And** แสดง avg market price + ราคาของเรา vs market

### Story 9.3: AI Competitor-Aware Pricing

As a **เจ้าของโรงแรม**,
I want **AI นำข้อมูลคู่แข่งมาประกอบการแนะนำราคา**,
So that **คำแนะนำราคาจาก AI สมจริงกว่าเดิม เพราะรู้ราคาตลาด**.

**Acceptance Criteria:**

**Given** มีข้อมูล competitor rates + OTA data ของตัวเอง
**When** AI engine สร้างคำแนะนำ
**Then** AI prompt รวม competitor data: avg market price, position, trend
**And** เหตุผลคำแนะนำอ้างอิง competitor ได้ เช่น "คู่แข่ง 3/5 แห่งขึ้นราคาแล้ว แนะนำปรับตาม"
**And** AI ไม่แนะนำราคาที่ undercut ตลาดมากเกิน (เว้นแต่มีเหตุผลชัด)
**And** Approval rate ของ competitor-aware recommendations ควรสูงกว่า basic recommendations
