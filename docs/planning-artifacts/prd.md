---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - 'docs/planning-artifacts/product-brief-OTA-2026-03-12.md'
  - 'docs/planning-artifacts/research/market-ai-ota-price-management-thailand-research-2026-03-12.md'
  - 'docs/brainstorming/brainstorming-session-2026-03-12-001.md'
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'SaaS B2B + Marketplace Integration Platform'
  domain: 'Hospitality Revenue Management + OTA Distribution'
  complexity: 'medium-high'
  projectContext: 'greenfield'
---

# Product Requirements Document - OTA

**Author:** Pond
**Date:** 2026-03-16

## Executive Summary

**OTA** คือ AI Revenue Assistant แบบ SaaS B2B ที่ทำให้โรงแรมอิสระในไทยเข้าถึง revenue management ระดับ premium ผ่าน AI ที่เรียนรู้จากผู้เชี่ยวชาญตัวจริง — ส่งคำแนะนำราคาถึงมือเจ้าของผ่าน LINE/Telegram เจ้าของโรงแรมเพียงอ่านคำแนะนำและกดอนุมัติ ระบบจัดการปรับราคาบน OTAs ให้อัตโนมัติ

กลุ่มเป้าหมายหลักคือโรงแรมอิสระ (57.65% ของตลาดไทย) ที่กว่า 90% ยังไม่เคยใช้ Revenue Management Software ส่งผลให้ 48% สูญเสียรายได้ทุกสัปดาห์จากการปรับราคาไม่ทันสถานการณ์ โซลูชันระดับสากลมีราคาสูง (€119-$2,000+/เดือน) ไม่รองรับภาษาไทย และไม่เข้าใจบริบทตลาดท้องถิ่น

ผู้ใช้หลัก 3 กลุ่ม: เจ้าของโรงแรม (buyer + decision maker), Revenue Manager อิสระ (force multiplier ที่พาโรงแรมหลายแห่งเข้ามา), และพนักงาน Front Desk (end user ที่ต้องตอบราคา walk-in ให้สอดคล้องกับ OTA)

### สิ่งที่ทำให้พิเศษ

1. **AI จาก Domain Expert จริง** — องค์ความรู้จากผู้เชี่ยวชาญด้านราคาโรงแรมชั้นนำที่มีค่าตัวสูงและเวลาจำกัด OTA แปลง wisdom นี้เป็น AI ให้โรงแรมทุกขนาดเข้าถึงได้
2. **LINE/Telegram-First Approach** — คนไทยใช้ LINE ทุกวัน การส่งคำแนะนำผ่าน LINE/Telegram + กดอนุมัติทันทีเป็น unfair advantage ที่คู่แข่งต่างชาติทำไม่ได้ง่ายๆ
3. **Progressive Automation (Trust Ladder)** — "AI แนะนำ คุณตัดสินใจ" (MVP-0) → "AI ทำอัตโนมัติภายในกรอบ" (MVP-1) ค่อยๆ เพิ่ม automation เมื่อสร้างความไว้ใจแล้ว
4. **Why Now** — AI technology ในปี 2026 พร้อมสร้าง pricing intelligence ระดับที่เคยต้องพึ่งคนเท่านั้น ขณะที่ยังไม่มีผู้เล่นในตำแหน่ง "AI pricing + ภาษาไทย + ราคาย่อมเยา" สำหรับ SME โรงแรมไทย

## Project Classification

| หมวด | รายละเอียด |
|------|-----------|
| **Project Type** | SaaS B2B + Marketplace Integration Platform |
| **Domain** | Hospitality Revenue Management + OTA Distribution |
| **Complexity** | Medium-High (OTA API integrations + AI pricing engine + real-time data) |
| **Project Context** | Greenfield — สร้างใหม่ตั้งแต่ต้น |
| **Team** | Pond (solo developer) + Claude (AI pair programmer) |

## Success Criteria

### User Success

**เจ้าของโรงแรม (คุณวิชัย):**
- ลดหรือเลิกจ้าง revenue manager ได้ โดยที่ revenue ไม่ลดลงหรือเพิ่มขึ้น
- ใช้เวลาจัดการราคาน้อยกว่า 15 นาที/วัน
- **Aha! Moment:** "เดือนนี้ revenue เพิ่มขึ้นโดยผมไม่ต้องทำอะไรเลย"

