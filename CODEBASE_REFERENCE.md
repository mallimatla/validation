# Validation Council - Complete Codebase Reference

## Project Overview

**Validation Council** is an AI-powered startup validation platform that uses a council of 12 specialized AI agents to analyze and validate startup ideas. The platform serves two user types: **Founders** and **Investors**.

### Core Value Proposition
- Founders submit startup ideas for comprehensive AI analysis
- 12 specialized AI agents evaluate different aspects (market, competition, team, financials, etc.)
- Investors can discover validated startups matching their investment thesis
- Both user types have paid subscription tiers

---

## Tech Stack

### Backend (NestJS)
- **Framework**: NestJS v10
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ for background job processing
- **Authentication**: Clerk (JWT tokens)
- **API Documentation**: Swagger/OpenAPI
- **Payments**: Razorpay integration

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts library
- **Authentication**: Clerk React SDK
- **State**: React hooks (useState, useEffect, useCallback)

### Infrastructure
- **Monorepo**: Turborepo
- **Deployment**: Railway (API), Vercel (Web)
- **Database**: Railway PostgreSQL

---

## Project Structure

```
/home/user/validation/
├── apps/
│   ├── api/                    # NestJS Backend API
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── src/
│   │       ├── auth/           # Authentication (Clerk)
│   │       ├── common/         # Shared services (Prisma, etc.)
│   │       ├── investor/       # Investor module
│   │       ├── validation/     # Core validation module
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── web/                    # Next.js Frontend
│       ├── app/
│       │   ├── dashboard/      # Founder dashboard
│       │   ├── investor/       # Investor portal
│       │   ├── onboarding/     # User type selection
│       │   ├── pricing/        # Subscription plans
│       │   ├── validate/       # Validation form & results
│       │   └── page.tsx        # Landing page
│       └── components/
│           └── charts/         # Recharts visualization components
├── packages/
│   ├── agent-core/             # AI agent logic
│   └── shared/                 # Shared types and utilities
└── package.json                # Root package.json (Turborepo)
```

---

## Database Schema (Prisma)

### Core Models

#### User
```prisma
model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  avatarUrl     String?
  company       String?
  linkedInUrl   String?
  userType      UserType     @default(FOUNDER)  // FOUNDER, INVESTOR, ADMIN
  isVerified    Boolean      @default(false)
  credits       Int          @default(0)
  settings      Json         @default("{}")

  validations     Validation[]
  subscriptions   Subscription[]
  founderProfile  FounderProfile?
  investorProfile InvestorProfile?
}
```

#### Validation
```prisma
model Validation {
  id              String            @id @default(cuid())
  userId          String?
  title           String
  description     String
  industry        String?
  stage           String            @default("idea")
  status          ValidationStatus  // PENDING, QUEUED, PROCESSING, COMPLETE, FAILED

  overallScore        Float?        // 0-100
  overallConfidence   Float?        // 0-100
  verdict             String?       // PROCEED, PIVOT, RECONSIDER, STOP
  executiveSummary    String?

  agentReports    AgentReport[]
  // ... other relations
}
```

#### AgentReport
```prisma
model AgentReport {
  id              String      @id @default(cuid())
  validationId    String
  agentId         String      // marcus, sophia, david, etc.
  score           Float       // 1-10 (normalized)
  confidence      Float       // 0-100
  findings        Json        // Array of findings
  risks           Json        // Array of risks
  recommendations Json        // Array of recommendations
}
```

#### InvestorProfile
```prisma
model InvestorProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  firmName        String?
  firmType        String    @default("angel")
  checkSizeMin    Int       @default(0)
  checkSizeMax    Int       @default(0)
  stages          String[]  // Pre-Seed, Seed, Series A, etc.
  industries      String[]  // AI/ML, SaaS, Fintech, etc.
  geography       String[]
  thesis          String?

  introRequests   InvestorIntroRequest[]
  shortlist       InvestorShortlist[]
}
```

#### InvestorShortlist
```prisma
model InvestorShortlist {
  id                String      @id @default(cuid())
  investorProfileId String
  validationId      String
  notes             String?
  addedAt           DateTime    @default(now())

  @@unique([investorProfileId, validationId])
}
```

#### InvestorIntroRequest
```prisma
model InvestorIntroRequest {
  id                String      @id @default(cuid())
  validationId      String
  investorProfileId String
  status            String      @default("pending")  // pending, accepted, declined
  message           String?
  requestedAt       DateTime    @default(now())
  respondedAt       DateTime?
}
```

---

## API Endpoints

### Base Configuration
- **Global Prefix**: `/api`
- **Versioning**: URI-based, default `v1`
- **Full Base Path**: `${API_URL}/api/v1/`

