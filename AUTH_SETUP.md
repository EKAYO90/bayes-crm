# Bayes CRM Auth Setup (Supabase + Legacy JWT)

This guide sets up the new authentication system while keeping legacy JWT sessions operational.

## 1) Configure environment variables

1. Copy template:
   ```bash
   cp .env.example .env
   ```
2. Fill in these required values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`

## 2) Install dependencies

```bash
npm install
```

## 3) Run Prisma migration

```bash
npx prisma migrate dev --name add_profiles_auth
npx prisma generate
```

## 4) Apply Supabase SQL (RLS + policy hardening)

Run the SQL in `supabase/profiles_rls.sql` in the Supabase SQL editor.

## 5) Bootstrap admin (Evans)

Option A (preferred in Supabase SQL editor):
- Create Evans in Supabase Auth (or invite Evans using `/settings/users`).
- Set profile `role='admin'`, `approval_status='approved'`, `is_active=true`.

Option B (app flow):
- Signup Evans at `/signup`
- Login with Evans after email confirmation
- Approve Evans with temporary DB SQL update if no admin exists yet

## 6) Test flows

- Signup: `/signup`
- Email confirmation callback: `/auth/callback`
- Approval waiting: `/pending-approval`
- Login: `/login`
- Forgot/reset password: `/forgot-password` + `/reset-password`
- Admin user management: `/settings/users`

## 7) Legacy compatibility

- Legacy JWT login remains at `/api/auth/login`.
- Existing `User` records remain intact.
- New Supabase accounts map to `profiles` and then link to `User` via `legacyUserId`.
