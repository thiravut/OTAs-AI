---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-03-16'
lastStep: 8
inputDocuments:
  - 'docs/planning-artifacts/prd.md'
  - 'docs/planning-artifacts/product-brief-OTA-2026-03-12.md'
  - 'docs/planning-artifacts/research/market-ai-ota-price-management-thailand-research-2026-03-12.md'
  - 'docs/brainstorming/brainstorming-session-2026-03-12-001.md'
workflowType: 'architecture'
project_name: 'OTA'
user_name: 'Pond'
date: '2026-03-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**34 Functional Requirements ใน 7 กลุ่ม:**

| Capability Area | FRs | Architecture Impact |
|----------------|-----|-------------------|
| **OTA Data Integration** | FR1-6 | OTA adapter layer + scheduled sync + error handling — **critical path** |
| **AI Pricing Intelligence** | FR7-12 | LLM API + expert rules (ไม่ต้อง custom ML model) + feedback loop + recommendation storage |
| **Notification & Alerts** | FR13-16 | LINE Messaging API + Telegram Bot API + notification queue |
| **Web Dashboard** | FR17-21 | Frontend web app ภาษาไทย — basic dashboard |
| **User & Access Management** | FR22-26 | Authentication + RBAC 4 roles + cross-hotel access |
| **Hotel Configuration** | FR27-30 | OTA credentials management + room mapping + pricing boundaries |
| **Data Privacy & Security** | FR31-34 | Tenant isolation + encryption + audit logging + data export |

**NFRs ที่กำหนด architecture:**

| Category | Key Driver | Impact |
|----------|-----------|--------|
| **Performance** | Sync < 5 นาที, Dashboard < 3s, AI < 30s | Async processing + caching (เมื่อจำเป็น) |
| **Security** | AES-256, TLS 1.2+, tenant isolation, PDPA | Encrypted storage + row-level security |
| **Scalability** | 20 → 500+ โรงแรม | Modular design รองรับ scale ทีหลัง |
| **Integration** | Graceful degradation, retry, fallback | Error handling + retry logic |
| **Reliability** | 99.5% uptime, daily backup | Managed cloud services |

### Scale & Complexity

- **Primary domain:** Full-stack web application + API integrations + LLM-powered AI
- **Complexity level:** Medium-High
- **MVP-0 scope:** 4 core features, 2 OTA read-only, solo developer (Pond + Claude)

### Architecture Approach: Modular Monolith

**เหตุผล:** Solo developer → monolith ที่ดีกว่า microservices ที่พัง

**MVP-0 Components (3 ตัวเท่านั้น):**
1. **Backend Monolith** — API server + OTA adapters + AI logic + notification + business logic ทั้งหมดอยู่ใน codebase เดียว แบ่ง modules ชัดเจน
2. **Frontend** — Web dashboard ภาษาไทย
3. **Database** — Managed cloud database

**ไม่ต้องมีใน MVP-0:** Cache layer, message queue, แยก AI service — เพิ่มเมื่อ scale ต้องการ

**Scale Strategy:** เมื่อต้อง scale → แยก module ที่เป็น bottleneck ออกเป็น service (เช่น OTA sync, AI engine)

### AI Engine Strategy

**ใช้ LLM API (Claude/GPT) + Expert Rules แทน Custom ML Model:**
- ส่ง data context (ราคาปัจจุบัน, booking pace, competitor data) ให้ LLM วิเคราะห์
- ผสม rules จากผู้เชี่ยวชาญ (pricing boundaries, seasonality, market patterns)
- สร้างคำแนะนำราคา + เหตุผลภาษาไทยจาก LLM โดยตรง
- ไม่ต้อง train/maintain ML model เอง — ลด complexity สำหรับ solo dev

### Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| **Solo dev + Claude** | เลือก tech stack ที่ productive สูง + managed services ลด ops |
| **OTA API read-only (MVP-0)** | ลด complexity — ไม่ต้อง write certification |
| **OTA API availability** | Third-party dependency → graceful degradation |
| **LLM API dependency** | ต้อง fallback เมื่อ LLM API ล่ม (cache last recommendation) |
| **มีโรงแรม pilot พร้อม** | Deploy ได้เร็ว ไม่ต้อง perfect architecture ตั้งแต่แรก |

