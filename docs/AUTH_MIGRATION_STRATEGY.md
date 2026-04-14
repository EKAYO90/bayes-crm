# Authentication Migration Strategy (User + Profiles)

## Current state
- Existing auth: JWT cookie based on `User` table.
- New auth: Supabase Auth + `Profile` table (approval workflow).

## Strategy
1. Keep `User` table unchanged for all domain relations.
2. Introduce `Profile` as auth identity + approval state.
3. On Supabase auth success:
   - Resolve `Profile` by `authUserId`.
   - Block access if `approvalStatus != approved`.
   - Ensure/create linked `User` (`legacyUserId`).
   - Issue legacy JWT cookie so existing APIs continue working.

## Approval workflow
- Signup creates `Profile` with `approvalStatus='pending'`.
- Admin approves/rejects from `/settings/users`.
- Reject keeps account disabled (no auth access to app routes).

## Invite workflow
- Admin invites user through Supabase invite email.
- Invite flow auto-creates/updates `Profile` and marks approved.

## Existing users compatibility
- Existing seeded `User` rows are still valid for legacy login.
- Once linked to a `Profile`, roles/tier/department are synced from profile edits.

## Evans bootstrap path
- Create Evans in Supabase Auth.
- Insert/update profile with:
  - `role='admin'`
  - `approvalStatus='approved'`
  - `isActive=true`
- Ensure `legacyUserId` points to Evans row in `User` table.