**Revenue Manager (คุณแพร):**
- ใช้เวลาดูแล 10 โรงแรมไม่ถึงครึ่งวัน (จากเดิมใช้ทั้งวัน) — ลดเวลาทำงาน 50%+
- สามารถรับดูแลโรงแรมเพิ่มได้โดยไม่ต้องเพิ่มชั่วโมงทำงาน
- **Aha! Moment:** "ดูแลได้ 8 โรงแรมแล้ว แทนที่จะแค่ 5"

**Front Desk (น้องมิ้นท์):**
- ตอบราคา walk-in ได้ภายใน 5 วินาที สอดคล้องกับราคาบน OTA
- **Aha! Moment:** "ไม่โดนแขก complain ว่าราคาแพงกว่า Agoda อีกแล้ว"

### Business Success

| ระยะเวลา | เป้าหมาย | เกณฑ์สำเร็จ |
|----------|---------|------------|
| **Phase 1 (เดือน 1-2)** | 10-20 โรงแรม pilot | Retention > 80%, AI approval rate > 60%, Time-to-Value < 14 วัน |
| **Phase 2 (เดือน 3+)** | 100+ Active Hotels | Active Hotels growing month-over-month, pricing model validated |
| **12 เดือน** | กำหนดภายหลัง | ขึ้นอยู่กับผลลัพธ์ Phase 1-2 |

**นิยาม Active Hotel:** โรงแรมที่อนุมัติคำแนะนำราคาจาก AI อย่างน้อย 1 ครั้ง/สัปดาห์

**Growth KPIs:**
- Revenue Manager Multiplier Effect — revenue manager 1 คนพาโรงแรมเข้ามา 5+ แห่ง
- Conversion rate จาก free trial → paid user
- Monthly churn rate < 5% (หลัง Phase 1)

### Technical Success

| เกณฑ์ | เป้าหมาย | เหตุผล |
|------|---------|--------|
| **OTA data sync** | ภายใน 5 นาที | ราคาที่ค้าง = สูญเสียรายได้ |
| **System uptime** | 99.5%+ | ถ้าล่ม ราคาไม่อัปเดต |
| **AI approval rate** | > 60% | ต่ำกว่า 60% = ผู้ใช้ไม่เชื่อ AI |
| **LINE/Telegram delivery** | > 95% ภายใน 1 นาที | ถ้าแจ้งเตือนไม่ถึง = พลาดคำแนะนำ |

### Measurable Outcomes

| Metric | วิธีวัด | เป้าหมาย |
|--------|--------|---------|
| Revenue impact per hotel | เปรียบเทียบ revenue ก่อน/หลังใช้ | เพิ่มขึ้นหรือไม่ลดลง |
| Time saved per hotel/week | ชั่วโมงที่ประหยัดจาก manual pricing | 5+ ชั่วโมง/สัปดาห์ |
| AI trust score | % คำแนะนำที่ถูก approve | > 60% |
| Time-to-Value | วันจาก onboarding ถึง revenue impact ครั้งแรก | < 14 วัน |
| Pricing discovery | willingness to pay จาก pilot | ได้ค่าที่ชัดเจนจาก Phase 1 |

## Product Scope & Phased Development

### MVP Strategy

**MVP Approach:** Problem-Solving MVP — พิสูจน์ว่า AI แนะนำราคาได้ดีพอที่ผู้ใช้จะเชื่อ โดยใช้ทรัพยากรน้อยที่สุด

**Resource Reality:**
- **ทีมพัฒนา:** Pond (solo developer) + Claude (AI pair programmer)
- **ข้อได้เปรียบ:** บริษัทมีโรงแรมพร้อมทดสอบแล้ว = ไม่ต้องเสียเวลาหา pilot customers

### MVP-0 — Validation (Phase 1, เดือน 1-2)

**Core Journey:** คุณวิชัย Success Path — **"AI แนะนำ คุณตัดสินใจ"**

**Minimum viable = AI แนะนำราคาที่ดี + ผู้ใช้เห็นและ approve ได้**

