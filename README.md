# DealBreakr AI

**Cross-examine any listing before you trust it.**

DealBreakr AI is an AI-powered real estate due diligence tool built for IrvineHacks 2026. It extracts every claim from a property listing, cross-references against public records and market data, identifies contradictions and unknowns, and generates a buyer war room with questions, documents to request, and inspection priorities.

![Stack](https://img.shields.io/badge/Next.js_14-black?style=flat&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat&logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![Claude](https://img.shields.io/badge/Claude_AI-D4A574?style=flat)

---

## Features

- **Claim Extraction** — Every listing claim is identified, categorized, and tagged with a verdict (verified, unverified, contradiction, marketing)
- **Evidence Cross-Check** — Claims are compared against property records, comparable sales, permits, and public data
- **Trust Score** — 0–100 composite score across 6 risk categories
- **Risk Radar** — Visual breakdown of risk by category with Recharts
- **Buyer War Room** — Actionable checklist of questions to ask, documents to request, and inspection priorities
- **Trackable Progress** — Check off completed due diligence items

## Scoring Categories

| Category | What It Checks |
|---|---|
| Record Mismatch | Listing claims vs. tax/county records (sqft, beds, baths) |
| Pricing Anomaly | Price vs. comparable sales and market norms |
| Ownership/Title | Ownership transfers, deed types, lien indicators |
| Disclosure Ambiguity | Missing disclosures, as-is language, vague statements |
| Neighborhood Fit | Location claims vs. actual surroundings |
| Renovation/Permits | Improvement claims vs. building permit records |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### 1. Clone and install

```bash
git clone https://github.com/your-username/IrvineHacks2026.git
cd dealbreakr-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- **Without an API key**: The app uses realistic mock data (perfect for demos!)
- **With an API key**: Get one at https://console.anthropic.com and add it

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL="file:./dev.db"
```

### 3. Set up database

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

This creates the SQLite database and seeds it with 2 example properties.

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Try it out

- Click one of the example property cards on the landing page
- Or enter any address and (optionally) paste listing text
- Explore the results dashboard and buyer war room

---

## Project Structure

```
dealbreakr-ai/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts        # POST: run analysis
│   │   └── properties/[id]/route.ts # GET: fetch results
│   ├── (main)/
│   │   ├── layout.tsx               # Shared nav for results pages
│   │   ├── results/[id]/page.tsx    # Results dashboard
│   │   └── warroom/[id]/page.tsx    # Buyer war room
│   ├── globals.css                  # Design system & theme
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Landing page
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── tabs.tsx
│   └── dashboard/                   # App-specific components
│       ├── ActionItemCard.tsx
│       ├── AnalysisLoading.tsx
│       ├── CategoryBreakdownChart.tsx
│       ├── ClaimCard.tsx
│       ├── ComparablesTable.tsx
│       ├── PropertySnapshot.tsx
│       └── TrustScoreRing.tsx
├── lib/
│   ├── claude.ts                    # Claude API client + fallback
│   ├── mock-data.ts                 # 2 seeded example properties
│   ├── prisma.ts                    # Prisma client singleton
│   ├── prompts.ts                   # Claude prompt templates
│   └── utils.ts                     # Helpers, formatters, cn()
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Seed script
├── types/
│   └── index.ts                     # TypeScript interfaces + Zod schemas
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Prisma + SQLite |
| AI | Anthropic Claude API (Sonnet) |
| Charts | Recharts |
| Validation | Zod |

---

## API Routes

### `POST /api/analyze`

Analyze a property listing.

**Request body:**
```json
{
  "address": "42 Shadowridge, Irvine, CA 92618",
  "listingText": "Stunning 4BR/3BA home...",
  "listPrice": 1100000,
  "propertyType": "Single Family Residence"
}
```

**Response:**
```json
{
  "id": "clx...",
  "status": "complete"
}
```

### `GET /api/properties/[id]`

Fetch full analysis results including claims, evidence, and action items.

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "DealBreakr AI MVP"
git remote add origin https://github.com/your-team/dealbreakr-ai.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set environment variables:
   - `ANTHROPIC_API_KEY` = your Claude API key
   - `DATABASE_URL` = `"file:./dev.db"` (for SQLite) or a Postgres URL
4. Click Deploy

### 3. For production (recommended)

For production, swap SQLite for a hosted database:

1. Create a free Postgres database on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [PlanetScale](https://planetscale.com)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` in Vercel to your Postgres connection string
4. Run `npx prisma db push` against the production database

---

## Design Philosophy

- **Investigative aesthetic**: Dark theme with red accents, monospaced data displays, and a "war room" feel
- **Trust hierarchy**: Visual severity indicators guide attention to the most important issues
- **Non-accusatory language**: We never claim fraud — we flag contradictions and unknowns for the buyer to investigate
- **Progressive disclosure**: Summary → categories → individual claims → evidence details
- **Actionable output**: Every finding links to a concrete next step in the war room

---

## Disclaimer

DealBreakr AI is a research and educational tool. It is **not** a licensed inspection, appraisal, or legal service. All findings are based on AI analysis and should be verified with licensed professionals before making purchase decisions.

---

Built with caffeine and conviction at **IrvineHacks 2025** ☕
