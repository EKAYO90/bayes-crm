# Bayes CRM Deployment Guide (Vercel + Supabase)

This guide walks you through deploying **Bayes CRM** to production using:
- **Frontend + API runtime:** Vercel (Next.js)
- **Database:** Supabase Postgres
- **ORM / migrations:** Prisma

It is written for beginners, with copy-paste commands and practical checks.

---

## Deployment architecture overview

```text
User Browser
   |
   v
Vercel (Next.js app + API routes)
   |
   | DATABASE_URL (PostgreSQL)
   v
Supabase Postgres
```

### What this means in practice
1. Your app code lives in GitHub (`EKAYO90/bayes-crm`).
2. Vercel pulls from GitHub and builds/deploys automatically.
3. Vercel API routes connect to Supabase Postgres using `DATABASE_URL`.
4. Prisma creates/updates DB tables via migrations.
5. Seed script inserts starter data.

---

## Prerequisites checklist

Before starting, confirm:
- [ ] GitHub account with access to `EKAYO90/bayes-crm`
- [ ] Supabase account: https://supabase.com/
- [ ] Vercel account: https://vercel.com/
- [ ] Node.js 20+ installed locally (`node -v`)
- [ ] npm available (`npm -v`)

> Tip: Using the same GitHub account for both Supabase/Vercel sign-in makes integration easier.

---

## Step 1: Set up Supabase (PostgreSQL)

### 1.1 Create Supabase account and project
1. Go to https://supabase.com/
2. Click **Start your project**.
3. Create a new organization (if needed).
4. Create a new project:
   - **Project name:** `bayes-crm-prod` (or your preferred name)
   - **Database password:** generate and save securely (password manager)
   - **Region:** choose closest to your users
5. Wait until project status is **Healthy**.

### 1.2 Get the PostgreSQL connection string
1. In Supabase project dashboard, open **Project Settings** → **Database**.
2. Find **Connection string** section.
3. Select **URI** format.
4. Copy the connection string.

It usually looks like:

