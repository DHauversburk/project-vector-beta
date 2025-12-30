# Verification Plan: 10 High Complexity Stories

This document outlines the 10 scenarios to be tested to ensure the robustness of the Project Vector PWA.

## 1. The "Waitlist" Conflict
**Objective**: Verify concurrency handling/state updates.
- **Steps**: Member A sees a slot. Provider blocks that specific slot. Member A attempts to book it.
- **Expected**: Booking fails or UI updates to show "Blocked".

## 2. The "Emergency Override"
**Objective**: Verify Provider power-user actions.
- **Steps**: Member has a confirmed appointment. Provider "Deletes" the appointment slot entirely.
- **Expected**: Appointment disappears from Member's dashboard.

## 3. The "Urgent Cascade"
**Objective**: Verify metadata lifecycle.
- **Steps**: Member books with "Urgent" note. Provider completes the appointment. Member views "Past Appointments".
- **Expected**: "Urgent" badge visible to Provider; Status "Completed" visible to Member.

## 4. The "Admin Ghost"
**Objective**: Verify Admin-on-behalf-of capabilities.
- **Steps**: Admin logs in, books a slot *for* Member X. Member X logs in.
- **Expected**: Member X sees the surprise booking on their dashboard.

## 5. The "Monday Blackout"
**Objective**: Verify bulk operations.
- **Steps**: Provider generates slots for a Monday. Provider immediately "Blocks" the entire day (manual or batch).
- **Expected**: Member checks Monday, sees no availability.

## 6. The "Token Swap" (Security)
**Objective**: Verify session isolation.
- **Steps**: User logs in as Ivan (Member). User logs out. User logs in as Jameson (Provider).
- **Expected**: Jameson sees *only* Provider view, no residual Member data state.

## 7. The "Double Dip"
**Objective**: Verify logic constraints.
- **Steps**: Member tries to book Slot A. Immediately tries to book Slot B (overlapping or verified restriction).
- **Expected**: System prevents multiple simultaneous active bookings (if constraint exists) or handles it gracefully.

## 8. The "Refresh Resilience"
**Objective**: Verify persistence (LocalStorage Mock).
- **Steps**: Member books Slot A. Page is refreshed (F5).
- **Expected**: Slot A remains booked. Authentication state remains logged in.

## 9. The "Link Hunter" (Security)
**Objective**: Verify route protection.
- **Steps**: Member logs in. Manually navigates URL to `/admin`.
- **Expected**: Redirected to `/dashboard` or Access Denied.

## 10. The "Full Cycle"
**Objective**: Verify end-to-end flow.
- **Steps**: Register new user. Login. Book Slot. Provider Confirms. Provider Completes. Member rates feedback.
- **Expected**: All states transition correctly without error.
