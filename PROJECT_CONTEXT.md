# Validation Council - Project Context & Documentation

> **Last Updated:** January 13, 2026
> **Domain:** startupverdict.com
> **Status:** Production deployment in progress

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Recent Changes](#recent-changes)
4. [Current Issues & Solutions](#current-issues--solutions)
5. [Environment Configuration](#environment-configuration)
6. [Clerk Authentication Setup](#clerk-authentication-setup)
7. [DNS Configuration](#dns-configuration)
8. [Key Code Files](#key-code-files)
9. [Agent System](#agent-system)
10. [Deployment](#deployment)

---

## Project Overview

**Validation Council** is an AI-powered startup validation platform that uses 12 specialized AI agents to analyze startup ideas and provide comprehensive validation reports.

### Key Features
- 12 specialized AI agents for different analysis domains
- Real-time validation with streaming results
- PDF and PPTX export capabilities
- Investor discovery and matching
- Subscription-based pricing (Free, Starter, Professional, Enterprise)

### Tech Stack
- **Frontend:** Next.js 14, React, TailwindCSS, Clerk Auth
- **Backend:** NestJS, Prisma ORM, PostgreSQL, Redis
- **AI:** Claude (Anthropic), OpenAI, Google Gemini
- **Hosting:** Vercel (web), Railway (API)
- **Domain:** startupverdict.com (GoDaddy DNS)

---

## Architecture

```
/validation
├── apps/
│   ├── api/                    # NestJS Backend API
│   │   ├── src/
│   │   │   ├── agents/         # 12 AI Agents
│   │   │   ├── auth/           # Clerk authentication
│   │   │   ├── pdf/            # PDF generation (PDFKit)
│   │   │   ├── pptx/           # PowerPoint generation
│   │   │   ├── validation/     # Core validation logic
│   │   │   └── common/         # Shared services (LLM, Prisma)
│   │   └── prisma/             # Database schema
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/                # App router pages
│       │   ├── page.tsx        # Landing page
│       │   ├── sign-in/        # Clerk sign-in
│       │   ├── sign-up/        # Clerk sign-up
│       │   ├── dashboard/      # User dashboard
│       │   ├── validate/       # Validation flow
│       │   ├── pricing/        # Pricing page
│       │   └── investor/       # Investor portal
│       └── components/         # React components
│
├── packages/                   # Shared packages
├── .env.example               # Environment template
└── turbo.json                 # Turborepo config
```

---

## Recent Changes

### Commit History (Latest First)

| Commit | Description |
|--------|-------------|
| `7b4b0ad` | **feat:** Redesign landing page for better conversion |
| `0cc3c17` | **docs:** Clarify Clerk production vs development keys |
| `d500406` | **fix:** Revert to PDFKit for PDF generation (pdfmake import failed) |
| `5ce0ca8` | **feat:** Improve PDF exports with pdfmake (reverted) |
| `77b1807` | **fix:** Use functional role names instead of internal agent names |
| `24f634a` | **fix:** Rewrite PDF and PPTX exports with proper layouts |

### Key Changes Made

1. **PDF Service Rewrite** (`apps/api/src/pdf/pdf.service.ts`)
   - Reverted from pdfmake to PDFKit due to production import error
   - Error was: `pdfmake_1.default is not a constructor`
   - PDFKit works reliably with CommonJS compilation

2. **Landing Page Redesign** (`apps/web/app/page.tsx`)
   - New hero section with gradient animations
   - Social proof stats and trust badges
   - Problem/Solution comparison
   - 12 Agents showcase with icons
   - Testimonials section
   - Dedicated investor section
   - Strong CTAs with hover effects

3. **Functional Agent Names**
   - Changed from internal names (Marcus, Sophia) to functional roles
   - Example: "Marcus" → "Market Analysis"

---

## Current Issues & Solutions

### Issue 1: Google OAuth "Missing client_id" Error

**Error:** `Access blocked: Authorization Error - Missing required parameter: client_id`

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials for Web application
3. Add authorized origins: `https://startupverdict.com`
4. Add redirect URI: `https://clerk.startupverdict.com/v1/oauth_callback`
5. In Clerk Dashboard → Production → Social connections → Google:
   - Enable "Use custom credentials"
   - Paste Client ID and Client Secret

### Issue 2: API 401 Unauthorized Error

**Error:** `API Error 401: {"message":"Failed to fetch user details","error":"Unauthorized"}`

**Cause:** Backend API has incorrect/missing Clerk secret key

**Solution:** Update Railway environment variables:
```
CLERK_SECRET_KEY=sk_live_your-production-secret-key
```

Get from: Clerk Dashboard → Production → Developers → API keys

### Issue 3: SSL Certificate Error (Resolved)

**Error:** `net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**Cause:** DNS records added but SSL not yet provisioned

**Solution:** Wait 15-60 minutes after DNS verification for Clerk to provision SSL certificates

---

## Environment Configuration

### Web App (Vercel) - `apps/web/.env`

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://api.startupverdict.com

# Clerk Authentication - PRODUCTION KEYS
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### API (Railway) - `apps/api/.env`

```env
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://startupverdict.com
API_URL=https://api.startupverdict.com
CORS_ORIGIN=https://startupverdict.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Redis
REDIS_URL=redis://:password@host:port

# AI Providers
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx
GOOGLE_AI_API_KEY=xxxxx

# Clerk - MUST MATCH WEB APP
CLERK_SECRET_KEY=sk_live_xxxxx

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Key Points
- **CRITICAL:** Both web and API must use the SAME Clerk keys
- Production keys start with `pk_live_` and `sk_live_`
- Development keys start with `pk_test_` and `sk_test_`

---

## Clerk Authentication Setup

### Production Instance Configuration

#### 1. DNS Records (GoDaddy)

| Type | Name | Target | Status |
|------|------|--------|--------|
| CNAME | `clerk` | `frontend-api.clerk.services` | Verified |
| CNAME | `accounts` | `accounts.clerk.services` | Verified |
| CNAME | `clkmail` | `mail.clerk.services` | Pending |
| TXT | Various | Verification strings | Pending |

#### 2. Authentication Methods

Enable in Clerk Dashboard → Configure → User & authentication:

- **Email, Phone, Username:**
  - Email address: ON
  - Verification: Email verification code

- **Social connections:**
  - Google: ON (requires custom OAuth credentials for production)

#### 3. Google OAuth Setup

1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth client ID (Web application)
3. Authorized JavaScript origins:
   - `https://startupverdict.com`
4. Authorized redirect URIs:
   - `https://clerk.startupverdict.com/v1/oauth_callback`
5. Copy Client ID & Secret to Clerk Dashboard

---

## DNS Configuration

### Domain: startupverdict.com (GoDaddy)

| Type | Name | Target | Purpose |
|------|------|--------|---------|
| CNAME | `www` | `aefd523cd27da39b.vercel-dns-017.com` | Vercel Web App |
| CNAME | `api` | `zbpkt3vc.up.railway.app` | Railway API |
| CNAME | `clerk` | `frontend-api.clerk.services` | Clerk Frontend |
| CNAME | `accounts` | `accounts.clerk.services` | Clerk Accounts |

---

## Key Code Files

### Authentication

**`apps/api/src/auth/auth.service.ts`**
- Verifies Clerk JWT tokens
- Creates/retrieves users from database
- Handles API key authentication

```typescript
// Key method for token verification
async verifyToken(token: string): Promise<{ userId: string; sessionId: string }>

// Get or create user from Clerk ID
async getOrCreateUser(clerkUserId: string): Promise<User>
```

### PDF Generation

**`apps/api/src/pdf/pdf.service.ts`**
- Uses PDFKit (not pdfmake - import issues)
- Generates professional multi-page reports
- Uses functional agent names (not internal names)

```typescript
const AGENT_INFO: Record<string, { name: string; role: string }> = {
  aria: { name: 'AI Orchestration', role: 'Coordination & Synthesis' },
  marcus: { name: 'Market Analysis', role: 'TAM/SAM/SOM Study' },
  sophia: { name: 'Competitor Analysis', role: 'Competitive Landscape' },
  david: { name: 'Financial Analysis', role: 'Unit Economics' },
  elena: { name: 'Customer Analysis', role: 'Product-Market Fit' },
  james: { name: 'Team Assessment', role: 'Founder Evaluation' },
  rachel: { name: 'Legal & Risk', role: 'Regulatory Analysis' },
  omar: { name: 'Technical Analysis', role: 'Tech Feasibility' },
  nora: { name: 'Funding Analysis', role: 'Investment Landscape' },
  victor: { name: 'Valuation', role: 'Company Valuation' },
  victoria: { name: 'Final Synthesis', role: 'Recommendations' },
  sentinel: { name: 'Trust & Audit', role: 'Data Verification' },
};
```

### Landing Page

**`apps/web/app/page.tsx`**
- Premium design with animations
- Sections: Hero, Trust badges, Problem/Solution, How It Works, Agents, Testimonials, Investors, CTA
- Responsive design

---

## Agent System

The platform uses 12 specialized AI agents:

| Agent ID | Display Name | Role | Focus Area |
|----------|--------------|------|------------|
| aria | AI Orchestration | Coordination & Synthesis | Overall orchestration |
| marcus | Market Analysis | TAM/SAM/SOM Study | Market sizing |
| sophia | Competitor Analysis | Competitive Landscape | Competition |
| david | Financial Analysis | Unit Economics | Financials |
| elena | Customer Analysis | Product-Market Fit | Customer validation |
| james | Team Assessment | Founder Evaluation | Team analysis |
| rachel | Legal & Risk | Regulatory Analysis | Legal/compliance |
| omar | Technical Analysis | Tech Feasibility | Technology |
| nora | Funding Analysis | Investment Landscape | Funding strategy |
| victor | Valuation | Company Valuation | Valuation |
| victoria | Final Synthesis | Recommendations | Final recommendations |
| sentinel | Trust & Audit | Data Verification | Verification |

---

## Deployment

### Vercel (Web App)
- Repository connected
- Auto-deploys on push to main
- Environment variables configured

### Railway (API)
- Repository connected
- Uses Dockerfile for deployment
- PostgreSQL and Redis provisioned

### Build Command
```bash
npm run build
```

### Environment Sync Checklist
- [ ] Vercel has production Clerk keys
- [ ] Railway has production Clerk keys (SAME as Vercel)
- [ ] Railway has database URL
- [ ] Railway has Redis URL
- [ ] Railway has AI API keys
- [ ] DNS records verified in Clerk (5/5)
- [ ] Google OAuth configured for production domain

---

## Troubleshooting

### "pdfmake is not a constructor"
- **Cause:** pdfmake has ESM/CommonJS import issues
- **Solution:** Use PDFKit instead (already implemented)

### Clerk sign-in form empty
- **Cause:** No authentication methods enabled in production instance
- **Solution:** Enable email/Google in Clerk Dashboard → User & authentication

### SSL_VERSION_OR_CIPHER_MISMATCH
- **Cause:** SSL certificate not yet provisioned
- **Solution:** Wait 15-60 minutes after DNS verification

### API 401 Unauthorized
- **Cause:** Mismatched Clerk keys between web and API
- **Solution:** Ensure both use same `sk_live_` secret key

---

## Contact & Resources

- **Clerk Dashboard:** https://dashboard.clerk.com
- **Vercel Dashboard:** https://vercel.com
- **Railway Dashboard:** https://railway.app
- **GoDaddy DNS:** https://dcc.godaddy.com
- **Google Cloud Console:** https://console.cloud.google.com