```bash
postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

### 1.3 Prepare Prisma-compatible connection string
If Supabase provides multiple options (pooler/direct), start with the **direct** DB URL above.
If your environment requires pooling later, you can switch to pooler URL.

---

## Step 2: Configure required environment variables

Create the following environment variables in **Vercel Project Settings → Environment Variables**.

### Required variables

#### `DATABASE_URL`
Your Supabase Postgres URI:

```bash
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
```

#### `JWT_SECRET`
Used for auth token signing. Must be long and random.

Generate one:

```bash
openssl rand -base64 48
```

Example:

```bash
JWT_SECRET="replace_with_generated_secret"
```

#### `NEXTAUTH_URL`
Set to your production app URL (no trailing slash).

```bash
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
```

> If you add a custom domain later, update this to the custom domain.

#### `CRON_SECRET`
Required for securing Vercel Cron requests to `/api/conversations/notifications/run`.

```bash
CRON_SECRET="replace_with_generated_secret"
```

### Recommended optional variables

#### `NODE_ENV`
```bash
NODE_ENV="production"
```

#### `PORT`
Usually not required on Vercel; Vercel manages port automatically.

---

## Step 3: Deploy on Vercel (connect GitHub repo)

### 3.1 Import project from GitHub
1. Go to https://vercel.com/new
2. Click **Import Git Repository**.
3. Select `EKAYO90/bayes-crm`.
4. If prompted, authorize Vercel GitHub App for this repo.

### 3.2 Configure project build settings
Vercel usually auto-detects Next.js.

Use/confirm:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Output Directory:** `.next` (default for Next.js)

### 3.3 Add environment variables in Vercel
Before first production deployment, add all required env vars:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `NODE_ENV=production` (recommended)

Apply for environments:
- Production
- Preview (optional but recommended)

### 3.4 Trigger deployment
Click **Deploy**.

After deployment:
- Open the assigned Vercel URL
- Confirm homepage loads

---

## Step 4: Run database migration and seed data

You must apply Prisma migrations to Supabase and then seed initial data.

### 4.1 Clone and install locally (if not already)

```bash
git clone https://github.com/EKAYO90/bayes-crm.git
cd bayes-crm
npm install
```

### 4.2 Create local `.env` for migration execution

```bash
cp .env.example .env 2>/dev/null || true
```

Edit `.env` and set at least:

```env
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="replace_with_generated_secret"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
```

### 4.3 Run migration

```bash
npx prisma migrate deploy
```

Expected result: Prisma applies SQL in `prisma/migrations/*` to production DB.

### 4.4 Generate Prisma client

```bash
npx prisma generate
```

### 4.5 Seed initial data

```bash
npx ts-node prisma/seed.ts
```

You should see:

```text
✅ Seed complete
```

### 4.6 (Optional) Verify data quickly

```bash
npx prisma studio

## Step 4.7 Supabase Auth post-migration setup

After database migration is applied:

1. Run SQL policies from `supabase/profiles_rls.sql` in Supabase SQL editor.
2. Ensure at least one admin profile exists (Evans bootstrap).
3. Verify invite flow from `/settings/users` sends Supabase invite emails.
4. Confirm auth callback URL in Supabase Auth settings includes:
   - `https://<your-domain>/auth/callback`

```

Open Prisma Studio and confirm tables have records (users, organizations, opportunities, activities).

---

## Step 5: Test the deployed application

After deploy + migration + seed, run this checklist:

### 5.1 Basic smoke tests
- [ ] App URL opens without 500 errors
- [ ] Login page loads
- [ ] Login works
- [ ] Dashboard displays stats/cards
- [ ] Pipeline/Kanban pages load all stages

### 5.2 Functional tests
- [ ] Create a new organization
- [ ] Create a new opportunity
- [ ] Move opportunity across stages
- [ ] For `Contract Signed` and `Lost`, verify required win/loss fields are enforced
- [ ] Reports page loads (Pipeline / Activity / Relationship)
- [ ] Team activity report renders human-readable activity types

### 5.3 API/DB tests
- [ ] No Prisma connection errors in Vercel logs
- [ ] Records persist after page refresh
- [ ] Theme preference persists after refresh/login

### 5.4 Performance and reliability checks
- [ ] First load time acceptable
- [ ] No unhandled runtime errors in browser console
- [ ] Vercel function logs are healthy

---

## Troubleshooting

### 1) `Error: P1001` / Cannot reach database server
**Cause:** Invalid `DATABASE_URL`, wrong host/port/password, DB paused, or network issue.

**Fixes:**
1. Re-copy Supabase DB URI.
2. Confirm password is correct.
3. Confirm `sslmode=require` is present.
4. Re-run:
   ```bash
   npx prisma migrate deploy
   ```

---

### 2) `PrismaClientInitializationError`
**Cause:** Environment variable missing at runtime.

**Fixes:**
1. In Vercel, verify `DATABASE_URL` exists in Production env.
2. Redeploy after saving env vars.
3. Check logs in Vercel → Project → Deployments → Functions logs.

---

### 3) Build fails on Vercel
**Common causes:**
- Dependency mismatch
- TypeScript compile errors
- Missing env vars used during build

**Fixes:**
1. Reproduce locally:
   ```bash
   npm install
   npm run build
   ```
2. Fix compile/type errors.
3. Push commit and redeploy.

---

### 4) Auth/login issues (`invalid token`, session problems)
**Cause:** `JWT_SECRET` mismatch between environments or malformed value.

**Fixes:**
1. Set one strong stable `JWT_SECRET`.
2. Avoid changing it after users already have active sessions.
3. Clear browser cookies and login again.

---

### 5) Redirect/callback URL problems
**Cause:** Incorrect `NEXTAUTH_URL`.

**Fixes:**
1. Ensure exact production URL (no trailing slash).
2. Update env var in Vercel.
3. Redeploy.

---

### 6) Seed script fails
**Cause:** Missing packages, DB permission issue, or schema not migrated.

**Fixes:**
1. Run migration first:
   ```bash
   npx prisma migrate deploy
   ```
2. Then run:
   ```bash
   npx ts-node prisma/seed.ts
   ```
3. Check stack trace line and verify `prisma/seed.ts` assumptions.

---

## Useful links

- GitHub repo: https://github.com/EKAYO90/bayes-crm
- Supabase dashboard: https://supabase.com/dashboard
- Vercel dashboard: https://vercel.com/dashboard
- Prisma deploy docs: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
- Next.js deployment docs: https://nextjs.org/docs/deployment

---

## Suggested post-deployment hardening

1. Add monitoring/alerts (Vercel + Supabase).
2. Set up daily DB backups and restore test.
3. Add uptime checks on critical routes.
4. Configure custom production domain.
5. Add CI checks (lint/test/build) before merge to main.

---

## Quick command summary

```bash
# Local setup
git clone https://github.com/EKAYO90/bayes-crm.git
cd bayes-crm
npm install

# DB deploy + seed
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma/seed.ts

# Local run
npm run dev
```

If you follow this sequence exactly, Bayes CRM should be fully deployed and usable in production.