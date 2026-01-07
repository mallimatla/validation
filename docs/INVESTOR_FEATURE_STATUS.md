# Investor Feature Development Status

**Last Updated:** 2026-01-07
**Branch:** `claude/restore-validation-session-gWiCt`

## Overview

This document tracks the development status of the Investor/Founder dual experience feature for the Validation Council platform.

---

## Feature Summary

The investor feature allows:
- **Investors** to browse validated startup ideas, save deals, express interest, and request meetings
- **Founders** to make their validations public, track investor engagement, and respond to meeting requests

---

## User Role System (NEW)

### Role Types
- **FOUNDER** - Creates validations, wants to raise funding
- **INVESTOR** - Browses deals, invests in startups
- **ADMIN** - Platform administration

### Feature Access by Role

| Feature | Founder | Investor |
|---------|---------|----------|
| Create validations | ✅ | ❌ |
| Browse deals | ❌ | ✅ |
| Save deals | ❌ | ✅ (Premium) |
| Express interest | ❌ | ✅ (Premium) |
| Request meetings | ❌ | ✅ (Premium) |
| See who's interested | ✅ | ❌ |
| Respond to meetings | ✅ | ❌ |

### Pricing Tiers

**For Founders:**
- **Free**: 1 validation per month, private only
- **Starter ($49/mo)**: 5 validations, public listing, investor notifications
- **Professional ($149/mo)**: Unlimited validations, priority listing, analytics

**For Investors:**
- **Free**: Browse 10 deals/month, view only
- **Premium ($99/mo)**: Unlimited browsing, save, interest, meetings
- **Enterprise ($499/mo)**: API access, custom alerts, dedicated support

### Onboarding Flow
1. User signs up via Clerk
2. Redirected to `/onboarding` page
3. Selects role (Founder or Investor)
4. Completes role-specific profile
5. Redirected to appropriate dashboard

---

## Current Status: PARTIALLY IMPLEMENTED

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Investor Dashboard UI | ✅ Working | `/investor` page with full UI |
| Deal Browsing API | ✅ Working | Returns completed validations |
| Top Deals API | ✅ Working | Returns high-scoring validations |
| Deal Details API | ✅ Working | Returns validation details |
| Founder Dashboard | ✅ Working | Shows engagement stats (mock data) |
| Validation Form | ✅ Working | Multi-step wizard form |
| Core Validation API | ✅ Working | Create/read validations |
| Onboarding Flow | ✅ Working | Role selection with profile setup |
| Pricing Page | ✅ Working | Founder and Investor tiers |
| Role-based Navigation | ✅ Working | Different menus per role |
| User Profile API | ✅ Working | `/users/me`, `/users/onboarding` |

### What's Pending (Requires Database Migration)

| Feature | Status | Blocker |
|---------|--------|---------|
| Save Deals | ⏸️ Placeholder | `InvestorSave` table missing |
| Express Interest | ⏸️ Placeholder | `InvestorInterest` table missing |
| Meeting Requests | ⏸️ Placeholder | `MeetingRequest` table missing |
| View Tracking | ⏸️ Placeholder | `InvestorView` table missing |
| Make Validation Public | ⏸️ Placeholder | `isPublic` column missing |
| Engagement Counts | ⏸️ Placeholder | `viewCount`, `saveCount`, `interestCount` columns missing |

---

## Architecture

### Files Created/Modified

#### API (NestJS Backend)

```
apps/api/src/investor/
├── investor.module.ts      # Module definition
├── investor.controller.ts  # REST API endpoints
├── investor.service.ts     # Business logic (placeholder mode)
└── investor.dto.ts         # Data transfer objects
```

**Key Endpoints:**
- `GET /api/v1/investor/deals` - Browse public deals
- `GET /api/v1/investor/deals/top` - Get top rated deals
- `GET /api/v1/investor/deals/:id` - Get deal details
- `POST /api/v1/investor/deals/:id/save` - Save a deal (placeholder)
- `DELETE /api/v1/investor/deals/:id/save` - Unsave a deal (placeholder)
- `GET /api/v1/investor/saved` - Get saved deals (returns empty)
- `POST /api/v1/investor/deals/:id/interest` - Express interest (placeholder)
- `GET /api/v1/investor/interests` - Get interested deals (returns empty)
- `POST /api/v1/investor/deals/:id/meeting` - Request meeting (placeholder)
- `GET /api/v1/investor/meetings` - Get meetings (returns empty)
- `POST /api/v1/investor/founder/deals/:id/public` - Make validation public (placeholder)
- `GET /api/v1/investor/founder/stats` - Get engagement stats (returns zeros)

#### API - User Management

```
apps/api/src/users/
├── users.module.ts      # Module with controller registration
├── users.controller.ts  # REST API endpoints
├── users.service.ts     # User profile and onboarding logic
└── users.dto.ts         # DTOs for user operations
```

**User Endpoints:**
- `GET /api/v1/users/me` - Get current user profile
- `POST /api/v1/users/onboarding` - Complete onboarding with role
- `PUT /api/v1/users/me` - Update user info
- `PUT /api/v1/users/me/profile` - Update founder/investor profile
- `POST /api/v1/users/me/switch-type` - Switch user type
- `GET /api/v1/users/me/usage` - Get subscription usage/limits

#### Frontend (Next.js)

