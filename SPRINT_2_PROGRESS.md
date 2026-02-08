# Sprint 2: Communication & Documentation - IN PROGRESS 🔄

**Sprint Duration:** Day 2-3  
**Started:** 2026-01-24  
**Status:** IN PROGRESS

---

## 🎯 Sprint Goal

**Reduce physical provider hunting** by giving patients a way to request help 
and giving providers a way to document quick interactions.

**Field Exercise Feedback:**
- Patients had to manually seek out providers
- Providers couldn't document brief interactions
- No async communication channel

---

## 📋 Stories

### CD-001: Quick Encounter Notes System ✅
**Size:** L | **Status:** DONE

Providers can document brief patient interactions:
- ✅ EncounterNote type in api.ts
- ✅ QuickNoteModal component created
- ✅ Floating "Quick Note" button on Provider Dashboard
- ✅ Categories: Question, Counseling, Reschedule, Follow-up, Admin, Other
- ✅ Persisted in mock store

---

### CD-002: Patient Help Request System ✅
**Size:** L | **Status:** DONE

Patients can request assistance without hunting providers:
- ✅ HelpRequest type in api.ts
- ✅ HelpRequestModal component created
- ✅ Floating "Need Help?" button on Patient Dashboard
- ✅ Categories: Question, Reschedule, Urgent, Technical, Other
- ✅ Success confirmation with auto-close
- ✅ Persisted in mock store

Allow patients to request assistance without hunting providers:
- "Request Help" button on patient dashboard
- Request types: Question, Reschedule, Urgent, Other
- Message field for details
- Providers see pending requests in their dashboard

**Acceptance Criteria:**
- [ ] HelpRequest type in mock store
- [ ] RequestHelpModal for patients
- [ ] Pending requests view for providers
- [ ] Request status tracking (pending → resolved)

---

### CD-003: Request/Note Resolution Flow
**Size:** M | **Status:** PENDING

Provider workflow for handling requests:
- View request details
- Add resolution note
- Mark as resolved
- History of all interactions

---

## 📝 Technical Notes

- All data stored in mock store (no Supabase changes needed for POC)
- Real-time updates via React state (not websockets for now)
- Focus on UX and reducing friction

---

## 🚀 Starting Now

Building CD-001: Quick Encounter Notes System
