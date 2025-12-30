# Project Vector: Beta Testing Guide (v1.4.2)
**Classification:** UNCLASSIFIED // FOR TESTING PURPOSES ONLY

## Overview
Welcome to the Project Vector Beta. This is a **Simulation Mode** release, meaning it looks and feels like the real system but runs entirely offline in your browser. No real patient data is transmitted or stored.

**Objective:** Verify the usability, security workflows, and scheduling logic of the clinical access portal.

---

## 🔒 Access Credentials
Use the following accounts to test different roles within the system.

### 1. Patient Access (Member)
*Use "Secure Token" login mode.*
**Universal PIN:** `1111`

| Persona | Token | Scenario |
| :--- | :--- | :--- |
| **Patient Alpha** | `M-8821-X4` | Standard active member. |
| **Patient Bravo** | `M-3392-L9` | Follow-up appointment needed. |
| **Patient Charlie** | `M-1102-P2` | New intake (first time login). |

### 2. Provider Access (Clinician)
*Use "Email Login" mode.*
**Password:** `password`

| Persona | Email | Role |
| :--- | :--- | :--- |
| **Dr. Jameson** | `doc.mh@vector.mil` | **Mental Health (Green Team)** |
| **Dr. Taylor** | `doc.pt@vector.mil` | **Physical Therapy (Gold Team)** |
| **Dr. Smith** | `doc.om@vector.mil` | **Operational Medicine** |

### 3. Command Access (Admin)
*Use "Email Login" mode.*
**Password:** `password`
*   **Email:** `alex.admin@vector.mil`

---

## 🧪 Evaluation Test Scenarios

### Scenario A: The Patient Experience
**Role:** Patient Alpha (`M-8821-X4`)
1.  **Login:** Enter your Token and PIN (`1111`).
2.  **Booking:** Navigate to "New Appointment".
3.  **Filter:** Select "Mental Health" service.
4.  **Confirm:** Choose a time slot and confirm the booking.
5.  **Verify:** Ensure the appointment appears on your home dashboard.
6.  *Optional:* Try to book a slot that conflicts with an existing appointment (System should block you).

### Scenario B: Provider Schedule Management
**Role:** Dr. Jameson (`doc.mh@vector.mil`)
1.  **Review:** Log in and view your specific "Green Team" schedule.
2.  **Generate:** Click "Generate" to open availability.
    *   Set hours: `08:00` to `12:00`.
    *   Days: Select `Mon`, `Wed`, `Fri`.
    *   Action: Click "Execute".
3.  **Verify:** Check that new 45-minute slots appear in your calendar.
4.  **Block Time:** Use the generator again in **"Block Time"** mode.
    *   Set time: `12:00` to `13:00` (Lunch).
    *   Action: Execute.
    *   **Result:** Ensure this overwrites any empty slots but *does not* delete confirmed patient appointments.

### Scenario C: Tactical Token Management
**Role:** Dr. Jameson (`doc.mh@vector.mil`) or Admin
1.  **Navigate:** Go to the "Patients" (Tokens) tab.
2.  **Emergency Revoke:** Find "Patient Bravo" and click **Revoke**.
3.  **Test:** Open a new incognito window and try to log in as Patient Bravo. Access should be denied.
4.  **Re-Key:** As the provider, click **Re-Key** for Patient Bravo and enter a new alias (e.g., `M-NEW-99`).
5.  **Restore:** Click **Unlock**.
6.  **Verify:** Patient Bravo should now be able to log in using the new token `M-NEW-99`.

### Scenario D: System Audit & Security
**Role:** Admin (`alex.admin@vector.mil`)
1.  **Audit Log:** Navigate to the System Dashboard.
2.  **Review:** detailed logs of who logged in, who booked appointments, and any failed "Bad PIN" attempts.
3.  **Factory Reset:** Go to "System Maintenance" and click **Factory Reset**.
    *   **Result:** The application should wipe all local data and return to a fresh state (Login screen).

---

## 📱 Mobile Field Test (PWA)
1.  Open the application on a mobile device (iOS/Android).
2.  **Install:** Tap "Share" -> "Add to Home Screen".
3.  **Offline Mode:** Turn off your phone's Wi-Fi/Data (Airplane Mode).
4.  **Test:** Try to view your schedule. The app should load from cache and allow read-access to previously loaded data.