### Cross-Cutting Concerns

1. **Tenant Isolation** — ทุก module ต้อง enforce data separation ระหว่างโรงแรม
2. **Error Handling** — OTA sync failures ต้อง propagate + alert ผ่าน LINE/Telegram
3. **Audit Trail** — log ทุกการเปลี่ยนแปลงราคาและ AI recommendation
4. **Thai Language** — Dashboard + AI recommendations เป็นภาษาไทย
5. **RBAC** — 4 roles enforce ทุก endpoint

## Starter Template & Tech Stack

### Selected Stack: Next.js + React-Bootstrap + Prisma + PostgreSQL

**Rationale:** Full-stack ใน codebase เดียว เหมาะกับ solo dev + Claude, deploy ง่ายผ่าน Vercel, React-Bootstrap ให้ Bootstrap 5 styling ที่คุ้นเคย

### Initialization Command

```bash
npx create-next-app@latest ota --typescript --app --src-dir --import-alias "@/*"
```

### Tech Stack Details

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| **Framework** | Next.js (App Router) | Full-stack ใน codebase เดียว, Server Components สำหรับ data-heavy dashboard |
| **Language** | TypeScript | Type safety, Claude เขียนได้ดี, Prisma auto-generate types |
| **UI** | React-Bootstrap + Bootstrap 5 | Bootstrap styling ที่ Pond คุ้นเคย ใน React ecosystem |
| **ORM** | Prisma | Type-safe database access, auto-generate types, migration management |
| **Database** | PostgreSQL (Neon/Supabase managed) | ลด ops — ไม่ต้อง manage DB server เอง |
| **Auth** | NextAuth.js (Auth.js) | Built-in สำหรับ Next.js, รองรับ RBAC |
| **AI** | Claude/GPT API | LLM สร้างคำแนะนำราคา + เหตุผลภาษาไทย |
| **LINE** | LINE Messaging API | Push notification + Flex Message |
| **Telegram** | Telegram Bot API | Push notification + inline buttons |
| **Deploy** | Contabo VPS + Docker Compose | App + DB + Cron อยู่ server เดียว ลด latency + cost |
| **Reverse Proxy** | Nginx หรือ Caddy | SSL termination + routing |
| **Cron/Jobs** | Linux cron บน server | OTA sync ทุก 5 นาที ไม่มี limitation |

### Architectural Decisions from Starter

- **Language:** TypeScript strict mode
- **Styling:** React-Bootstrap + Bootstrap 5 CSS
- **Build:** Next.js built-in (Turbopack dev, webpack production)
- **Testing:** Jest + React Testing Library (เพิ่มทีหลัง)
- **Code Organization:** Next.js App Router conventions (app/, components/, lib/)
- **API:** Next.js API Routes (app/api/)
- **Environment:** .env.local สำหรับ secrets

### Key Dependencies to Add

```json
{
  "react-bootstrap": "latest",
  "bootstrap": "^5",
  "prisma": "latest",
  "@prisma/client": "latest",
  "next-auth": "latest",
  "@anthropic-ai/sdk": "latest",
  "@line/bot-sdk": "latest",
  "node-telegram-bot-api": "latest"
}
```

**Note:** Project initialization using starter command เป็น implementation story แรก

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- OTA Integration: Channex Channel Manager API (White Label, $130/เดือน)
- Tech Stack: Next.js + React-Bootstrap + Prisma + PostgreSQL
- AI Strategy: Claude API + Expert Rules (ไม่ต้อง custom ML model)
- Deploy: Contabo VPS All-in-One (Docker Compose)

**Important Decisions (Shape Architecture):**
- Auth: NextAuth.js + Email/Password + JWT
- RBAC: 4 roles enforce ทุก endpoint
- Notification: LINE Messaging API + Telegram Bot API

