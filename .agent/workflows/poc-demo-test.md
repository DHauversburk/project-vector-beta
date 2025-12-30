---
description: Standardized Testing Workflow for Proof of Concept (PoC) Demonstrations
---

This workflow provides a step-by-step process for verifying the core functionality and security of the Project Vector PWA during demonstrations.

## 1. Environment Preparation
- Ensure the local development server is running: `npm run dev`
- Open the application in a modern browser (Chrome/Edge/Safari).
- Open Browser DevTools (F12) to monitor Console and Network tabs.
- **Tip**: Use "Incognito/Private" mode to ensure a clean state for each test.

## 2. Authentication Protocol (2FA Verification)
- **Step 2A: Token-Based Entry**
    - Navigate to the Login Terminal.
    - Input a known Tactical Token (e.g., `PATIENT-01`).
    - Click `Authorize Session`.
    - **Expected**: Transition to "Secondary Clearance Required" (PIN Stage).
- **Step 2B: PIN Clearance**
    - Input the 4-digit Tactical PIN (default `1234` for test accounts).
    - **Expected**: Immediate navigation to the appropriate Dashboard.
- **Step 2C: Biometric Bypass (Optional)**
    - Click `Sensor Scan` on the Login Terminal.
    - Complete the browser's biometric prompt.
    - **Expected**: Smooth transition to PIN Stage.

## 3. Operational Verification
- **Step 3A: Dashboard HUD Check**
    - Verify that the "Operations" tab is active.
    - Check for existing appointments in the "Personal Mission Feed".
- **Step 3B: Supply-First Booking**
    - Click `Book New Service`.
    - Select a Service Node (Provider).
    - Choose an open time slot from the grid.
    - **Expected**: "Success: Calendar manifest issued" alert and feed update.

## 4. Security & Configuration Management
- **Step 4A: Security Tab**
    - Switch to the "Security" tab in the dashboard.
    - **Expected**: PIN Update and Biometric Enrollment UI visible.
- **Step 4B: Theme Resilience**
    - Click the Sun/Moon icon to toggle Dark/Light mode.
    - **Expected**: High-contrast legibility in both modes.

## 5. Resilience & PWA Hardware Check
- **Step 5A: Offline Simulation**
    - In DevTools (Network tab), set throttling to "Offline".
    - Attempt a booking or a refresh.
    - **Expected**: Service Worker should serve the App Shell; Mutations should queue for Background Sync.
- **Step 5B: Responsiveness**
    - Toggle Device Toolbar to "Mobile" view (e.g., iPhone 14).
    - **Expected**: UI components (PIN field, booking grid) should reflow without breakage.

## 6. Cleanup
- Log out of the session.
- Clear Browser Application Storage (Caches and IndexedDB) if a full reset is required for the next iteration.
