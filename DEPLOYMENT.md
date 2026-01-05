# Validation Council - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
   - [Railway (Recommended)](#railway-recommended)
   - [Docker Compose (Self-hosted)](#docker-compose-self-hosted)
   - [Vercel + Railway](#vercel--railway)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

### Required Accounts & API Keys
- [ ] **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- [ ] **Razorpay Account** - Sign up at [Razorpay](https://dashboard.razorpay.com)
- [ ] **Clerk Account** - Sign up at [Clerk](https://clerk.com)
- [ ] **PostgreSQL Database** (Railway provides this, or use any provider)
- [ ] **Redis Instance** (Railway provides this, or use Upstash)

### Optional (Recommended for Production)
- [ ] Crunchbase API Key - For company data
- [ ] Proxycurl API Key - For LinkedIn data
- [ ] News API Key - For market intelligence
- [ ] AWS S3 bucket - For evidence snapshots
- [ ] Sentry account - For error tracking

---

## Environment Setup

### Step 1: Copy Environment Template

```bash
cp .env.example .env
```

### Step 2: Configure Required Variables

Edit `.env` and fill in your values:

```bash
# REQUIRED - OpenAI (Get your key from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# REQUIRED - Database (Railway will provide or set your own)
DATABASE_URL=postgresql://user:password@host:5432/database

# REQUIRED - Redis
REDIS_URL=redis://host:6379

# REQUIRED - Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# REQUIRED - Clerk Auth
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Step 3: Generate Secure Secrets

```bash
# Generate AGENT_SIGNING_SECRET
openssl rand -hex 32

# Generate JWT_SECRET (if needed)
openssl rand -hex 32
```

---

## Database Setup

### Option A: Railway PostgreSQL (Easiest)

1. Go to [Railway](https://railway.app)
2. Create new project
3. Add PostgreSQL from the marketplace
4. Copy the connection string to `DATABASE_URL`

### Option B: Supabase

1. Create project at [Supabase](https://supabase.com)
2. Go to Settings > Database > Connection String
3. Copy URI (use "Pooling" for serverless)

### Option C: Self-hosted PostgreSQL

```bash
# Using Docker
docker run -d \
  --name validation-postgres \
  -e POSTGRES_USER=validation \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=validation_council \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### Run Migrations

After database is ready:

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) View database
npx prisma studio
```

---

## Deployment Options

### Railway (Recommended)

Railway provides the simplest deployment with automatic PostgreSQL and Redis.

#### Step-by-Step Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create Project**
   ```bash
   railway init
   # Select "Empty Project"
   ```

3. **Add PostgreSQL**
   - In Railway dashboard, click "New"
   - Select "Database" > "PostgreSQL"
   - Copy connection URL

4. **Add Redis**
   - Click "New" > "Database" > "Redis"
   - Copy Redis URL

5. **Deploy API**
   ```bash
   # From project root
   railway up
   ```

6. **Set Environment Variables**
   In Railway dashboard, add all variables from `.env.example`:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=(from PostgreSQL service)
   REDIS_URL=(from Redis service)
   OPENAI_API_KEY=your_key
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   CLERK_SECRET_KEY=your_key
   AGENT_SIGNING_SECRET=your_generated_secret
   ```

7. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

8. **Generate Domain**
   - In Railway dashboard, go to your service
   - Settings > Generate Domain
   - Or add custom domain

#### Railway One-Click Template (Coming Soon)

```
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/validation-council)
```

---

### Docker Compose (Self-hosted)

For self-hosted deployments on VPS or cloud VMs.

#### Step 1: Prepare Server

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git

# Add user to docker group
sudo usermod -aG docker $USER
```

#### Step 2: Clone and Configure

```bash
git clone https://github.com/your-org/validation-council.git
cd validation-council

# Copy and edit environment file
cp .env.example .env
nano .env
```

#### Step 3: Deploy

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose run --rm migrate
```

#### Step 4: Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/validation-council
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/validation-council /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
sudo systemctl reload nginx
```

---

### Vercel + Railway

Deploy frontend on Vercel, backend on Railway.

#### Backend (Railway)
Follow the Railway steps above for the API.

#### Frontend (Vercel)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your Git repository
   - Select `apps/web` as root directory

2. **Configure Build**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_xxx
   ```

4. **Deploy**
   - Click Deploy
   - Set custom domain if desired

---

## Post-Deployment

### 1. Verify Health

```bash
# Check API health
curl https://your-api-url.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

### 2. Create Razorpay Plans

In Razorpay Dashboard:
1. Go to Products > Subscriptions
2. Create Plans:
   - **Starter**: ₹2,999/month
   - **Professional**: ₹9,999/month
   - **Enterprise**: ₹49,999/month
3. Copy Plan IDs to environment variables

### 3. Configure Razorpay Webhooks

1. Go to Settings > Webhooks
2. Add webhook URL: `https://your-api.com/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

### 4. Configure Clerk Webhooks

1. In Clerk Dashboard, go to Webhooks
2. Add endpoint: `https://your-api.com/auth/webhook`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### 5. Test the System

```bash
# Create test user in Clerk
# Perform a test validation
# Check database for records
# Verify agent reports are generated
```

---

## Monitoring & Maintenance

### Logs

```bash
# Railway
railway logs

# Docker Compose
docker-compose logs -f api
```

### Database Backups

```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# For Railway, use Railway's backup feature
```

### Updates

```bash
# Pull latest code
git pull origin main

# Railway auto-deploys on push
# For Docker:
docker-compose pull
docker-compose up -d
docker-compose run --rm migrate
```

---

## Troubleshooting

### Common Issues

#### Database Connection Errors
```
Error: Can't reach database server
```
**Solution**: Check `DATABASE_URL` format and network connectivity.

#### Redis Connection Errors
```
Error: ECONNREFUSED Redis
```
**Solution**: Ensure Redis is running and `REDIS_URL` is correct.

#### OpenAI API Errors
```
Error: 401 Unauthorized
```
**Solution**: Verify `OPENAI_API_KEY` is valid and has credits.

#### Prisma Migration Errors
```
Error: Migration failed
```
**Solution**:
```bash
# Reset and remigrate (WARNING: deletes data)
npx prisma migrate reset
npx prisma migrate deploy
```

#### Payment Webhook Failures
**Solution**: Check webhook URL is publicly accessible and secrets match.

### Getting Help

- Check logs: `railway logs` or `docker-compose logs`
- Review environment variables
- Test API endpoints manually
- Check external service status (OpenAI, Razorpay, Clerk)

---

## Security Checklist

Before going to production:

- [ ] Use strong, unique passwords for all secrets
- [ ] Enable SSL/TLS on all endpoints
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Enable Sentry error tracking
- [ ] Review CORS settings
- [ ] Test payment flow end-to-end
- [ ] Verify webhook security

---

## Support

For issues:
1. Check this guide
2. Review logs
3. Search existing issues
4. Create new issue with:
   - Environment (Railway/Docker/etc)
   - Error messages
   - Steps to reproduce

---

*Last updated: January 2025*