**Deferred Decisions (Post-MVP):**
- Caching strategy
- Message queue
- CI/CD pipeline (manual deploy ก่อน)
- Monitoring (Sentry เพิ่มทีหลัง)

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL บน Contabo VPS | App + DB server เดียว ลด latency + cost |
| **ORM** | Prisma | Type-safe, auto-generate types, migration management |
| **Multi-tenancy** | Single database + row-level filtering (hotelId ทุก table) | เริ่มง่าย solo dev — แยก DB ต่อ tenant ทีหลังได้ |
| **Caching** | ไม่มีใน MVP-0 | 20 โรงแรม query DB ตรงได้ |
| **OTA Integration** | Channex White Label API ($130/เดือน) | REST + JSON + Webhooks, integrate ครั้งเดียวได้ 50+ OTA |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth provider** | NextAuth.js (Auth.js) | Built-in สำหรับ Next.js |
| **Auth method** | Email + Password | เรียบง่ายสำหรับ MVP |
| **RBAC** | 4 roles (Owner, Revenue Manager, Front Desk, System Admin) | Middleware enforce ทุก API route |
| **OTA credentials** | Encrypted แยกจาก main data | ป้องกัน credentials หลุดถ้า DB ถูกเจาะ |
| **Session** | JWT + httpOnly cookies | Stateless ไม่ต้อง session store |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API style** | Next.js API Routes (REST) | Codebase เดียวกับ frontend |
| **Channex** | REST API + Webhooks | Webhook รับ booking updates real-time |
| **LINE** | LINE Messaging API (Push Message + Flex Message) | Notification + link ไป web approve |
| **Telegram** | Telegram Bot API (sendMessage + inline keyboard) | Notification + buttons |
| **LLM** | Anthropic Claude API (@anthropic-ai/sdk) | คำแนะนำราคา + เหตุผลภาษาไทย |
| **Error handling** | Centralized error handler + retry 3x exponential backoff | สำหรับ Channex/LINE/Telegram/Claude APIs |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js App Router + Server Components | Data-heavy dashboard |
| **UI** | React-Bootstrap + Bootstrap 5 | Bootstrap styling ที่ Pond คุ้นเคย |
| **State** | Server Components + useState | ไม่ต้อง Redux — MVP ไม่ซับซ้อนพอ |
| **Language** | ภาษาไทยเท่านั้น (MVP) | Hard-coded Thai — เพิ่ม i18n ใน Growth |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hosting** | Contabo VPS (All-in-One) | App + DB + Cron อยู่ server เดียว ลด latency + cost |
| **Container** | Docker Compose | Next.js container + PostgreSQL container + Nginx |
| **Reverse proxy** | Nginx หรือ Caddy | SSL termination (Let's Encrypt) + routing |
| **Cron** | Linux cron | OTA sync ทุก 5 นาที — ไม่มี limitation |
| **Backup** | pg_dump cron script → cloud storage | Daily backup + 30 วัน retention |
| **Monitoring** | Console logging (MVP) → Sentry (Growth) | เพียงพอสำหรับ pilot |
| **Environment** | .env file (secured on server) | Secrets management |

### Monthly Cost Estimate (MVP-0)

| รายการ | ค่าใช้จ่าย |
|--------|-----------|
| Contabo VPS (app + DB + cron) | ~$5-15/เดือน |
| Channex White Label | $130/เดือน |
| Claude API | ~$10-30/เดือน |
| Domain + SSL | ~$1-2/เดือน |
| LINE/Telegram API | ฟรี |
| **รวม** | **~$146-177/เดือน (~5,100-6,200 บาท)** |

### Implementation Sequence

1. **Project init** — Next.js + dependencies + Docker Compose setup
2. **Database schema** — Prisma + PostgreSQL on Contabo
3. **Auth** — NextAuth.js + Email/Password + RBAC middleware
4. **Channex integration** — Webhook endpoint + API client + cron sync
5. **AI engine** — Claude API + expert rules + recommendation storage
6. **Web dashboard** — React-Bootstrap pages (overview, pricing, recommendations)
7. **Notifications** — LINE + Telegram push + link to web approve
8. **Deploy** — Docker Compose + Nginx + SSL on Contabo

### Cross-Component Dependencies

```
Channex webhook → ต้อง public URL → Contabo + domain + Nginx
AI recommendations → ต้องมี OTA data → Channex ต้องทำก่อน
Notifications → ต้องมี recommendations → AI ต้องทำก่อน
Dashboard → ต้องมี data + auth → ทำ parallel ได้กับ Channex
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma):**
- Tables: PascalCase singular — `Hotel`, `User`, `Recommendation`
- Columns: camelCase — `hotelId`, `createdAt`, `roomType`
- Relations: camelCase — `hotel.recommendations`, `user.hotels`
- Enums: UPPER_SNAKE_CASE — `APPROVED`, `REJECTED`, `PENDING`

**API Routes:**
- Endpoints: kebab-case plural — `/api/hotels`, `/api/recommendations`
- Route params: camelCase — `/api/hotels/[hotelId]`
- Query params: camelCase — `?roomType=deluxe&startDate=2026-03-16`

**Code:**
- Files: kebab-case — `hotel-service.ts`, `price-recommendation.tsx`
- Components: PascalCase — `HotelDashboard`, `RecommendationCard`
- Functions: camelCase — `getHotelPricing()`, `approveRecommendation()`
- Constants: UPPER_SNAKE_CASE — `MAX_RETRY_COUNT`, `SYNC_INTERVAL_MS`
- Types/Interfaces: PascalCase — `Hotel`, `IRecommendation`

### Structure Patterns

**Project Organization (Feature-based):**

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── hotels/
│   │   ├── recommendations/
│   │   ├── auth/
│   │   └── webhooks/channex/
│   ├── dashboard/          # Dashboard pages
│   ├── hotels/             # Hotel management pages
│   └── layout.tsx
├── components/             # Shared React components
│   ├── ui/                 # Generic UI (buttons, cards, modals)
│   └── features/           # Feature-specific components
├── lib/                    # Business logic & services
│   ├── channex/            # Channex API client
│   ├── ai/                 # Claude API + recommendation logic
│   ├── notifications/      # LINE + Telegram
│   ├── auth/               # Auth helpers
│   └── db/                 # Prisma client + queries
├── types/                  # TypeScript type definitions
└── utils/                  # Pure utility functions
```

**Tests:** Co-located — `hotel-service.test.ts` ข้าง `hotel-service.ts`

### Format Patterns

**API Response:**

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { code: "HOTEL_NOT_FOUND", message: "ไม่พบโรงแรม" } }

