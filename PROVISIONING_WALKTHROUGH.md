# Identity Provisioning Workflow

## The Story: "Zero-Trust Handoff"

### Scene 1: The Token Station (Admin)
**Actor**: `COMMAND-01` (Clinic Administrator)
1.  **Action**: Admin logs into the "Token Station" (Admin Dashboard).
2.  **Input**: Selects `PROVIDER (CLINICIAN)` from the Role dropdown.
3.  **Input**: Selects `OPERATIONAL MEDICINE (RED)` from the Service dropdown.
4.  **Execution**: clicks **Generate Identity**.
5.  **System Output**: A new card appears with:
    *   **Token ID**: `OM-X9Y2-Z8Q1`
    *   **QR Code**: Encoded link to login.
    *   **Role**: PROVIDER
6.  **Handoff**: Admin prints the batch sheet and hands the physical slip to Dr. Smith.

### Scene 2: Activation (User)
**Actor**: Dr. Smith (New Provider)
1.  **Action**: Dr. Smith scans the QR code with his tablet/phone OR types `OM-X9Y2-Z8Q1` into the Login screen.
2.  **System Logic**:
    *   App detects the token format.
    *   Resolves hidden credentials (`om-x9y2...@vector.mil`).
    *   Authenticates against Supabase Auth.
3.  **Security**: System prompts: *"First Time Login. Set Security PIN."*
4.  **Action**: Dr. Smith sets PIN `1234`.
5.  **Result**: Dr. Smith is redirected to the **Provider Dashboard**, seeing his specific "Red Team" schedule.

### Scene 3: Management (Admin)
**Actor**: `COMMAND-01`
1.  **Action**: Admin navigates to **User Directory** tab (Hidden from Providers).
2.  **View**: Admin sees the "Identity Matrix" with filtering options for Service and Role.
3.  **Maintenance**: Admin can select multiple inactive tokens or old users and **Bulk Delete** them to maintain hygiene.
4.  **Security**: Only Admins can execute these deletions; strict RLS policies prevent Providers from accidental data loss.

---

## Technical Architecture (Supabase Integration)

How does a "Token" become a "User"?

1.  **Frontend (`TokenGenerator.tsx`)**:
    *   Generates a random high-entropy string (e.g. `MH-8821-X4`).
    *   Calls the Backend RPC: `admin_create_user`.

2.  **Backend (Supabase Postgres RPC)**:
    *   **Function**: `admin_create_user(email, password, token, role, service_type)`
    *   **Step A**: Inserts into `auth.users` (The real Identity Provider table).
        *   Email: `mh-8821-x4@vector.mil`
        *   Password: `SecurePass2025!` (Standard Provisioning Password).
        *   Metadata: `{ token_alias: 'MH-8821-X4', role: 'member' }`.
    *   **Step B**: Inserts into `public.users` (The App Data table).
        *   Sets `role` and `service_type`.
    *   **Step C**: Returns success.

3.  **Login Logic (`LoginPage.tsx`)**:
    *   User enters `MH-8821-X4`.
    *   App converts to email: `mh-8821-x4@vector.mil`.
    *   App uses standard password: `SecurePass2025!`.
    *   **Result**: Valid Authentication Token issued.

This "Zero-Knowledge" approach means the User never needs to know their "Email" or "Password". They just know their **Token**.
