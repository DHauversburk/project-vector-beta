# Project Vector - Deployment Guide

## Overview

Project Vector is a secure, anonymous scheduling PWA for military medical groups. This guide covers deployment options from development to production.

---

## Quick Start (Development/Demo)

The app runs in **Mock Mode** by default (no backend required):

```bash
cd project_vector
npm install
npm run dev
```

Then open http://localhost:5173 and login with:
- **Patient**: `PATIENT-01`
- **Provider**: `DOC-MH`  
- **Admin**: `COMMAND-01`

---

## Production Deployment with Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and Anon Key from Settings → API

### Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Apply Database Migrations

Run the following SQL scripts in your Supabase SQL Editor (in order):

1. `src/scripts/beta_baseline_audit.sql` - Creates core tables
2. `src/scripts/enforce_active_member_policy.sql` - Row-level security
3. `src/scripts/fix_appointments_schema.sql` - Schema fixes
4. `src/scripts/alter_appointments_supply_first.sql` - Supply-first model

### Step 4: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized assets.

### Step 5: Deploy Static Files

The `dist/` folder can be deployed to any static hosting:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Push `dist/` to gh-pages branch
- **AWS S3 + CloudFront**: Upload to S3 bucket

---

## Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes* | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes* | Your Supabase anonymous key |

*If not set, app runs in Mock Mode (offline demo)

---

## Security Considerations

### Zero PHI/PII Architecture
- No patient names stored anywhere
- Token-based authentication only
- All identifiers are anonymous tokens

### Row-Level Security
- Patients can only see their own appointments
- Providers can only see their own schedules
- Admins have full access

### Session Security
- 15-minute inactivity timeout
- 4-digit tactical PIN on login
- Optional biometric (WebAuthn) support

---

## PWA Features

The app is a Progressive Web App:
- **Installable**: Add to home screen on mobile/desktop
- **Offline**: Basic functionality works offline
- **Fast**: Service worker caches assets

---

## Troubleshooting

### "RUNNING IN MOCK MODE" Warning
This appears when Supabase keys are not configured. Either:
1. Set up `.env` with real keys, or
2. Continue in demo mode (data stored in localStorage)

### Build Errors
```bash
npm run lint  # Check for errors
npm run build  # Full TypeScript check
```

### Test Verification
```bash
npm run test  # Runs all 22 verification tests
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Member    │  │  Provider   │  │    Admin    │     │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └────────────────┼────────────────┘            │
│                          │                             │
│                  ┌───────┴───────┐                     │
│                  │   api.ts      │                     │
│                  │  (Dual Mode)  │                     │
│                  └───────┬───────┘                     │
│                          │                             │
│         ┌────────────────┼────────────────┐            │
│         │                │                │            │
│    Mock Mode        Supabase         localStorage      │
│   (In-Memory)        (Real)          (Persistence)     │
└─────────────────────────────────────────────────────────┘
```

---

## Support

For issues or questions, refer to:
- `AUDIT_REPORT.md` - Security compliance documentation
- `verification_report_final.md` - Feature verification status
- Test files in `src/*.test.ts` - Automated verification

---

*Last Updated: December 26, 2025*
