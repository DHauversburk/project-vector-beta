# Sprint 1: Login Experience - IN PROGRESS 🔄

**Sprint Duration:** Day 1-2  
**Started:** 2026-01-24  
**Status:** IN PROGRESS

---

## 🎯 Sprint Goal

**Solve user confusion at the entry point** by creating a clear landing page that directs:
- **Patients** → Token-based login (with explanation)
- **Staff/Providers** → Email-based login
- **Administrators** → Admin portal access

---

## 📋 Stories

### LX-001: Create LandingPage Component ✅
**Size:** L | **Status:** DONE

Created a mobile-first landing page with vertical card layout:
- **Patient Access** - Blue gradient, "Most Common" badge
- **Healthcare Provider** - Green gradient
- **Administration** - Purple gradient

Each card links to `/login?mode=<type>` which pre-selects the appropriate tab.

**Files Created:**
- `src/pages/LandingPage.tsx`

**Files Modified:**
- `src/App.tsx` - Added route for `/` → LandingPage

---

### LX-002: Patient Login Flow - Step 1 (Token Explanation)
**Size:** M | **Status:** PENDING

Create a guided "What is a Token?" introduction for patients who may be confused:
- Visual guide showing where token is on appointment card
- Simple step-by-step instructions
- "I understand, take me to login" CTA

---

### LX-003: Update Routing for Landing Page
**Size:** S | **Status:** PENDING

Update App.tsx routing:
- `/` → New LandingPage
- `/login/patient` → Patient token login
- `/login/staff` → Staff email login
- `/login` → Redirect to landing page

---

### LX-004: Add "What is my Token?" Help Modal
**Size:** S | **Status:** PENDING

Add help modal accessible from token input screen:
- Image of sample appointment card
- Arrow pointing to token location
- "Still can't find it? Contact your provider"

---

## 📝 Notes

- Patient flow is the primary use case (most traffic)
- Staff/Admin are secondary but must be easily accessible
- Help content should reduce support calls

---

## 🚀 Next Up

Starting LX-001: LandingPage component...