### Validation Endpoints (`/api/v1/validations`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | List user's validations | Required |
| POST | `/` | Create new validation | Optional |
| GET | `/:id` | Get validation details | Required |
| GET | `/:id/progress` | Get validation progress | Required |
| GET | `/:id/report` | Get full report | Required |

### Investor Endpoints (`/api/v1/investor`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/profile` | Get investor profile | Required |
| GET | `/discover` | Discover startups | Required |
| GET | `/shortlist` | Get shortlisted startups | Required |
| POST | `/shortlist/:id` | Add to shortlist | Required |
| DELETE | `/shortlist/:id` | Remove from shortlist | Required |
| GET | `/intros` | Get intro requests | Required |
| POST | `/intros/:id` | Request intro to founder | Required |

### Query Parameters for `/discover`
- `stages`: Comma-separated (e.g., "Seed,Series A")
- `industries`: Comma-separated (e.g., "AI/ML,SaaS")
- `minScore`: Minimum validation score
- `sortBy`: `matchScore`, `score`, or `createdAt`

---

## Frontend Pages

### `/dashboard` - Founder Dashboard
**File**: `apps/web/app/dashboard/page.tsx`

Features:
- Stats cards (Total Validations, In Progress, Avg Score, High Scores)
- Latest validation with ScoreGauge
- Agent RadarChart showing all 12 agent scores
- Risk list and recommendations
- Recent validations list

### `/validate` - Create Validation
**File**: `apps/web/app/validate/page.tsx`

Features:
- Multi-step form for startup details
- Title, description, problem, solution fields
- Industry and stage selection
- Target customer and business model

### `/validate/[id]` - Validation Results
**File**: `apps/web/app/validate/[id]/page.tsx`

Features:
- Tab-based navigation (Overview, Agents, Risks, Recommendations)
- ScoreGauge for overall score
- AgentRadarChart and HorizontalAgentChart
- FindingsBreakdown and RiskSeverityChart (donut charts)
- RiskHeatmap (probability vs impact matrix)
- ProgressRing for each agent
- PDF download capability

### `/investor` - Investor Portal
**File**: `apps/web/app/investor/page.tsx`

Features:
- Three tabs: Discover, Shortlist, Contacted
- Startup cards with match score
- Filter by stage, industry, score
- Shortlist toggle (star icon)
- Startup detail modal
- Intro request modal with custom message

### `/pricing` - Subscription Plans
**File**: `apps/web/app/pricing/page.tsx`

Founder Plans:
- Free: 1 validation/month
- Starter ($39): 5 validations/month
- Professional ($129): Unlimited
- Enterprise ($649): Custom

Investor Plans:
- Free: Browse only
- Scout ($99): 10 intro requests
- Partner ($299): 50 intro requests
- Fund ($999): Unlimited

### `/onboarding` - User Type Selection
**File**: `apps/web/app/onboarding/page.tsx`

Features:
- Choose Founder or Investor
- Profile setup forms for each type

---

## Chart Components

**Location**: `apps/web/components/charts/`

### ScoreGauge.tsx
- Semi-circle gauge for overall score
- Animated fill based on score
- Verdict badge (PROCEED, PIVOT, etc.)
- `ScoreBadge` component for inline use

### AgentRadarChart.tsx
- Radar chart showing all 12 agents
- Score and confidence on axes
- `AgentRadarMini` for compact view

### RiskHeatmap.tsx
- 4x4 probability vs impact matrix
- Color-coded cells (green to red)
- Interactive click to view details
- `RiskList` for compact list view

### DonutChart.tsx
- Generic donut chart with hover
- `FindingsBreakdown` preset (strengths/weaknesses/neutral)
- `RiskSeverityChart` preset (critical/major/moderate/minor)

### BarCharts.tsx
- `HorizontalAgentChart` - Ranked horizontal bars
- `VerticalBarChart` - Vertical comparison
- `GroupedBarChart` - Multi-metric comparison

### MetricCards.tsx
- `MetricCard` - Animated counting card
- `ProgressRing` - Circular progress indicator
- `ProgressBar` - Linear progress bar
- `ComparisonCard` - Multi-metric comparison

### TrendChart.tsx
- Area/line charts for trends
- `Sparkline` component for inline mini-charts

---

## The 12 AI Agents

| ID | Name | Role | Icon |
|----|------|------|------|
| marcus | Marcus | Market Intelligence | 📊 |
| sophia | Sophia | Innovation & Disruption | 💡 |
| david | David | Competitive Strategy | 🏆 |
| elena | Elena | Customer & PMF | 🎯 |
| james | James | Team & Talent | 👥 |
| rachel | Rachel | Financial Viability | 💰 |
| omar | Omar | Technical Assessment | ⚙️ |
| nora | Nora | GTM Strategy | 📢 |
| victor | Victor | Valuation Expert | 💵 |
| victoria | Victoria | Contrarian Analysis | 🔮 |
| sentinel | Sentinel | Risk & Kill Signals | 🛡️ |
| aria | ARIA | AI Orchestrator | 🤖 |