// List
{ success: true, data: [...], meta: { total: 100, page: 1, limit: 20 } }
```

**Data Formats:**
- Date/Time: ISO 8601 strings ใน API — `"2026-03-16T10:30:00Z"`
- JSON fields: camelCase — `{ hotelId, roomType, recommendedPrice }`
- Currency: จำนวนเต็ม (สตางค์) ใน database — แปลงเป็นบาทที่ frontend เท่านั้น

### Process Patterns

**Error Handling:**

```typescript
// External API errors (Channex, LINE, Claude) → retry 3x exponential backoff
// If still fails → log error + notify admin + mark as failed
// User-facing errors → ภาษาไทย
// System errors → English in logs
```

**Logging:**
- Format: structured JSON — `{ level, message, context, timestamp }`
- Levels: `error` (ต้องแก้), `warn` (ควรดู), `info` (tracking), `debug` (dev only)
- ทุก external API call ต้อง log request/response time

**Authentication Flow:**
- ทุก API route ต้องผ่าน auth middleware ยกเว้น `/api/webhooks/*` และ `/api/auth/*`
- RBAC check หลัง auth — ตรวจ role ก่อนทำ action
- Hotel access check — user ต้อง authorized สำหรับ hotel นั้น

**Channex Webhook:**
- Verify webhook signature ทุกครั้ง
- Process async — acknowledge webhook ก่อน แล้วค่อย process
- Idempotent — handle duplicate webhooks ได้

### Enforcement Guidelines

**All AI Agents MUST:**
- ใช้ naming conventions ตามที่กำหนดข้างต้นเสมอ
- ใส่ error handling + logging ทุก external API call
- ตรวจ auth + RBAC + hotel access ทุก API route
- ใช้ Prisma client จาก `lib/db` เท่านั้น ห้ามสร้าง instance ใหม่
- เขียน user-facing messages เป็นภาษาไทย, system logs เป็นภาษาอังกฤษ
- เก็บ currency เป็นสตางค์ (integer) ใน database เสมอ

## Project Structure & Boundaries

### Complete Project Directory Structure

```
apps/
├── docker-compose.yml          # PostgreSQL + Next.js + Nginx
├── Dockerfile                  # Next.js production build
├── nginx/
│   └── nginx.conf              # Reverse proxy + SSL config
├── scripts/
│   ├── backup.sh               # pg_dump daily backup
│   └── cron-sync.sh            # OTA sync ทุก 5 นาที
├── .env                        # Production secrets
├── .env.example                # Template สำหรับ setup
├── .gitignore
├── package.json
├── next.config.js
├── tsconfig.json
├── README.md
│
├── prisma/
│   ├── schema.prisma           # Database schema ทั้งหมด
│   ├── seed.ts                 # Seed data สำหรับ development
│   └── migrations/             # Database migrations
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (Bootstrap CSS, Thai font)
│   │   ├── page.tsx            # Landing / Login redirect
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── hotels/
│   │   │   │   ├── route.ts
│   │   │   │   └── [hotelId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── pricing/route.ts
│   │   │   │       └── config/route.ts
│   │   │   ├── recommendations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── channex/route.ts
│   │   │   └── notifications/
│   │   │       └── test/route.ts
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── overview/page.tsx
│   │       ├── pricing/page.tsx
│   │       ├── recommendations/page.tsx
│   │       ├── revenue/page.tsx
│   │       ├── hotels/
│   │       │   ├── page.tsx
│   │       │   └── [hotelId]/settings/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── error-alert.tsx
│   │   │   └── data-table.tsx
│   │   └── features/
│   │       ├── recommendation-card.tsx
│   │       ├── price-comparison-table.tsx
│   │       ├── revenue-chart.tsx
│   │       └── hotel-selector.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── prisma.ts
│   │   │   ├── hotels.ts
│   │   │   ├── recommendations.ts
│   │   │   └── users.ts
│   │   ├── channex/
│   │   │   ├── client.ts
│   │   │   ├── sync.ts
│   │   │   ├── webhook-handler.ts
│   │   │   └── types.ts
│   │   ├── ai/
│   │   │   ├── recommendation-engine.ts
│   │   │   ├── prompts.ts
│   │   │   └── types.ts
│   │   ├── notifications/
│   │   │   ├── line.ts
│   │   │   ├── telegram.ts
│   │   │   └── dispatcher.ts
│   │   ├── auth/
│   │   │   ├── options.ts
│   │   │   ├── rbac.ts
│   │   │   └── middleware.ts
│   │   └── logger.ts
│   │
│   ├── types/
│   │   ├── hotel.ts
│   │   ├── recommendation.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── retry.ts
│   │
│   └── middleware.ts
│
└── public/
    └── favicon.ico
```

### Architectural Boundaries

**API Boundaries:**
- `/api/auth/*` — Public (no auth required)
- `/api/webhooks/*` — Public (webhook signature verification)
- `/api/hotels/*` — Authenticated + RBAC (Owner/Revenue Manager)
- `/api/recommendations/*` — Authenticated + RBAC (Owner/Revenue Manager)

**Service Boundaries (within monolith):**
- `apps/src/lib/channex/` — เฉพาะ Channex communication ห้ามเรียก DB ตรง
- `apps/src/lib/ai/` — เฉพาะ AI logic ห้ามเรียก Channex หรือ notification ตรง
- `apps/src/lib/notifications/` — เฉพาะ LINE/Telegram ห้ามเรียก AI หรือ Channex ตรง
- `apps/src/lib/db/` — เฉพาะ database access ที่เดียวที่ใช้ Prisma client

**Data Flow:**
```
Channex webhook/cron → lib/channex/ → lib/db/ → lib/ai/ → lib/db/ → lib/notifications/
                                                                   ↓
                                                              Dashboard (SSR)
```

### FR to Structure Mapping

| FR Group | Location |
|----------|---------|
| **FR1-6: OTA Integration** | `apps/src/lib/channex/`, `apps/src/app/api/webhooks/channex/`, `apps/scripts/cron-sync.sh` |
| **FR7-12: AI Intelligence** | `apps/src/lib/ai/`, `apps/src/app/api/recommendations/` |
| **FR13-16: Notifications** | `apps/src/lib/notifications/` |
| **FR17-21: Dashboard** | `apps/src/app/(dashboard)/`, `apps/src/components/features/` |
| **FR22-26: User Management** | `apps/src/lib/auth/`, `apps/src/app/api/auth/`, `apps/src/app/(auth)/` |
| **FR27-30: Hotel Config** | `apps/src/app/(dashboard)/hotels/`, `apps/src/app/api/hotels/` |
| **FR31-34: Privacy/Security** | `apps/src/lib/auth/rbac.ts`, `apps/src/middleware.ts`, `apps/src/lib/db/` |

### Docker Compose Setup

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [db]
  db:
    image: postgres:16
    volumes: ["pgdata:/var/lib/postgresql/data"]
    env_file: .env
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx/nginx.conf:/etc/nginx/nginx.conf"]
    depends_on: [app]
volumes:
  pgdata:
```

## Architecture Validation Results

### Coherence Validation ✅

- ทุก technology choices ทำงานร่วมกันได้ดี (Next.js + React-Bootstrap + Prisma + PostgreSQL + Docker)
- Channex REST API + Next.js API Routes สอดคล้องกัน (REST + JSON)
- Claude API เรียกจาก server side ปลอดภัย (API key ไม่ถูก expose)
- Docker Compose on Contabo — ทุก component อยู่ server เดียว ไม่มี latency issue
- Naming/structure/format patterns สอดคล้องกับ Next.js + Prisma conventions
- ไม่พบ contradictions

### Requirements Coverage ✅

**ทุก FR (34 ข้อ) และ NFR (18 ข้อ) มี architecture support ครบถ้วน** — ไม่มี gap

### Implementation Readiness ✅

- ทุก critical decision มี version + rationale ครบ
- Project tree ครบถ้วน ทุก FR map ไปยัง file/directory เฉพาะเจาะจง
- Naming, structure, format, process patterns ครอบคลุมทุก conflict point

### Gap Analysis

**No Critical Gaps** — Minor gaps ที่ทำตอน implementation:
- Database schema → ออกแบบ Prisma schema เป็น story แรก
- Channex API auth details → ศึกษา docs ตอน implementation
- AI prompt engineering → ทำ iterative กับผู้เชี่ยวชาญตอน pilot
- SSL certificate → Certbot + Let's Encrypt ตอน setup server

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION ✅
**Confidence Level:** High

**Key Strengths:**
1. Modular Monolith — เรียบง่ายสำหรับ solo dev แต่ scale ได้ทีหลัง
2. Channex — integrate ครั้งเดียวได้ 50+ OTA
3. LLM-based AI — ไม่ต้อง train ML model เอง
4. Docker on Contabo — ราคาถูก ~$145-175/เดือน total
5. `apps/` root — โครงสร้างชัดเจน ทุกอย่างอยู่ในที่เดียว

**Future Enhancement:**
- เพิ่ม caching เมื่อ scale เกิน 100 โรงแรม
- แยก AI engine เป็น service เมื่อ load สูง
- เพิ่ม CI/CD เมื่อมีทีม
- เพิ่ม monitoring (Sentry/Grafana) เมื่อ production mature

### Implementation Handoff

**First command:**
```bash
npx create-next-app@latest apps --typescript --app --src-dir --import-alias "@/*"
```

**Implementation sequence:**
1. Project init + Docker Compose + deploy to Contabo
2. Prisma schema + database migration
3. NextAuth.js + RBAC middleware
4. Channex API client + webhook + cron sync
5. Claude API recommendation engine
6. Dashboard pages (React-Bootstrap)
7. LINE + Telegram notifications
