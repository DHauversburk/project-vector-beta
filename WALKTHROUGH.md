# Project Vector - Demo Walkthrough & Credentials

## 🔐 System Credentials (Mock Mode)

**Note:** In Mock Mode, the system uses a universal default password for token-based logins. Tactical PINs are user-defined upon first login.

### 🏥 Provider Personas (Medical Staff)
| Token ID | PersonaAlias | Role | Service | Default Password | Notes |
|----------|--------------|------|---------|------------------|-------|
| `R-TEAM-99X2` | **Captain Red** | Provider | Primary Care (Red) | `password123` | Main test provider. |
| `B-TEAM-77K1` | **Doctor Blue** | Provider | Physical Therapy | `password123` | Secondary provider. |
| `P-MH-9921` | **Major Green** | Provider | Mental Health | `password123` | Specialized care. |

### 🪖 Member Personas (Patients)
| Token ID | PersonaAlias | Role | Default Password | Notes |
|----------|--------------|------|------------------|-------|
| `M-8821-X4` | **Patient Alpha** | Member | `password123` | Standard patient. |
| `M-3392-L9` | **Patient Bravo** | Member | `password123` | Frequent visitor. |
| `M-1102-P2` | **Patient Charlie**| Member | `password123` | New accession. |

### 🛡️ Command Console (Admin)
| Token ID | Role | Default Password | Notes |
|----------|------|------------------|-------|
| `CMD-ALPHA-1` | **Admin/Command** | Admin | `password123` | Full system access. |

---

## 🧪 Test Workflows

### Scenario 1: The "Life Happens" Cycle (Cancel & Rebook)
**Objective:** Verify Provider cancellation reasons and Patient rebooking.

1.  **Login as Provider** (`R-TEAM-99X2`).
    *   Set PIN if prompted (e.g., `1111`).
    *   Go to **My Schedule**.
    *   Click on an existing appointment (or generated slot).
    *   Select **Cancel Appointment**.
    *   **CRITICAL:** Enter a reason (e.g., "Deployed to field", "Scanner broken").
    *   Confirm Cancellation.
    *   *Logout*.

2.  **Login as Patient** (`M-8821-X4` - assuming this was the booked patient, or book one first).
    *   *Hint:* If you need a booked appointment first, login as Patient, go to "Book Appointment", pick a slot, then logout, then do step 1.
    *   Login -> Dashboard -> **History / Past** tab.
    *   Find the Cancelled appointment.
    *   **Verify:** It shows "CANCELLED" and the reason ("Scanner broken").
    *   Click **Book Again**.
    *   Select a new slot and confirm.

### Scenario 2: The "Forgot PIN" Rescue (Admin Reset)
**Objective:** Verify Admin can rescue a locked-out user.

1.  **Login as Patient** (`M-3392-L9`).
    *   Set PIN to `9999`.
    *   Logout.
2.  **Simulate Lockout:** Pretend you forgot the PIN.
3.  **Login as Admin** (`CMD-ALPHA-1`).
    *   Go to **Token Station** (Identity Station).
    *   Switch to **User Directory** tab (top).
    *   Find `patient02` (or the alias for the patient).
    *   Click **Reset PIN**.
    *   Logout.
4.  **Login as Patient** (`M-3392-L9`) again.
    *   **Verify:** You are prompted to **"Create Verification PIN"** (Setup Phase) instead of "Enter PIN".
    *   Set a new PIN (`1234`) and access dashboard.

### Scenario 3: The "Fresh Start" (Data Wipe)
**Objective:** Verify Command Console clean-up capabilities.

1.  **Login as Admin** (`CMD-ALPHA-1`).
2.  Go to **System Hygiene**.
3.  Click **Erase All Mock Data** (Bottom Red Button).
4.  Confirm the warning.
5.  **Verify:**
    *   Go to **Master Schedule** -> It should be empty/clean.
    *   Logout.
    *   Login as Provider (`R-TEAM-99X2`) -> Schedule should be empty.

### Scenario 4: Auto-Mock Switching
**Objective:** Verify the app forces Mock Mode for test logins.

1.  **Ensure Real Mode:** If you are in Mock Mode (`DEMO` badge in footer), click the footer badge to switch to **Real Mode**.
2.  **Attempt Login:** Enter `R-TEAM-99X2` (or `doc_red`).
3.  **Verify:**
    *   The app should detect the test credential.
    *   It will auto-reload.
    *   It should auto-submit or prep the login form in **Mock Mode**.
    *   Authentication should succeed.

---

## 🛠️ Troubleshooting
*   **"Identity Token Not Found"**: Ensure you typed the token exactly (case-insensitive for `MOCK-` prefix, but exact match for the mapped keys).
*   **"Access Denied"**: You might be using the wrong PIN. Use Admin to reset it.
*   **Mock Data Not Saving**: Ensure you are in Demo Mode (Footer says "RUNNING IN DEMO MODE"). In Real Mode, data requires Supabase backend.
