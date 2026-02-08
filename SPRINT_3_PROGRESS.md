# Sprint 3: Member Experience & Waitlist System
**Theme:** "No Dead Ends" - Ensuring patients always have a path forward.
**Goal:** Implement Waitlist, Telehealth indicators, and Dashboard Quick Actions.

## 📊 Status Summary
**Start Date:** 2026-01-24
**Status:** IN PROGRESS

## 📋 Stories

### MB-001: Waitlist System ✅
**Size:** L | **Status:** DONE

Allow patients to join a waitlist when a provider is fully booked.
- ✅ "Join Waitlist" button on provider cards
- ✅ Auto-notification (mock) when slot opens
- ✅ "You are on the waitlist" status indicator

**Acceptance Criteria:**
- ✅ WaitlistEntry type in api.ts
- ✅ `joinWaitlist` and `leaveWaitlist` API methods
- ✅ UI to join waitlist on fully booked days
- ✅ Dashboard modification to show active waitlists

---

### MB-002: Dashboard Quick Actions ✅
**Size:** M | **Status:** DONE

One-click access to common tasks from the main dashboard.
- ✅ "Book Next Available" shortcut
- ✅ "My Schedule" shortcut
- ✅ "Request Help" shortcut
- ✅ Integrated with existing modals

---

### MB-003: Video Visit / Telehealth Support ✅
**Size:** S | **Status:** DONE

Indicate which providers/slots are video-capable.
- ✅ `is_video` flag added to Appointment type
- ✅ Slots randomly generated with Telehealth capability (mock)
- ✅ Video icon indicator in slot selection UI

---

## 🏁 Sprint Complete
All stories for Sprint 3 have been implemented and integrated.
User flow for "Waitlist" and "Quick Actions" is fully functional.