```
ดึงข้อมูลจาก OTA (read-only) → AI วิเคราะห์ → แนะนำราคา → LINE/Telegram แจ้ง → ผู้ใช้ approve บน web
→ (MVP-0: ผู้ใช้ไปปรับราคาบน OTA เอง)
→ (MVP-1: ระบบ push ราคาไป OTA ให้อัตโนมัติ)
```

| # | Feature | เหตุผล | Complexity |
|---|---------|--------|-----------|
| 1 | **เชื่อม OTA 2 เจ้า (Agoda + Booking.com) read-only** | 2 เจ้าครอบคลุมตลาดไทย + global | สูง (critical path) |
| 2 | **AI pricing recommendations** | Core value proposition | สูง |
| 3 | **Web dashboard (basic) ภาษาไทย** | ดูราคา + approve/reject AI | กลาง |
| 4 | **LINE/Telegram notification** | ส่ง link ไป approve บน web | ต่ำ |

**ตัดออกจาก MVP-0 (ทำ manual แทน):**

| Feature | แทนด้วย |
|---------|---------|
| Auto-push ราคาไป OTA | ผู้ใช้ปรับราคาบน OTA เองตามคำแนะนำ AI |
| เชื่อม OTA 3+ เจ้า | เริ่ม 2 เจ้าก่อน ค่อยเพิ่ม |
| Onboarding อัตโนมัติ | Pond setup ให้ pilot hotels เอง |
| Admin dashboard | Pond monitor เองได้ตอน pilot |

**Critical Path:** OTA integration strategy (ผ่าน Channel Manager vs direct API) — ตัดสินใจในขั้นตอน Architecture

### MVP-1 — Scale (Phase 2, เดือน 3+)

เปิดเมื่อ MVP-0 ผ่านเกณฑ์ (retention > 80%, approval > 60%)

- Auto-push ราคาไป OTAs (write access / Channel Manager)
- เพิ่ม OTA: Expedia, Traveloka, Trip.com
- กฎปรับราคาอัตโนมัติ (rules engine)
- เรดาร์ราคาคู่แข่ง (ผ่าน data provider)

### Growth Features (Phase 3)

- Full LINE Bot + Telegram Bot (rich menu, quick actions)
- Front Desk walk-in price tool
- Multi-property dashboard
- Rate parity monitor
- Subscription billing อัตโนมัติ
- Airbnb, Klook integrations

### Vision (Phase 4)

- What-if pricing simulator
- Advanced analytics + market intelligence reports
- ขยาย SEA — เวียดนาม, อินโดนีเซีย, ฟิลิปปินส์

## User Journeys

### Journey 1: คุณวิชัย — เจ้าของโรงแรมที่อยากปลดล็อกเวลาคืน (Primary - Success Path)

**Opening Scene:** คุณวิชัยนั่งอยู่ในออฟฟิศเล็กๆ หลังเคาน์เตอร์โรงแรม 80 ห้องที่ภูเก็ต เพิ่งจ่ายเงินเดือนให้คุณแพร revenue manager ไป 45,000 บาท ขณะที่ occupancy เดือนนี้แค่ 62% — เขารู้ว่าจ้างคนเก่งมาแล้วแต่ก็ยังรู้สึกว่า "ทำไมมันไม่ดีขึ้นเท่าที่หวัง" เพื่อนเจ้าของโรงแรมใน Facebook group โพสต์ว่า "ลองใช้ OTA มา 2 สัปดาห์ revenue ขึ้น 12% โดยไม่ต้องทำอะไร"

**Rising Action:** คุณวิชัยสมัคร free trial ใส่ชื่อโรงแรม ระบบดึงข้อมูลจาก Agoda/Booking.com ให้เอง ทีม OTA ช่วย setup เชื่อมต่อ OTA ให้ วันแรกเขาเปิด dashboard เห็นราคาทุก OTA ของตัวเองอยู่ในหน้าเดียว วันที่ 3 LINE ส่ง notification: "AI แนะนำขึ้นราคา Deluxe Room +200 บาท สำหรับวันศุกร์-อาทิตย์นี้ เพราะ booking pace สูงกว่าปกติ 30%" เขากดลิงก์ เข้า web เห็นเหตุผลชัดเจน กด [อนุมัติ]

