# RateGenie — AI Revenue Assistant

## Project Context

- **Product:** AI-powered revenue management platform สำหรับโรงแรมอิสระในไทย
- **Stack:** Next.js 16 + TypeScript + React-Bootstrap + Prisma 7 + PostgreSQL
- **OTA Integration:** Channex White Label API ($130/เดือน)
- **AI:** Claude API (Anthropic) + Expert Rules
- **Deploy:** Docker Compose (PostgreSQL + Next.js + Nginx) on Contabo VPS
- **Project root:** `apps/` directory
- **Team:** Pond (solo dev) + Claude (AI pair programmer)

## สถานะ

- **MVP-0:** done (5 epics, 21 stories)
- **MVP-1:** done (4 epics, 15 stories)
- **รวม:** 9 Epics, 36 Stories ทั้งหมด done

## User

- ชื่อ: Pond
- สื่อสารเป็นภาษาไทย
- Skill level: intermediate
- จุดแข็ง: คิดจากมุมผู้ใช้จริง, เน้น practical feasibility, มี business sense ดี
- มีโรงแรม pilot พร้อมทดสอบ

## Feedback / Rules

- ทุก output ต้องเป็นภาษาไทย รวมถึงชื่อไอเดีย ชื่อธีม หัวข้อ
- UI ภาษาไทยทั้งหมด

## Demo Mode

- Login: `demo@rategenie.co` / `password123`
- Docker: `docker-compose up` (PostgreSQL on port 5432)
- Seed: `DATABASE_URL="postgresql://rategenie:changeme@localhost:5432/rategenie" npx tsx prisma/seed.ts`
- ระบบทำงานได้โดยไม่มี API key (Channex, Anthropic, LINE, Telegram) — mock/skip gracefully

## Key Documents

- PRD: `docs/planning-artifacts/prd.md`
- Architecture: `docs/planning-artifacts/architecture.md`
- Epics: `docs/planning-artifacts/epics.md` (MVP-0 + MVP-1)
- Sprint Status: `docs/implementation/sprint-status.yaml`
- API Contract: `docs/planning-artifacts/api-contract.md`
- UX Spec: `docs/planning-artifacts/ux-design-specification.md`
- Market Research: `docs/planning-artifacts/research/market-ai-ota-price-management-thailand-research-2026-03-12.md`

## Future Ideas

### Chrome Extension สำหรับดึงราคาคู่แข่ง
- ดึงราคาจาก Google Hotels / Agoda / Booking.com ผ่าน browser ของผู้ใช้
- ไม่ต้องจ่าย data provider, ไม่โดน block, ราคาแม่นยำ
- Scope: manifest.json + content script + popup + DOM parser + API endpoint
- Status: เก็บไว้เป็นไอเดีย (2026-03-17)