---

## Environment Variables

### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CORS_ORIGIN=https://your-frontend.com
PORT=4000
NODE_ENV=production
OPENAI_API_KEY=sk-...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Key Implementation Details

### Authentication Flow
1. User signs in via Clerk (frontend)
2. Frontend gets JWT token via `getToken()`
3. Token sent in `Authorization: Bearer ${token}` header
4. Backend `AuthGuard` verifies token with Clerk
5. `AuthService.getOrCreateUser()` creates/retrieves user from DB
6. User object attached to `req.user`

### Agent Score Normalization
Scores are normalized to 1-10 range:
```typescript
const normalizedScore = Math.min(10, Math.max(1, Math.round(rawScore * 10) / 10));
```

Fix applied for floating point issues (e.g., `0.6000000000000001`):
```typescript
score: Math.round(r.score * 100) / 100
```

### Risk Type Transformation
For RiskHeatmap component, risks need proper union types:
```typescript
const allRisks = rawRisks.map(risk => ({
  ...risk,
  probability: (['low', 'medium', 'high'].includes(risk.probability?.toLowerCase())
    ? risk.probability.toLowerCase()
    : 'medium') as 'low' | 'medium' | 'high',
  impact: (['minor', 'moderate', 'major', 'critical'].includes(risk.impact?.toLowerCase())
    ? risk.impact.toLowerCase()
    : 'moderate') as 'minor' | 'moderate' | 'major' | 'critical',
}));
```

### Dynamic Imports for Charts
To avoid SSR issues with Recharts:
```typescript
const ScoreGauge = dynamic(
  () => import('../components/charts/ScoreGauge').then(m => m.ScoreGauge),
  { ssr: false }
);
```

---

## Common Issues & Fixes

### Issue: Recharts Tooltip Formatter Type Error
**Error**: Type mismatch with formatter function parameters
**Fix**: Remove explicit type annotations
```typescript
// Before (error)
formatter={(value: number, name: string) => [...]}

// After (fixed)
formatter={(value, name) => [...]}
```

### Issue: Prisma Field Name Mismatch
**Error**: `createdAt` doesn't exist on InvestorIntroRequest
**Fix**: Use correct field name `requestedAt`

### Issue: Empty Validations on Dashboard
**Possible Causes**:
1. API path incorrect (should be `/api/v1/validations`)
2. User ID mismatch between Clerk and database
3. CORS issues
4. Authentication token issues

**Debugging**: Check browser console for:
- Response status code
- Network errors
- CORS errors

### Issue: Investor Page API Paths
**Fix**: Ensure all paths include `/api/v1/` prefix:
```typescript
// Correct
fetch(`${API_URL}/api/v1/investor/discover`)

// Wrong
fetch(`${API_URL}/investor/discover`)
```

---

## Database Migrations

Run Prisma migrations:
```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
npx prisma generate
```

Reset database (development only):
```bash
npx prisma migrate reset
```

---

## Build & Deploy

### Local Development
```bash
# Install dependencies
npm install

# Run all services
npm run dev

# Or run individually
cd apps/api && npm run start:dev
cd apps/web && npm run dev
```

### Production Build
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

---

## Git Workflow

**Branch Naming**: `claude/feature-name-sessionId`

**Commit Message Format**:
```
feat: Add feature description
fix: Fix bug description
refactor: Refactor description
```

---

## API Response Formats

### Validation List Response
```json
{
  "data": [
    {
      "id": "cuid",
      "title": "Startup Name",
      "description": "...",
      "status": "COMPLETE",
      "overallScore": 72.5,
      "overallConfidence": 85,
      "verdict": "PROCEED",
      "agentReports": [...]
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### Investor Discover Response
```json
{
  "data": [
    {
      "id": "validationId",
      "title": "Startup Name",
      "description": "...",
      "industry": "AI/ML",
      "stage": "Seed",
      "score": 75,
      "confidence": 80,
      "verdict": "PROCEED",
      "matchScore": 85,
      "isShortlisted": false,
      "founderName": "John Doe",
      "highlights": ["Strong market", "Great team"]
    }
  ],
  "pagination": {...}
}
```

---

## Future Enhancements (Planned)

1. **Email Notifications**: Notify founders of intro requests
2. **Analytics Dashboard**: Historical trends and insights
3. **Team Collaboration**: Multi-user validation reviews
4. **API Access**: Public API for integrations
5. **White-label**: Custom branding options
6. **Mobile App**: React Native companion app

---

## Contact & Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: This file serves as the primary reference

---

*Last Updated: January 2026*
*Version: 1.0.0*