**Climax:** สิ้นเดือนแรก dashboard แสดง "Revenue เพิ่มขึ้น 14% เทียบกับเดือนก่อน" คุณวิชัยเริ่มคิด — ถ้า AI ทำได้แบบนี้ ยังต้องจ้าง revenue manager เต็มเวลาอีกไหม?

**Resolution:** เดือนที่ 3 คุณวิชัยเปลี่ยนจากจ้าง revenue manager เต็มเวลาเป็นจ้างที่ปรึกษาเดือนละ 2 ครั้ง ประหยัดค่าใช้จ่ายเดือนละ 30,000+ บาท ทุกเช้าเขาใช้เวลาแค่ 10 นาทีกับ LINE notification แล้วไปทำงานอื่น

**→ Requirements:** OTA integration (read), AI recommendations + เหตุผลภาษาไทย, LINE notification + web approve, Revenue dashboard before/after

### Journey 2: คุณแพร — Revenue Manager ที่อยากทลายเพดาน (Primary - Power User)

**Opening Scene:** คุณแพรเป็น revenue manager อิสระดูแล 5 โรงแรมทั่วภูเก็ตและกระบี่ ทุกเช้าเปิด extranet ของ Agoda, Booking.com, Expedia ทีละโรงแรม (15 tabs ขั้นต่ำ) ใช้เวลาเกือบทั้งวัน มีโรงแรมอีก 3 แห่งติดต่อมาแต่ปฏิเสธเพราะไม่มีเวลา

**Rising Action:** เจ้าของโรงแรมที่ดูแลคนหนึ่งแนะนำให้ลอง OTA คุณแพรเชื่อมโรงแรม 5 แห่งเข้าระบบ AI วิเคราะห์ให้แล้วสรุปว่า "โรงแรม A ควรขึ้นราคา weekend +15%, โรงแรม B ควรลด weekday -10%" — สิ่งที่เธอใช้เวลา 3 ชั่วโมงวิเคราะห์เอง AI ทำให้ใน 3 วินาที

**Climax:** สัปดาห์ที่ 2 คุณแพรทำงานเสร็จก่อนเที่ยง ตัดสินใจรับดูแลโรงแรมเพิ่มอีก 3 แห่ง แนะนำให้ทุกโรงแรมที่ดูแลใช้ OTA

**Resolution:** 3 เดือนต่อมา คุณแพรดูแล 10 โรงแรมโดยใช้เวลาไม่ถึงครึ่งวัน เปลี่ยนบทบาทจาก "ทำเอง" เป็น "ตรวจสอบที่ AI ทำ" กลายเป็น power user ที่พาโรงแรมใหม่เข้าระบบทุกครั้ง

**→ Requirements:** Multi-property view, AI analysis ข้ามโรงแรม, Batch approve/reject, Revenue Manager referral flow

### Journey 3: คุณวิชัย — เมื่อ AI แนะนำผิด (Primary - Edge Case)

**Opening Scene:** AI แนะนำลดราคา Superior Room -300 บาท เพราะ booking pace ต่ำ แต่คุณวิชัยรู้ว่าพรุ่งนี้มี event ใหญ่ในภูเก็ตที่ AI ยังไม่รู้

**Rising Action:** คุณวิชัยกด [ปฏิเสธ] พร้อมเลือกเหตุผล "มี local event" วันถัดมา booking พุ่งขึ้นจริง

**Climax:** AI เรียนรู้จาก feedback สัปดาห์ถัดมาแนะนำขึ้นราคาก่อน event โดยอ้างอิง event calendar

**Resolution:** Approval rate เพิ่มจาก 55% เป็น 75% ใน 2 เดือน ความไว้ใจสร้างขึ้นจาก transparency

**→ Requirements:** Reject + structured feedback, AI learning loop, Recommendation history + audit trail, Approval rate tracking

### Journey 4: ทีม OTA (Admin) — Onboarding และ monitor ระบบ

**Opening Scene:** ทีม OTA ได้ lead จากคุณแพร 3 โรงแรมใหม่ ต้อง onboard และ monitor ว่า AI ทำงานถูกต้อง

