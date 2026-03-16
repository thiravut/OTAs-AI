---
project_name: 'RateGenie'
user_name: 'Pond'
date: '2026-03-17'
sections_completed: [technology_stack, language_rules, framework_rules, testing_rules, code_quality, workflow_rules, critical_rules]
status: complete
---

# Project Context for AI Agents

_Critical rules and patterns that AI agents must follow when implementing code in RateGenie. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14+ (App Router) | Full-stack framework — Server Components + API Routes |
| **TypeScript** | 5.x (strict mode) | Type safety across entire codebase |
| **React** | 18+ | UI library (via Next.js) |
| **React-Bootstrap** | 2.x | UI component library |
| **Bootstrap** | 5.3+ | CSS framework (SCSS customization) |
| **Prisma** | 5.x | ORM — schema, migrations, type-safe queries |
| **PostgreSQL** | 16+ | Primary database (on Contabo VPS) |
| **NextAuth.js (Auth.js)** | 5.x | Authentication — Email/Password + JWT |
| **@anthropic-ai/sdk** | latest | Claude API for AI pricing recommendations |
| **Docker Compose** | 3.8+ | Container orchestration (Next.js + PostgreSQL + Nginx) |
| **Nginx** | latest | Reverse proxy + SSL (Let's Encrypt) |

**External APIs:**
- Channex White Label API — REST + JSON + Webhooks (OTA integration)
- LINE Messaging API — Push notifications + Flex Messages
- Telegram Bot API — Push notifications + inline keyboards

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode always** — `tsconfig.json` must have `"strict": true`
- **No `any` type** — use `unknown` + type guards when type is uncertain
- **Import aliases** — use `@/*` for imports from `src/` (configured in `tsconfig.json`)
- **Async/await only** — no raw Promises or `.then()` chains
- **Error handling** — always use try/catch in async functions, never let errors silently fail
- **Prisma types** — use Prisma-generated types for all database models, never duplicate type definitions

### Framework-Specific Rules (Next.js App Router)

- **Server Components by default** — only add `'use client'` when component needs interactivity (useState, useEffect, event handlers)
- **API Routes** — all API endpoints in `src/app/api/` using Route Handlers (GET, POST, PUT, DELETE exports)
- **RBAC middleware** — `src/middleware.ts` enforces auth + role check on every request. 4 roles: Owner, Revenue Manager, Front Desk, System Admin
- **Server Actions** — prefer Server Actions for form submissions over API routes when possible
- **No `getServerSideProps`/`getStaticProps`** — these are Pages Router patterns, use Server Components + `fetch` instead
- **Environment variables** — server-only vars in `.env.local`, client-exposed vars must be prefixed `NEXT_PUBLIC_`
- **Hotel scoping** — every API route and data query MUST filter by `hotelId` from authenticated session. Never return data without hotel scope (tenant isolation)

### Database & Prisma Rules

- **Schema location** — `apps/prisma/schema.prisma`
- **Migrations** — always create named migrations: `npx prisma migrate dev --name descriptive_name`
- **Create tables per story** — only create/alter tables that the current story needs. Never create all tables upfront
- **hotelId on everything** — every business table MUST have `hotelId` field for tenant isolation
- **Soft delete** — use `deletedAt` timestamp instead of hard delete for business records
- **Timestamps** — every table has `createdAt` and `updatedAt` (Prisma `@default(now())` and `@updatedAt`)
- **Enum for roles** — `enum Role { OWNER REVENUE_MANAGER FRONT_DESK SYSTEM_ADMIN }`
- **Enum for status** — `enum RecommendationStatus { PENDING APPROVED REJECTED EXPIRED }`

### UI & Styling Rules

- **React-Bootstrap components** — always use React-Bootstrap imports (`import { Card } from 'react-bootstrap'`), not raw HTML with Bootstrap classes
- **SCSS variables** — override Bootstrap defaults in `src/styles/variables.scss`, never use inline colors
- **CSS custom properties** — use `--rg-*` prefix for all custom CSS properties
- **Thai-first** — all UI text hardcoded in Thai. No i18n library needed for MVP
- **Font** — IBM Plex Thai + IBM Plex Sans via Google Fonts. Set in `_document` or layout
- **Mobile-first** — write CSS mobile-first, add `@media (min-width: ...)` for larger screens
- **Touch targets** — all buttons/links minimum 44x44px on mobile
- **Price display** — use monospace font (`IBM Plex Mono`) for prices, prefix with ₿, right-align in tables
- **Color semantics** — green = positive/approve, red = negative/alert, yellow = pending/warning, blue = info/AI

### API & Integration Rules

- **Channex adapter** — all OTA communication goes through `src/lib/channex/` adapter. Never call OTA APIs directly
- **Retry logic** — all external API calls (Channex, LINE, Telegram, Claude) must retry 3x with exponential backoff (1s, 2s, 4s)
- **Claude API prompts** — store prompt templates in `src/lib/ai/prompts/`. Include expert rules in system prompt. Response must be in Thai
- **LINE Flex Messages** — use Flex Message format for rich notifications. Templates in `src/lib/notifications/line/`
- **Telegram inline keyboards** — use inline keyboard buttons for quick actions. Templates in `src/lib/notifications/telegram/`
- **Webhook security** — validate Channex webhook signatures before processing
- **Rate limiting** — respect Channex API rate limits. Queue requests if needed
- **Credentials storage** — OTA credentials encrypted with separate key, stored in `ota_credentials` table, never in main hotel table

### Error Handling Patterns

- **Structured error responses** — all API errors return `{ error: string, code: string, details?: any }`
- **User-facing errors in Thai** — error messages shown to users must be in Thai
- **Log with context** — every error log must include: `hotelId`, `userId`, `action`, `error details`
- **Graceful degradation** — if Channex API is down, show last known data with "อัปเดตล่าสุด: {timestamp}" warning
- **Never expose internals** — never return stack traces, SQL errors, or API keys in responses

### Testing Rules

- **Test framework** — Jest + React Testing Library (comes with Next.js)
- **Test location** — `__tests__/` folder next to source files or `src/__tests__/` for integration tests
- **Test naming** — `{feature}.test.ts` for unit, `{feature}.integration.test.ts` for integration
- **Mock external APIs** — always mock Channex, LINE, Telegram, Claude APIs in tests. Never call real APIs
- **Test database** — use separate test database, never test against production/dev DB
- **Acceptance criteria = test cases** — each Given/When/Then from story AC maps to at least one test

### Code Quality & Style Rules

- **File naming** — kebab-case for files (`recommendation-card.tsx`), PascalCase for components (`RecommendationCard`)
- **Folder structure** — follow `apps/src/` structure from Architecture doc
- **No barrel exports** — import directly from file, not from `index.ts` barrel files (tree-shaking)
- **Max file length** — if a file exceeds ~300 lines, consider splitting
- **Comments** — only when logic is non-obvious. Never comment "what" (the code shows that), only "why"
- **No console.log** — use structured logger (`src/lib/logger.ts`) with levels: error, warn, info, debug

### Development Workflow Rules

- **Branch naming** — `feat/{epic}-{story}` (e.g., `feat/e1-s1-project-init`)
- **Commit messages** — imperative mood, concise: "Add user registration" not "Added user registration"
- **One story = one branch** — each story gets its own branch from `main`
- **Docker dev** — `docker-compose up` starts full local env (Next.js + PostgreSQL + Nginx)
- **Cron jobs** — Linux cron on Contabo for OTA sync (every 5 min) and AI recommendations
- **Deploy** — Docker Compose on Contabo VPS. Manual deploy for MVP: `git pull && docker-compose up -d --build`
- **Backup** — pg_dump cron daily, 30-day retention

### Critical Don't-Miss Rules

**Anti-Patterns:**
- ❌ Never return data without `hotelId` filter — TENANT ISOLATION is non-negotiable
- ❌ Never store OTA credentials in plain text — always encrypt
- ❌ Never auto-push prices to OTA in MVP-0 — read-only. User goes to OTA extranet manually
- ❌ Never send more than 2 notifications per day per user — alert fatigue kills adoption
- ❌ Never use English in UI — all user-facing text must be Thai
- ❌ Never create database tables for future stories — only create what the current story needs
- ❌ Never skip RBAC check on API routes — every route must verify role + hotel access

**Edge Cases:**
- OTA returns empty/null price → show "ไม่พบข้อมูล" with last known price and timestamp
- AI recommends price outside boundaries → clamp to boundary + note in reason "ปรับให้อยู่ในกรอบที่กำหนด"
- LINE/Telegram push fails → log error, show recommendation on web dashboard (fallback)
- Channex webhook duplicate → idempotent processing (check if already processed by event ID)
- User approves expired recommendation → show "คำแนะนำนี้หมดอายุแล้ว" and auto-mark expired

**Security:**
- JWT tokens in httpOnly cookies — never localStorage
- CSRF protection on all state-changing API routes
- Input validation on all API routes — use Zod schemas
- SQL injection prevention — Prisma parameterized queries only, never raw SQL interpolation
- XSS prevention — React auto-escapes, but validate any `dangerouslySetInnerHTML` usage (should be near-zero)
