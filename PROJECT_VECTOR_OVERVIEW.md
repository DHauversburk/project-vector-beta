# Project Vector: Executive Overview

## 🎯 The Mission
**Eliminate Barriers to Care.**
Project Vector is a specialized clinical scheduling platform designed to bypass the stigma and privacy concerns that prevent personnel from seeking mental and physical health support. We replace names with tokens, and visibility with encryption.

---

## ⚡ Key Value Propositions

### 1. Zero-Trust Anonymity (The "Ghost" Protocol)
*   **Feature:** Patients never log in with email or PII (Personally Identifiable Information).
*   **Mechanism:** Access is granted via randomly generated **Physical Tokens** (e.g., `M-8821-X4`) issued on printed appointment cards.
*   **Benefit:** Zero digital footprint. If the database is compromised, no patient names are exposed.

### 2. Air-Gapped Security Architecture
*   **Feature:** "Simulation Mode" and Local-First Data.
*   **Mechanism:** The application is built as a Progressive Web App (PWA) capable of running entirely offline in "Simulation Mode" or connecting to a secure, compartmentalized backend.
*   **Benefit:** Deployable in austere environments (Submarines, Forward Operating Bases) with intermittent or no connectivity.

### 3. Tactical Provider Controls
*   **Feature:** Rapid Schedule Management.
*   **Mechanism:** Providers can "Block" time chunks or "Generate" weeks of availability in seconds (`0800-1600` Mon/Wed/Fri).
*   **Benefit:** Maximizes clinical throughput while respecting provider operational tempos.

### 4. Enterprise-Grade Admin Tools
*   **Feature:** The "Kill Switch" & Re-Keying.
*   **Mechanism:** Admins can instantly **Revoke** a compromised token and **Re-Key** a user with a new alias without deleting their history.
*   **Benefit:** Maintains security integrity without disrupting continuity of care.

---

## 🚀 Technical Highlights
*   **FIPS-140 Compliant UI:** built with high-contrast, accessibility-first design.
*   **Mobile-First PWA:** Installs on any device as a native-like app.
*   **Role-Based Access Control (RBAC):** Strict separation between `Member` , `Provider`, and `Admin` views.
*   **Zero-Knowledge Database:** Patient records are linked only to aliases, not identities.

---

## 🛑 The "Elevator Pitch"
> "We built a scheduling system where the database doesn't know who the patient is. By decoupling identity from clinical activity using physical tokens, Project Vector allows high-risk personnel to seek help without fear of career impact or digital surveillance. It's secure, anonymous, and deployable anywhere."