**Rising Action:** เข้า admin dashboard setup: เชื่อมต่อ OTA credentials, ตั้งค่า competitor set, กำหนด pricing boundaries พบ sync error กับ Booking.com → แก้ภายใน 15 นาที (re-authenticate)

**Resolution:** ทุกเช้าเช็ค system health: API sync status, AI quality scores, error logs จัดการก่อนลูกค้ารู้ตัว

**→ Requirements:** Admin dashboard (system health, sync status, error logs), Hotel onboarding workflow, API monitoring + alerting, User management

### Journey 5: OTA ↔ OTA API — Data Flow (Integration)

**Data Flow:**
1. **Inbound:** ดึง booking data (จองใหม่, ยกเลิก, ราคา, availability) จาก Agoda/Booking.com
2. **Processing:** AI engine วิเคราะห์ → สร้างคำแนะนำ
3. **Outbound (MVP-1):** เมื่อ user approve → push ราคาไปทุก OTA → confirm สำเร็จ

**Error Scenario:** Agoda API return error 429 (rate limit) → retry exponential backoff → ถ้าไม่สำเร็จ 3 ครั้ง → alert admin + แจ้ง user

**→ Requirements:** OTA adapter layer (แยกต่อ OTA), Retry + exponential backoff, Transaction logging, Sync monitoring, Error handling + user notification

### Journey Requirements Summary

| Journey | Capability Areas |
|---------|-----------------|
| **คุณวิชัย (Success)** | OTA integration, AI recommendations, LINE/Telegram notifications, Revenue dashboard |
| **คุณแพร (Power User)** | Multi-property view, Batch operations, Portfolio insights, Referral flow |
| **คุณวิชัย (Edge Case)** | Reject + feedback flow, AI learning loop, Audit trail, Transparency |
| **ทีม OTA (Admin)** | Admin dashboard, System monitoring, Onboarding workflow, User management |
| **API Integration** | OTA adapters, Retry logic, Transaction logs, Error handling, Sync monitoring |

## Domain-Specific Requirements

### Compliance & Regulatory

- **OTA API Terms of Service** — ต้องปฏิบัติตาม terms ของแต่ละ OTA (Booking.com Connectivity Partner Program certification, Agoda/Expedia partner API agreements)
- **Rate Parity** — ระบบต้องช่วยรักษา rate parity ไม่ใช่ทำให้ละเมิด
- **PDPA** — ปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล ถ้าเก็บข้อมูล booking ที่มีชื่อแขก

### Technical Constraints

- **OTA API Availability** — ต้อง graceful degradation เมื่อ OTA API ล่ม
- **Data Freshness** — sync ภายใน 5 นาที ป้องกัน overbooking/ราคาไม่ตรง
- **Multi-Currency** — normalize ราคาเป็นบาทก่อนวิเคราะห์

### Data Privacy & Ownership

- **ข้อมูลเป็นของโรงแรม** — ชัดเจนใน terms of service
- **Tenant isolation** — ข้อมูลโรงแรม A ไม่เปิดเผยให้โรงแรม B เด็ดขาด
- **Aggregate data** — ต้องได้ consent + anonymize ก่อนใช้เป็น market insights

### Risk Mitigations

| ความเสี่ยง | ผลกระทบ | แนวทางลดความเสี่ยง |
|-----------|---------|-------------------|
| **AI แนะนำราคาผิด** | โรงแรมเสียรายได้ | MVP-0: "AI แนะนำ คุณตัดสินใจ" + แสดงเหตุผลทุกครั้ง |
| **OTA API เปลี่ยน spec** | ราคาไม่ sync | Adapter pattern + monitoring + alerting |
| **ข้อมูลรั่วไหล** | เสีย trust | Tenant isolation + encryption at rest & in transit |
| **Overbooking จาก sync delay** | แขกถูกปฏิเสธ | Sync < 5 นาที + alert เมื่อล้มเหลว + fallback หยุด push |
| **Liability จาก AI** | ฟ้อง/เรียกค่าเสียหาย | Terms: AI เป็น "คำแนะนำ" ไม่ใช่ "การรับประกัน" |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Democratize Expertise Model** — แปลง domain expert ที่หายากเป็น AI ที่ทุกโรงแรมเข้าถึงได้ (เทียบเคียง Wealthfront, Canva)
2. **LINE/Telegram-First B2B SaaS** — ไม่มี B2B SaaS ใน hospitality ที่ใช้ chat platform เป็น primary decision-making channel
3. **Progressive Automation (Trust Ladder)** — "AI แนะนำ" → "AI ทำอัตโนมัติภายในกรอบ" ค่อยๆ เพิ่ม automation เมื่อ trust สูงขึ้น

