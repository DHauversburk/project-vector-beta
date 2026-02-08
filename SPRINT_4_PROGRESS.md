# Sprint 4: Provider Efficiency & Waitlist Management
**Theme:** "Closing the Loop" - Empowering providers to manage demand and schedule efficiently.
**Goal:** Implement Provider Waitlist View, Waitlist Processing, and Bulk Slot Operations.

## 📊 Status Summary
**Start Date:** 2026-01-24
**Status:** IN PROGRESS

## 📋 Stories

### PV-001: Provider Waitlist View ⏳
**Size:** M | **Status:** DONE

Providers need to see who is waiting for appointments.
- "Waitlist" card on dashboard (replacing/next to "Next Patient")
- Dedicated Waitlist Management modal/view
- Sort by date joined or urgency (notes)

**Acceptance Criteria:**
- [x] `api.getProviderWaitlist` integration
- [x] UI list component for waitlist entries
- [x] Badge count on dashboard (via Sidebar count)

---

### PV-002: Process Waitlist Requests ⏳
**Size:** M | **Status:** DONE

Providers can take action on waitlist entries.
- "Offer Slot" action (sends notification mock)
- "Dismiss" action (removes from list)
- Match waitlist request to newly created slot (automation)

**Acceptance Criteria:**
- [x] "Notify" button on waitlist entry
- [x] Status update to `fulfilled` or `cancelled`
- [ ] Auto-match suggestion when creating slots (Stretch Goal)

---

### PV-003: Bulk Slot Operations
**Size:** L | **Status:** DONE

Manage schedule faster by selecting multiple slots.
- Multi-select mode in Schedule grid
- Bulk Delete
- Bulk Toggle "Telehealth" status

**Acceptance Criteria:**
- [x] Selection state in `ProviderSchedule`
- [x] Bulk API methods (Delete implemented)
- [x] Batch UI actions toolbar
- [ ] Bulk Telehealth Toggle (Deferred)

---

## 🛠️ Technical Plan
1.  **Waitlist View**: specific component `WaitlistManager` for Provider Dashboard.
2.  **Bulk Actions**: Refactor `ProviderSchedule` to support selection mode.
