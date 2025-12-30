# Alpha Deployment & User Management Guide

## 🚀 Deployment Status
The application is **Alpha Ready**. 
- Core Workflows (Provider Schedule, Member Booking) are verified in **Live Mode**.
- Database connections are stable.

## 👥 Adding New Beta Testers
Currently, the application uses a **Hardcoded Token Map** for security/masking. To add a new user (e.g., a Beta Tester), you must follow this 3-step process:

### Step 1: Update Application Code (`src/pages/LoginPage.tsx`)
Add a new entry to the `tokenMap` object:
```typescript
const tokenMap: Record<string, string> = {
  // ... existing users
  'BETA-USER-01': 'beta.user.01@example.com',
};
```
*Re-deploy the application after this change.*

### Step 2: Create User in Supabase
1. Go to **Supabase Dashboard** > **Authentication** > **Users**.
2. Click **Add User**.
3. Email: `beta.user.01@example.com`
4. Password: `SecurePass2025!` (or custom)
5. **Check "Auto Confirm User"**.
6. Click **Create**.

### Step 3: Link Profile (SQL)
Run the following SQL in Supabase SQL Editor to assign their Role:
```sql
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'BETA-USER-01', 'member', 'ALL', 'active'
FROM auth.users WHERE email = 'beta.user.01@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'BETA-USER-01', role = 'member';
```

## 📋 Known "Golden Path" Workflows
- **DOC-MH**: Provider / Mental Health / Green Team
- **PATIENT-01**: Member (Can book appointments)