### Validation Approach

| Innovation | วิธี Validate | เกณฑ์สำเร็จ |
|-----------|--------------|------------|
| **Democratize Expertise** | วัด revenue impact เทียบกับโรงแรมที่มี/ไม่มี revenue manager | Revenue ไม่ลดลงหรือเพิ่มขึ้น |
| **LINE/Telegram-First** | วัด % approve ผ่าน notification link vs เปิด web เอง | > 50% approve ผ่าน notification |
| **Progressive Automation** | วัด approval rate เพิ่มขึ้นตามเวลา | 60% → 75%+ ใน 2 เดือน |

### Innovation Risk Mitigation

| Risk | Fallback |
|------|----------|
| AI quality ไม่ดีพอ | คง "AI แนะนำ" mode ไม่เปิด auto จนกว่า approval > 60% |
| Notification ถูก mute/ignore | Web dashboard morning brief เป็น fallback |
| Expertise model ไม่ scale | ผู้เชี่ยวชาญ review AI output เป็น hybrid model ในช่วงแรก |

## SaaS B2B Specific Requirements

### Tenant Model

- **1 user = หลายโรงแรม** ตามจำนวนที่ subscription package อนุญาต
- **Data isolation ระดับโรงแรม** — ข้อมูลโรงแรม A ไม่เปิดเผยให้โรงแรม B (ยกเว้น user เป็นเจ้าของ/ผู้ดูแลทั้งสอง)
- **Revenue Manager access** — ดูแลหลายโรงแรมจากหลาย owner ที่ authorize ให้ได้

### RBAC (Role-Based Access Control)

| Role | สิทธิ์ | ตัวอย่าง |
|------|-------|---------|
| **Owner** | ทุกอย่าง — ดู/แก้ราคา, approve AI, ตั้งค่า rules, ดู revenue, จัดการ users, เลือก package | คุณวิชัย |
| **Revenue Manager** | ดู/แก้ราคา, approve AI, ตั้งค่า rules, ดู revenue — ไม่สามารถจัดการ billing/users | คุณแพร |
| **Front Desk** | ดูราคาแนะนำ walk-in เท่านั้น — read-only | น้องมิ้นท์ |
| **System Admin** | จัดการทุกโรงแรม, onboarding, monitor system health, AI quality | ทีม OTA |

### Subscription Tiers

Pricing model จะ validate จาก Phase 1 pilot — โครงสร้างรองรับหลาย tier:

| Tier | จำนวนโรงแรม | ฟีเจอร์ | กลุ่มเป้าหมาย |
|------|------------|---------|-------------|
| **Starter** | 1 โรงแรม | AI recommendations, OTA sync, LINE/Telegram notification, Web dashboard | เจ้าของโรงแรมเล็ก |
| **Professional** | 3-5 โรงแรม | + auto-pricing rules + เรดาร์คู่แข่ง | เจ้าของหลายแห่ง / Revenue Manager |
| **Enterprise** | ไม่จำกัด | + multi-property dashboard + API access + dedicated support | เครือโรงแรม / ที่ปรึกษา |

### Integration List

**OTA Integrations:**

| Phase | OTA | Market |
|-------|-----|--------|
| MVP-0 | Agoda, Booking.com (read-only) | ไทย + Global |
| MVP-1 | + Expedia, Traveloka, Trip.com (read + write) | + SEA + จีน |
| Growth | + Airbnb, Klook | + Short-term rental + Activities |

**Notification Channels:**

| Phase | Channel |
|-------|---------|
| MVP-0 | LINE Messaging API + Telegram Bot API (push notification + link) |
| Growth | Full LINE Bot (rich menu + quick actions) |

**Future Integrations:**
- PMS — CloudBeds, Opera, HMS Thailand
- Payment gateway
- Google Hotel Ads / Meta Hotel Ads

