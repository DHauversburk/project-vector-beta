# Project Vector - Beta 2 Test Scenarios

This document outlines the critical operational scenarios that must be validated during the Beta 2 testing phase. Each scenario is designed to test specific system capabilities under realistic conditions.

## 1. Operational Authentication (Zero-Trust)

### Scenario 1.1: Patient Identity Activation
- **User Roles**: Patient (New)
- **Steps**:
  1. Access landing page via PWA install.
  2. Select "Patient" operational mode.
  3. Enter a valid Token Alias (e.g., PATIENT-ALPHA).
  4. Verify system requests Tactical PIN setup.
  5. Set a 4-digit PIN and confirm.
- **Success Criteria**: User is directed to the Member Dashboard; subsequent logins require the Tactical PIN.

### Scenario 1.2: Provider Clinical Login
- **User Roles**: Provider
- **Steps**:
  1. Select "Provider" operational mode.
  2. Authenticate with email/password.
  3. Enter Tactical PIN.
- **Success Criteria**: Access to Clinical Node (Provider Dashboard) is granted.

---

## 2. Clinical Scheduling Operations

### Scenario 2.1: Bulk Availability Generation
- **User Roles**: Provider
- **Steps**:
  1. Navigate to "Schedule" tab.
  2. Open "Auto-Generate" tool.
  3. Select a 14-day range, M-F, 0900-1700.
  4. Execute "Generate Slots".
- **Success Criteria**: 14 days of slots appear in the calendar; no slots generated for weekends.

### Scenario 2.2: Supply-First Patient Booking
- **User Roles**: Patient
- **Steps**:
  1. Select "Schedule Appointment".
  2. Select a provider (e.g., Physical Therapy).
  3. Choose an available slot from the supply-first view.
  4. Add clinical note: "Post-op follow up".
  5. Confirm booking.
- **Success Criteria**: Slot status updates to "Confirmed"; appointment appears in "Upcoming" list.

---

## 3. Communication & Feedback

### Scenario 3.1: Post-Visit Effectiveness Index
- **User Roles**: Patient
- **Steps**:
  1. Navigate to "History" tab on Member Dashboard.
  2. Select a completed appointment.
  3. Click "Review".
  4. Select Effectiveness Index (1-5) and add comments.
  5. Submit feedback.
- **Success Criteria**: Feedback is logged; rating appears in Provider Analytics with sanitized text.

### Scenario 3.2: Urgent Help Request
- **User Roles**: Patient
- **Steps**:
  1. Select "Request Assistance" from Quick Actions.
  2. Set category to "Urgent".
  3. Enter subject and message.
- **Success Criteria**: Toast notification confirms receipt; request appears in Provider's "Pending Actions" queue.

---

## 4. System Integrity & Resiliency

### Scenario 4.1: Offline Mode Resiliency
- **User Roles**: Any (Operator)
- **Steps**:
  1. Open app and authenticate.
  2. Disconnect network (Flight Mode).
  3. Navigate between dashboard tabs (Overview, Security).
- **Success Criteria**: UI remains responsive; cached data is visible; offline indicator appears in System Status Bar.

### Scenario 4.2: Simulation Factory Reset
- **User Roles**: Admin / Provider
- **Steps**:
  1. Navigate to "Security".
  2. Execute "Factory Reset Simulation Data".
- **Success Criteria**: Local mock database is wiped; app reloads to landing page; all previously created appointments are cleared.

---

## 5. Security Fail-Safe

### Scenario 5.1: Incorrect Tactical PIN Lockout
- **User Roles**: Any
- **Steps**:
  1. Attempt login.
  2. Enter incorrect Tactical PIN 3 times.
- **Success Criteria**: System prevents access; provides clear guidance on identity recovery (Token Help).
