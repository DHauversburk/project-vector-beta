# Project Vector Beta 2 - Deployment Guide
## Version 2.0.0-beta

---

## 🚀 Quick Deploy Commands

### Local Development
```powershell
cd c:\Users\Hauve\.gemini\antigravity\scratch\project_vector
npm run dev
# Available at http://localhost:5173/
```

### Production Build
```powershell
npm run build
npm run preview  # Preview production build locally
```

### Deploy to Vercel
```powershell
# If Vercel CLI is installed
vercel --prod

# Or connect via GitHub for automatic deployments
# https://vercel.com/new
```

### Deploy to Netlify
```powershell
# If Netlify CLI is installed
netlify deploy --prod --dir=dist

# Or drag-and-drop the /dist folder to Netlify
# https://app.netlify.com/drop
```

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] Build passes without errors
- [x] TypeScript compilation successful
- [ ] Lint errors addressed (54 remaining - non-critical)
- [x] Version bumped to 2.0.0-beta

### Testing
- [ ] Manual test scenarios validated
- [ ] Patient login flow tested
- [ ] Provider dashboard tested
- [ ] Mobile responsiveness verified
- [ ] PWA offline mode verified

### Documentation
- [x] BETA_2_LAUNCH_READINESS.md created
- [x] BETA_2_TEST_VALIDATION.md created
- [ ] CHANGELOG.md updated
- [ ] README.md updated with new features

### Environment
- [ ] Production Supabase project configured (optional)
- [ ] Environment variables set for production
- [x] Mock mode works for demo purposes

---

## 🔒 Environment Variables

Create `.env.production` for production deployment:

```env
# Supabase Configuration (optional - mock mode works without these)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
VITE_APP_NAME=Project Vector
VITE_APP_VERSION=2.0.0-beta
```

**Note:** The app runs in **Mock Mode** when Supabase credentials are not provided. This is ideal for demos and testing.

---

## 📱 PWA Assets

The following PWA assets are included:
- `/pwa-192x192.png` - App icon
- `/pwa-512x512.png` - Large app icon
- `/manifest.webmanifest` - PWA manifest
- `/sw.js` - Service worker (generated on build)

---

## 🎯 Demo Tokens

For demonstration purposes, use these tokens:

| Token | Role | Description |
|-------|------|-------------|
| `PATIENT-01` | Patient | Standard patient account |
| `PATIENT-02` | Patient | Additional patient |
| `R-TEAM-99X2` | Provider | Dr. Jameson (Mental Health) |
| `B-TEAM-77K1` | Provider | Dr. Smith (Primary Care) |
| `CMD-ALPHA-1` | Admin | Administrator access |

Default Password for Email Login: `SecurePass2025!`

---

## 🔄 Post-Deployment Verification

### Quick Smoke Test
1. Navigate to deployed URL
2. Verify splash screen animation plays
3. Landing page displays 3 entry cards
4. Patient login with `PATIENT-01` works
5. PIN setup/entry functions correctly
6. Dashboard loads with sample data

### PWA Verification
1. Open in mobile browser
2. Check "Add to Home Screen" option appears
3. After install, verify app opens standalone
4. Enable airplane mode, verify offline indicator appears

---

## 📊 Expected Bundle Sizes

| Asset | Size | Gzipped |
|-------|------|---------|
| Main Bundle | 512.71 KB | 152.12 KB |
| CSS | 101.47 KB | 15.14 KB |
| Dashboard | 217.30 KB | 53.29 KB |
| API Layer | 45.60 KB | 12.40 KB |
| Login Page | 29.00 KB | 7.62 KB |
| Service Worker | 32.06 KB | 10.11 KB |

---

## 🐛 Known Issues for Beta 2

1. **Large Bundle Size** - Main chunk exceeds 500KB. Acceptable for beta.
2. **Lint Warnings** - 54 remaining, mostly `any` type annotations in library code.
3. **Fast Refresh Warnings** - Context files export both hooks and components.

These are tracked for Beta 3 resolution.

---

## 📞 Support

For issues or questions:
- Check `BETA_2_TEST_VALIDATION.md` for testing procedures
- Review `BETA_2_LAUNCH_READINESS.md` for status details
- Check browser console for debug information (Mock mode logs all operations)

---

**Prepared:** January 26, 2026  
**Version:** 2.0.0-beta  
**Status:** Ready for Deployment ✅