### Technical Architecture Considerations

- **API-first design** — REST API รองรับ web dashboard, LINE, Telegram, future mobile
- **OTA Adapter Pattern** — แยก adapter ต่อ OTA เพิ่มใหม่ได้ง่าย
- **Event-driven** — message queue สำหรับ async operations
- **AI Engine isolation** — แยก service เพื่อ scale/update อิสระ

## Functional Requirements

### 1. OTA Data Integration

- **FR1:** ระบบสามารถดึงข้อมูลราคาห้องพักปัจจุบันจาก Agoda ได้
- **FR2:** ระบบสามารถดึงข้อมูลราคาห้องพักปัจจุบันจาก Booking.com ได้
- **FR3:** ระบบสามารถดึงข้อมูล booking (จองใหม่, ยกเลิก, availability) จาก OTA ที่เชื่อมต่อได้
- **FR4:** ระบบสามารถ sync ข้อมูลจาก OTA ได้อัตโนมัติตามรอบเวลาที่กำหนด
- **FR5:** ระบบสามารถแสดงราคาปัจจุบันของทุก OTA ที่เชื่อมต่อในหน้าเดียวได้
- **FR6:** ระบบสามารถแจ้งเตือนเมื่อ sync กับ OTA ล้มเหลว

### 2. AI Pricing Intelligence

- **FR7:** AI สามารถวิเคราะห์ข้อมูลจาก OTAs + booking pace แล้วสร้างคำแนะนำราคาได้
- **FR8:** AI สามารถแสดงเหตุผลประกอบคำแนะนำราคาเป็นภาษาไทยที่เข้าใจง่าย
- **FR9:** เจ้าของโรงแรมสามารถอนุมัติหรือปฏิเสธคำแนะนำราคาจาก AI ได้
- **FR10:** เจ้าของโรงแรมสามารถเลือกเหตุผลที่ปฏิเสธคำแนะนำ (structured feedback) ได้
- **FR11:** ระบบสามารถบันทึก feedback จากการปฏิเสธเพื่อปรับปรุง AI ได้
- **FR12:** ระบบสามารถแสดงประวัติคำแนะนำทั้งหมด (approved/rejected) พร้อมเหตุผลได้

### 3. Notification & Alerts

- **FR13:** ระบบสามารถส่ง notification ผ่าน LINE เมื่อมีคำแนะนำราคาใหม่ได้
- **FR14:** ระบบสามารถส่ง notification ผ่าน Telegram เมื่อมีคำแนะนำราคาใหม่ได้
- **FR15:** Notification สามารถมี link ไปหน้า approve/reject บน web dashboard ได้
- **FR16:** ระบบสามารถแจ้งเตือนเมื่อ OTA sync ล้มเหลวผ่าน LINE/Telegram ได้

### 4. Web Dashboard

- **FR17:** เจ้าของโรงแรมสามารถดูภาพรวม occupancy และ revenue บน dashboard ได้
- **FR18:** เจ้าของโรงแรมสามารถดูราคาปัจจุบันของทุก room type บนทุก OTA ได้
- **FR19:** เจ้าของโรงแรมสามารถดูรายการคำแนะนำ AI ที่รอ approve ได้
- **FR20:** เจ้าของโรงแรมสามารถดู revenue comparison ก่อน/หลังใช้ระบบได้
- **FR21:** Dashboard รองรับภาษาไทย

### 5. User & Access Management

- **FR22:** ผู้ใช้สามารถลงทะเบียนและสร้างบัญชีได้
- **FR23:** ผู้ใช้สามารถเพิ่มโรงแรมเข้าในบัญชีได้ตามจำนวนที่ package อนุญาต
- **FR24:** Owner สามารถ invite ผู้ใช้อื่น (Revenue Manager, Front Desk) เข้ามาดูแลโรงแรมของตนได้
- **FR25:** ระบบรองรับ role-based access control (Owner, Revenue Manager, Front Desk, System Admin)
- **FR26:** Revenue Manager สามารถเข้าถึงโรงแรมหลายแห่งจากหลาย owner ที่ authorize ให้ได้

### 6. Hotel Configuration

