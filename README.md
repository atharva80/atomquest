# AtomQuest — Goal Setting & Tracking Portal

Built for AtomQuest Hackathon 1.0. A multi-role goal management system for employees, managers, and admins.

**Live:** [atomquest.vercel.app](https://atomquest.vercel.app) &nbsp;|&nbsp; **Stack:** Next.js 14 · Supabase · TypeScript · Tailwind

---

## What it does

- **Employees** set quarterly goals (max 8, must total 100% weightage), submit for approval, and log check-ins each quarter
- **Managers** approve/return goal sheets, review team check-ins, and leave ratings
- **Admins** manage users, cycles, escalations, exports, and security settings

## Roles & Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | dwight@dundermifflin.com | password123 |
| Manager | michael@dundermifflin.com | password123 |
| Admin | stanley@dundermifflin.com | password123 |

Or use the **Quick Login** buttons on the login page.

---

## Local Setup

**Prerequisites:** Node 18+, a Supabase project

```bash
git clone https://github.com/atharva80/atomquest
cd atomquest
npm install
cp .env.local.example .env.local
# fill in your env vars (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=AtomQuest <onboarding@resend.dev>
# Route all emails to one address (useful for demos)
EMAIL_DEV_OVERRIDE=you@gmail.com

# Cron auth
CRON_SECRET=

# AI features (optional)
GEMINI_API_KEY=
```

## Database

Run the migrations in order:

```bash
supabase db push
# or manually run:
# supabase/migrations/00001_initial_schema.sql
# supabase/migrations/00002_app_config.sql
```

---

## Key Features

- **Goal workflow** — draft → submitted → approved/returned → locked
- **Quarterly check-ins** — enforced windows (July, October, January, March)
- **Email notifications** — goal submitted, approved, returned, check-in reminders, escalation alerts (via Resend)
- **Escalation engine** — cron job flags overdue approvals and check-ins
- **AI summaries** — Gemini-powered goal sheet insights (falls back gracefully if unavailable)
- **Azure AD SSO** — configurable from the admin security panel
- **Audit trail** — every action logged, visible to admins
- **Data export** — goals, check-ins, audit logs as CSV

## Check-in Schedule

| Period | Window Opens |
|--------|-------------|
| Q1 | July |
| Q2 | October |
| Q3 | January |
| Q4 / Annual | March / April |

---

## Project Structure

```
src/
  app/
    (auth)/login          # Login page
    (dashboard)/
      employee/           # Employee views
      manager/            # Manager views
      admin/              # Admin views
    api/                  # API routes (auth, cron, admin, ai)
  actions/                # Next.js server actions
  components/             # Shared UI components
  emails/                 # React Email templates + send helpers
  queries/                # Supabase query helpers
  schemas/                # Zod validation schemas
supabase/migrations/      # DB migrations
```

---

## Cron Jobs

Configured in `vercel.json`, runs automatically on Vercel:

- `/api/cron/escalation` — daily at 9am, flags overdue actions
- `/api/cron/checkin-reminders` — 1st of each month, reminds employees with open check-in windows
