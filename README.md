# 125 London Wall — Facade Works PM

Project management app for rope access facade works (cladding, windows, mastic, granite) across a multi-owner building. Next.js + Supabase (auth, Postgres, row-level security), deploys to Vercel.

## What you get

- Real login (email + password via Supabase Auth). Nothing loads without a session, and the database itself refuses unauthenticated reads — this is enforced server-side, not just hidden in the UI.
- Roles: **admin** (everything, incl. user management), **manager** (edit statuses, tasks, inventory, to-dos), **viewer** (read-only, ideal for floor owners' agents).
- Interactive 3D building: drag to rotate, tap a floor, filter by trade, per-trade completion stats. Status changes persist for everyone.
- Tasks, inventory with low-stock alerts, shared to-do list.
- Admin API route (server-side, service role key) for adding/removing users and changing roles.

## Setup (~15 minutes)

### 1. Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine). Pick the London region.
2. Once created, open **SQL Editor**, paste the entire contents of `supabase/schema.sql`, and run it. This creates all tables, security policies, the signup trigger, and seed data for 18 floors.

### 2. Create your admin account
1. In Supabase go to **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password, tick **Auto Confirm User**, and create.
3. The trigger auto-creates a profile with the `viewer` role, so promote yourself: open **SQL Editor** and run:
   ```sql
   update public.profiles set role = 'admin', name = 'Yoel' where id = (
     select id from auth.users where email = 'you@example.com'
   );
   ```
   (Replace the email and name.) Every user after this one you create from inside the app's Team tab.

### 3. Get your keys
In Supabase: **Project Settings → API**. You need:
- Project URL
- `anon` public key
- `service_role` key (secret — server only)

### 4. Run locally (optional)
```bash
cp .env.local.example .env.local   # paste your keys in
npm install
npm run dev                        # http://localhost:3000
```

### 5. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **Add New Project** → import the repo (framework auto-detects Next.js).
3. Add the three environment variables from `.env.local.example` under **Settings → Environment Variables**.
4. Deploy. Done — share the URL with the team.

## Security notes
- Row-level security means even someone with the public anon key can't read project data without a valid login, and viewers physically can't write.
- The `service_role` key must only ever live in Vercel env vars / `.env.local` — never in client code. The admin user API verifies the caller is an admin before doing anything with it.
- There's no public sign-up: accounts are only created by an admin from the Team tab.
- Data is backed up by Supabase automatically on paid tiers; on free tier, consider an occasional CSV export of key tables.

## Adapting it
- Floor count / owners: edit the seed section of `supabase/schema.sql` (or just update rows in the `floors` table).
- Trades: `TRADES` in `lib/ui.js` plus the `check` constraints in the schema.
- Building shape: `components/Building3D.jsx` (podium width, setbacks, roof).
# 125londonwallpm