```
apps/web/app/
├── investor/
│   └── page.tsx           # Investor dashboard with deal browsing
├── dashboard/
│   └── page.tsx           # Founder dashboard with engagement stats
├── onboarding/
│   └── page.tsx           # Role selection and profile setup
├── pricing/
│   └── page.tsx           # Pricing tiers for founders and investors
└── validate/
    └── page.tsx           # Multi-step validation wizard form

apps/web/components/
└── Navigation.tsx         # Shared nav with role-based menus

apps/web/contexts/
└── UserContext.tsx        # User state and role management
```

---

## Database Schema Changes Needed

### New Columns for `Validation` Model

```prisma
// Add to Validation model in schema.prisma
isPublic        Boolean       @default(false)
pitchDeckUrl    String?
contactEmail    String?
allowMeetings   Boolean       @default(true)
allowMessages   Boolean       @default(true)
founderLinkedIn String?
viewCount       Int           @default(0)
saveCount       Int           @default(0)
interestCount   Int           @default(0)

// Add index
@@index([isPublic, status, overallScore])
```

### New Models

```prisma
model InvestorSave {
  id              String      @id @default(cuid())
  investorId      String
  validationId    String
  validation      Validation  @relation(fields: [validationId], references: [id], onDelete: Cascade)
  notes           String?
  tags            String[]
  folder          String?
  savedAt         DateTime    @default(now())

  @@unique([investorId, validationId])
  @@index([investorId])
  @@index([validationId])
}

model InvestorInterest {
  id              String       @id @default(cuid())
  investorId      String
  validationId    String
  validation      Validation   @relation(fields: [validationId], references: [id], onDelete: Cascade)
  type            InterestType
  message         String?
  checkSize       String?
  createdAt       DateTime     @default(now())

  @@unique([investorId, validationId])
  @@index([investorId])
  @@index([validationId])
}

enum InterestType {
  INTERESTED
  VERY_INTERESTED
  PASSED
  WATCHING
}

model InvestorView {
  id              String      @id @default(cuid())
  investorId      String?
  validationId    String
  validation      Validation  @relation(fields: [validationId], references: [id], onDelete: Cascade)
  source          String?
  duration        Int?
  viewedAt        DateTime    @default(now())

  @@index([investorId])
  @@index([validationId])
  @@index([viewedAt])
}

model MeetingRequest {
  id              String        @id @default(cuid())
  investorId      String
  validationId    String
  validation      Validation    @relation(fields: [validationId], references: [id], onDelete: Cascade)
  type            MeetingType
  message         String
  preferredTimes  String[]
  calendlyLink    String?
  status          MeetingStatus @default(PENDING)
  founderResponse String?
  scheduledAt     DateTime?
  meetingLink     String?
  createdAt       DateTime      @default(now())
  respondedAt     DateTime?

  @@unique([investorId, validationId])
  @@index([investorId])
  @@index([validationId])
  @@index([status])
}

enum MeetingType {
  INTRO_CALL
  DEEP_DIVE
  DEMO
  PITCH
}

enum MeetingStatus {
  PENDING
  ACCEPTED
  DECLINED
  SCHEDULED
  COMPLETED
  CANCELLED
}
```

---

## How to Complete the Feature

### Step 1: Generate Migration

```bash
cd apps/api
npx prisma migrate dev --name add_investor_features
```

### Step 2: Apply Migration to Production

```bash
npx prisma migrate deploy
```

### Step 3: Update Investor Service

Replace the placeholder service (`apps/api/src/investor/investor.service.ts`) with the full implementation that uses actual Prisma queries. The full implementation was created but reverted - see git history for commit `77ebbba`.

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

---

## Git History

| Commit | Description |
|--------|-------------|
| `0fea9d0` | Add user role system with founder/investor separation |
| `69b1d7e` | Add investor feature status documentation |
| `eae29c7` | Remove investor schema columns to fix 500 errors |
| `77ebbba` | Make investor service resilient to missing database tables |
| `cb2ff6d` | Fix Set iteration for TypeScript compatibility |
| `0d58521` | Add investor API endpoints and connect frontend |
| `1cef9e6` | Update founder dashboard with investor engagement |
| `3619535` | Add investor dashboard and engagement features |
| `da8f0dc` | Redesign validation form with dynamic wizard |

---

## Known Issues & Fixes Applied

### Issue 1: Score Scale Mismatch (Fixed)
- **Problem:** Investor-grade agents returned 1-10 scores, fallback agents used 60-95
- **Fix:** Disabled duplicate `storeAgentReport()` in base agent, validation service transforms all scores

### Issue 2: Form Stuck on "Submitting..." (Fixed)
- **Problem:** Synchronous agent processing blocked API response
- **Fix:** Made processing async with `processValidationAsync()` - returns immediately

### Issue 3: 500 Internal Server Error (Fixed)
- **Problem:** Prisma schema had columns/tables that didn't exist in production DB
- **Fix:** Removed investor columns from schema, service returns placeholder data

---

## Future Enhancements

1. **Notifications** - Alert founders when investors express interest
2. **Email Integration** - Send meeting request notifications
3. **Analytics Dashboard** - Detailed engagement analytics for founders
4. **Investor Profiles** - Rich investor profiles with portfolio info
5. **Deal Room** - Secure document sharing between founders and investors

---

## Contact

For questions about this feature, check the git history or refer to the original session context.
