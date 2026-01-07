# Validation Council - API Keys Setup Guide

This guide explains how to obtain all the API keys required for the Validation Council platform to provide trustworthy, accountable analysis.

## Priority Configuration

For the best analysis accuracy, configure multiple AI providers. The platform uses a **multi-LLM consensus mechanism** that queries multiple AI models and synthesizes their responses for higher accuracy.

**Provider Priority:**
1. **Claude (Anthropic)** - Primary (best for nuanced reasoning)
2. **OpenAI** - Secondary (strong general-purpose)
3. **Gemini (Google)** - Tertiary (additional perspective)

---

## Required API Keys

### 1. LLM Providers (At least one required, multiple recommended)

#### Anthropic Claude (PRIMARY - Recommended)
- **URL:** https://console.anthropic.com/
- **Steps:**
  1. Create an Anthropic account
  2. Navigate to API Keys
  3. Click "Create Key"
  4. Copy the key (starts with `sk-ant-`)
- **Pricing:** ~$3 per 1M input tokens, ~$15 per 1M output tokens (Claude 3.5 Sonnet)
- **Environment Variable:** `ANTHROPIC_API_KEY`

#### OpenAI (SECONDARY)
- **URL:** https://platform.openai.com/api-keys
- **Steps:**
  1. Create an OpenAI account
  2. Go to API Keys section
  3. Click "Create new secret key"
  4. Copy the key (starts with `sk-proj-`)
- **Pricing:** ~$2.50 per 1M input tokens, ~$10 per 1M output tokens (GPT-4o)
- **Environment Variable:** `OPENAI_API_KEY`

#### Google Gemini (TERTIARY)
- **URL:** https://aistudio.google.com/apikey
- **Steps:**
  1. Sign in with Google account
  2. Click "Create API Key"
  3. Select or create a Google Cloud project
  4. Copy the generated key
- **Pricing:** Free tier available (60 requests/minute), paid starts at $0.075/1M tokens
- **Environment Variable:** `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`

---

### 2. Web Search APIs (Required for Real Market Data)

The Marcus agent uses web search to fetch real market data and create verifiable citations.

#### Serper (RECOMMENDED)
- **URL:** https://serper.dev
- **Steps:**
  1. Sign up for Serper account
  2. Navigate to Dashboard > API Key
  3. Copy your API key
- **Pricing:** $50/month for 50,000 queries (best value)
- **Environment Variable:** `SERPER_API_KEY`

#### Brave Search API (Alternative)
- **URL:** https://brave.com/search/api/
- **Steps:**
  1. Create a Brave account
  2. Subscribe to API access
  3. Generate API key from dashboard
- **Pricing:** Free tier: 2,000 queries/month, Paid: $5/1,000 queries
- **Environment Variable:** `BRAVE_API_KEY`

#### News API (Supplementary)
- **URL:** https://newsapi.org
- **Steps:**
  1. Register for an account
  2. Copy API key from dashboard
- **Pricing:** Free: 100 requests/day, Paid: $449/month
- **Environment Variable:** `NEWS_API_KEY`

---

### 3. Authentication (Clerk)

#### Clerk
- **URL:** https://clerk.com
- **Steps:**
  1. Create a Clerk account and application
  2. Go to API Keys in dashboard
  3. Copy both the Publishable Key and Secret Key
  4. For webhooks, go to Webhooks > Create endpoint
- **Pricing:** Free tier: 10,000 MAU, Pro: $25/month
- **Environment Variables:**
  - `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)
  - `CLERK_WEBHOOK_SECRET` (starts with `whsec_`)

---

### 4. Payment Gateway (Razorpay)

#### Razorpay
- **URL:** https://dashboard.razorpay.com
- **Steps:**
  1. Create Razorpay account (KYC required for production)
  2. Go to Settings > API Keys
  3. Generate Test/Live Key ID and Secret
  4. For webhooks, go to Settings > Webhooks
- **Pricing:** 2% transaction fee (India)
- **Environment Variables:**
  - `RAZORPAY_KEY_ID` (starts with `rzp_test_` or `rzp_live_`)
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`

---

### 5. Database & Cache

#### PostgreSQL
- **Local Development:** Use Docker Compose (included)
- **Production Options:**
  - **Supabase:** https://supabase.com (free tier available)
  - **Railway:** https://railway.app (~$5/month)
  - **Neon:** https://neon.tech (generous free tier)
- **Environment Variable:** `DATABASE_URL`

#### Redis (Optional - for job queue)
- **Production Options:**
  - **Upstash:** https://upstash.com (free tier: 10k commands/day)
  - **Railway:** https://railway.app
  - **Redis Cloud:** https://redis.com/cloud/
- **Environment Variables:** `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`

---

### 6. Optional Integrations

#### Crunchbase API (Enhanced Competitor Data)
- **URL:** https://www.crunchbase.com/partners/crunchbase-enterprise
- **Note:** Enterprise access required, contact sales
- **Environment Variable:** `CRUNCHBASE_API_KEY`

#### Proxycurl (LinkedIn Data)
- **URL:** https://nubela.co/proxycurl
- **Pricing:** $10/100 credits
- **Environment Variable:** `PROXYCURL_API_KEY`

#### SendGrid (Email Notifications)
- **URL:** https://sendgrid.com
- **Pricing:** Free: 100 emails/day
- **Environment Variable:** `SENDGRID_API_KEY`

#### Sentry (Error Tracking)
- **URL:** https://sentry.io
- **Pricing:** Free tier available
- **Environment Variable:** `SENTRY_DSN`

---

## Quick Start Configuration

For minimum viable setup, configure these three keys:

```env
# Minimum required
ANTHROPIC_API_KEY=sk-ant-your-key-here
SERPER_API_KEY=your-serper-key
CLERK_SECRET_KEY=sk_test_your-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/validation
```

For production with maximum accuracy (multi-LLM consensus):

```env
# LLM Providers (all three for consensus)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENAI_API_KEY=sk-proj-your-openai-key
GOOGLE_AI_API_KEY=your-gemini-key

# Market Data
SERPER_API_KEY=your-serper-key
NEWS_API_KEY=your-newsapi-key

# Auth & Payments
CLERK_SECRET_KEY=sk_live_your-key
RAZORPAY_KEY_ID=rzp_live_your-key
RAZORPAY_KEY_SECRET=your-secret

# Database & Cache
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## Estimated Monthly Costs

| Component | Free Tier | Production |
|-----------|-----------|------------|
| Claude API | - | ~$50-200 |
| OpenAI API | $5 credit | ~$30-100 |
| Gemini API | 60 req/min | ~$20-50 |
| Serper | - | $50 |
| Clerk | 10k MAU | $25+ |
| PostgreSQL | Available | ~$10-25 |
| Redis | 10k/day | ~$5-10 |
| **Total** | **~$5** | **~$150-400** |

---

## Security Best Practices

1. **Never commit API keys** to version control
2. Use `.env.local` for development
3. Use environment variables in production (Vercel, Railway, etc.)
4. Rotate keys periodically
5. Set up billing alerts on all API providers
6. Use test keys for development, live keys for production

---

## Testing Your Configuration

After setting up keys, test each provider:

```bash
# Run the API in development mode
cd apps/api
npm run start:dev

# Check logs for:
# ✓ CLAUDE configured (priority 1)
# ✓ OPENAI configured (priority 2)
# ✓ GEMINI configured (priority 3)
# Primary LLM: CLAUDE
# Multi-LLM consensus available with 3 providers
```

If you see warnings about missing keys, the respective provider will be skipped.