- **FR27:** เจ้าของโรงแรมสามารถเชื่อมต่อ OTA credentials ของโรงแรมได้
- **FR28:** เจ้าของโรงแรมสามารถกำหนด room types และ mapping กับ OTA ได้
- **FR29:** เจ้าของโรงแรมสามารถตั้งค่า pricing boundaries (ราคาต่ำสุด/สูงสุด) ได้
- **FR30:** เจ้าของโรงแรมสามารถเลือก notification channel ที่ต้องการ (LINE/Telegram) ได้

### 7. Data Privacy & Security

- **FR31:** ข้อมูลของแต่ละโรงแรมต้องแยกจากกัน (tenant isolation)
- **FR32:** ระบบต้องเข้ารหัสข้อมูลทั้ง at rest และ in transit
- **FR33:** ระบบต้องบันทึก audit log ของทุกการเปลี่ยนแปลงราคาและ AI recommendations
- **FR34:** เจ้าของโรงแรมสามารถ export ข้อมูลของตัวเองได้

*FR list ครอบคลุม MVP-0 — FR สำหรับ Phase ถัดไป (auto-push, pricing rules, competitor radar, front desk tools, multi-property) จะเพิ่มเมื่อถึงเวลา*

## Non-Functional Requirements

### Performance

| NFR | เกณฑ์ | เหตุผล |
|-----|------|--------|
| **NFR1:** OTA data sync | อัปเดตภายใน 5 นาที | ราคาที่ค้าง = สูญเสียรายได้ |
| **NFR2:** Dashboard load time | โหลดภายใน 3 วินาที | เจ้าของเปิดดูทุกเช้า |
| **NFR3:** AI recommendation | สร้างภายใน 30 วินาทีหลังข้อมูลเข้า | ทันสถานการณ์ตลาด |
| **NFR4:** Notification delivery | ส่งถึงภายใน 1 นาที | ช้า = พลาดโอกาส |

### Security

| NFR | เกณฑ์ | เหตุผล |
|-----|------|--------|
| **NFR5:** Data encryption | AES-256 at rest + TLS 1.2+ in transit | ข้อมูลธุรกิจ sensitive |
| **NFR6:** Tenant isolation | ข้อมูลข้ามโรงแรมเข้าถึงไม่ได้ทุกกรณี | ป้องกันรั่วข้ามลูกค้า |
| **NFR7:** Credentials storage | Encryption แยก ไม่อยู่ใน main database | ป้องกัน credentials หลุด |
| **NFR8:** Authentication | OAuth 2.0 / JWT + session timeout | Unauthorized access |
| **NFR9:** PDPA | ปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล | กฎหมายไทย |

### Scalability

| NFR | เกณฑ์ | เหตุผล |
|-----|------|--------|
| **NFR10:** MVP-0 capacity | รองรับ 20 โรงแรม pilot | Phase 1 target |
| **NFR11:** Growth capacity | Scale ถึง 500+ โรงแรมโดยไม่ต้อง re-architect | ไม่ต้อง rewrite เมื่อเติบโต |
| **NFR12:** OTA extensibility | เพิ่ม OTA ใหม่โดยสร้างแค่ adapter ใหม่ | ต้องเพิ่ม 5+ OTA |

### Integration

| NFR | เกณฑ์ | เหตุผล |
|-----|------|--------|
| **NFR13:** Graceful degradation | ระบบทำงานต่อได้เมื่อ OTA API ล่ม | Third-party dependency |
| **NFR14:** Retry mechanism | Exponential backoff สูงสุด 3 ครั้ง | Transient errors |
| **NFR15:** Notification fallback | แสดงบน web dashboard เมื่อ push ไม่สำเร็จ | ผู้ใช้ต้องเห็นคำแนะนำเสมอ |

### Reliability

| NFR | เกณฑ์ | เหตุผล |
|-----|------|--------|
| **NFR16:** System uptime | 99.5%+ | MVP-0 read-only ไม่ catastrophic แต่ต้องเสถียร |
| **NFR17:** Data backup | ทุกวัน + retention 30 วัน | ป้องกัน data loss |
| **NFR18:** Error logging | Log ทุก error + context สำหรับ debugging | Solo dev ต้อง debug เร็ว |
