# Project Vector: Product Backlog
## User Personas, Epics & User Stories

**Version:** 2.0.0 (Phase 2 Roadmap)  
**Last Updated:** 2026-01-31 (Sprint 8 Complete)  
**Sprint Alignment:** Sprint 9 Planning - The Bunker (Offline PWA)  

---

## 🎭 User Personas

### Persona 1: "Doc Rivers" – Field Provider (Primary)
| Attribute | Details |
|-----------|---------|
| **Role** | Flight Medic / Field Provider (BMET III) |
| **Device** | iPhone 14 Pro (primary), iPad (secondary), Desktop workstation (rare) |
| **Context** | Mobile 80% of the time; uses app during patient encounters, between calls, and in transit |
| **Goals** | Quick documentation, minimal friction, one-handed operation |
| **Pain Points** | - Current modal is clunky on mobile<br>- Has to scroll to find Quick Note<br>- Can't easily create follow-up appointments from field notes<br>- Old notes clutter the interface |
| **Quote** | "I need to document in 10 seconds or less. Every tap counts." |

### Persona 2: "Sgt. Mendez" – Clinic Administrator
| Attribute | Details |
|-----------|---------|
| **Role** | NCOIC, Medical Clinic Administration |
| **Device** | Windows Desktop (primary), Android tablet (secondary) |
| **Context** | Office-bound 90% of the time; manages provider schedules, patient tokens, and analytics |
| **Goals** | Full visibility into patient encounters, data-driven decisions, compliance reporting |
| **Pain Points** | - Can't see historical trends of patient interactions<br>- No way to archive old notes while preserving statistics<br>- Desktop layout doesn't maximize screen real estate |
| **Quote** | "I need to know how many patients we've seen this month without scrolling through every note." |

### Persona 3: "PVT Chen" – Patient/Member
| Attribute | Details |
|-----------|---------|
| **Role** | Active Duty Service Member (patient) |
| **Device** | Android phone (primary), rarely uses desktop |
| **Context** | Accesses app for appointments only; privacy-conscious |
| **Goals** | Book/reschedule appointments quickly, maintain anonymity |
| **Pain Points** | - Interface feels "desktop-first" on phone<br>- Navigation is confusing on small screens |
| **Quote** | "Just let me book my appointment in 2 minutes." |

---

## 📱 Epic 1: Adaptive Device Detection & Responsive Layouts

### Epic Summary
Automatically detect the user's device type (desktop, tablet, mobile) and screen orientation to provide an optimized layout. This ensures field providers on mobile get a touch-first, one-handed experience while administrators on desktops see a productivity-focused, data-rich interface.

### Business Value
- **Reduced friction** for mobile users (80% of field providers)
- **Increased engagement** through device-appropriate UX
- **Lower support requests** from confused users

### Acceptance Criteria
1. System auto-detects device type on app load
2. Layout adapts in real-time to screen resize/orientation change
3. Mobile layout prioritizes:
   - Large tap targets (min 48px)
   - Bottom-sheet modals (thumb-reachable)
   - Swipe gestures for common actions
4. Desktop layout prioritizes:
   - Data density (more info visible)
   - Sidebar navigation (always visible)
   - Keyboard shortcuts
5. User can manually override device mode in Settings

---

### User Story 1.1: Auto-Detect Device Type
**As a** user opening the app,  
**I want** the system to automatically detect my device type,  
**So that** I get the best layout without manual configuration.

**Acceptance Criteria:**
- [x] Detect device via `navigator.userAgent` and screen dimensions
- [x] Classify as `mobile` (≤640px), `tablet` (641-1024px), or `desktop` (>1024px)
- [x] Store preference in React Context for app-wide access
- [x] Re-evaluate on window resize or orientation change

**Technical Notes:**
```typescript
// src/contexts/DeviceContext.tsx
type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';

interface DeviceState {
  device: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  overrideDevice: DeviceType | null;
}
```

**Story Points:** 3  
**Priority:** HIGH  
**Sprint:** 7  
**Status:** ✅ COMPLETE

---

### User Story 1.2: Mobile-First Quick Note Modal
**As a** field provider on a mobile device,  
**I want** the Quick Note modal to appear as a bottom sheet,  
**So that** I can document with one hand while holding my phone.

**Acceptance Criteria:**
- [x] On mobile, modal slides up from bottom (covers 85% of screen)
- [x] Swipe down to dismiss
- [x] Large input fields with auto-focus on note content
- [x] Dictate button is prominently placed and oversized (72px)
- [x] Quick ID button generates timestamp-based ID with single tap

**Wireframe:**
```
┌─────────────────────────────┐
│ ▂▂▂ (drag handle)          │
├─────────────────────────────┤
│ ⚡ QUICK NOTE               │
│                             │
│ Patient ID: [PT-2026-01-31] │
│                             │
│ ┌─────────────────────────┐ │
│ │ Note content...         │ │
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ [🎤 DICTATE]   [SAVE ✓]     │
└─────────────────────────────┘
```

**Story Points:** 5  
**Priority:** HIGH  
**Sprint:** 7  
**Status:** ✅ COMPLETE

---

### User Story 1.3: Desktop-Optimized Dashboard
**As an** administrator on a desktop,  
**I want** to see more data at once without excessive scrolling,  
**So that** I can monitor clinic operations efficiently.

**Acceptance Criteria:**
- [x] On desktop (>1024px), use multi-column grid layout
- [x] Sidebar always visible (not collapsible by default)
- [x] Top header shows current view name + Quick Actions
- [x] Widgets use available vertical space (CSS Grid/Flexbox)
- [x] Keyboard shortcuts visible in interface (Ctrl+K, N, etc.)

**Story Points:** 5  
**Priority:** MEDIUM  
**Sprint:** 9  
**Status:** ✅ COMPLETE

---

### User Story 1.4: Manual Device Override
**As a** user with specific preferences,  
**I want** to manually select my preferred layout mode,  
**So that** I can use tablet mode on my large phone if I prefer.

**Acceptance Criteria:**
- [ ] Add "Display Mode" option in Settings/Preferences
- [ ] Options: Auto-detect (default), Force Mobile, Force Tablet, Force Desktop
- [ ] Persist selection in localStorage
- [ ] Override takes precedence over auto-detection

**Story Points:** 2  
**Priority:** LOW  
**Sprint:** Backlog

---

## 📝 Epic 2: Enhanced Patient Notes System

### Epic Summary
Transform the Quick Note feature from simple documentation into an integrated clinical workflow hub. Providers can create follow-up appointments directly from notes, categorize encounters, and manage their patient interaction history.

### Business Value
- **Streamlined workflow**: Reduce steps to schedule follow-ups by 75%
- **Better continuity of care**: Link notes to appointments
- **Improved compliance**: Trackable patient interactions

### Acceptance Criteria
1. Notes can be converted to appointment requests with one click
2. Notes display patient history timeline
3. Notes can be categorized (Follow-up, Routine, Urgent)
4. Notes can be marked as "Complete" or "Requires Action"

---

### User Story 2.1: Create Appointment from Note
**As a** provider documenting a patient encounter,  
**I want** to create a follow-up appointment directly from the note modal,  
**So that** I don't have to navigate away to schedule the patient.

**Acceptance Criteria:**
- [x] Add "Schedule Follow-Up" button in QuickNoteModal
- [x] Button opens inline appointment picker (date/time/type)
- [x] Selected time creates appointment linked to this note
- [x] Note is saved with appointment reference
- [x] Confirmation shows both note saved + appointment created

**Wireframe (Mobile):**
```
┌─────────────────────────────┐
│ QUICK NOTE SAVED ✓          │
│                             │
│ Patient: PT-2026-01-31-1430 │
│ Category: Follow-Up         │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📅 Schedule Follow-Up?  │ │
│ │                         │ │
│ │ Date: [Feb 15, 2026 ▼]  │ │
│ │ Time: [0900 ▼]          │ │
│ │ Type: [Routine ▼]       │ │
│ │                         │ │
│ │ [Create Appointment]    │ │
│ └─────────────────────────┘ │
│                             │
│ [Skip] [Done]               │
└─────────────────────────────┘
```

**Story Points:** 8  
**Priority:** HIGH  
**Sprint:** 8  
**Status:** ✅ COMPLETE

---

### User Story 2.2: Note Category System
**As a** provider reviewing clinical logs,  
**I want** to categorize notes by interaction type,  
**So that** I can filter and find specific encounters quickly.

**Acceptance Criteria:**
- [x] Add `category` field to EncounterNote type:
  - `routine` - Standard check-in
  - `follow_up` - Scheduled follow-up
  - `urgent` - Requires immediate attention
  - `admin` - Administrative note
- [x] Category selectable in QuickNoteModal
- [x] EncounterLogs view can filter by category
- [x] Category shown as colored badge on note cards

**Story Points:** 3  
**Priority:** MEDIUM  
**Sprint:** 7  
**Status:** ✅ COMPLETE

---

### User Story 2.3: Note Action Status
**As a** provider managing my patient interactions,  
**I want** to mark notes as "Requires Action" or "Complete",  
**So that** I can track which patients need follow-up.

**Acceptance Criteria:**
- [x] Add `status` field: `active`, `requires_action`, `resolved`
- [x] Default status is `active`
- [x] Add toggle button to change status
- [x] EncounterLogs shows filter/sort by status
- [x] "Requires Action" notes highlighted in dashboard widget

**Story Points:** 3  
**Priority:** MEDIUM  
**Sprint:** 8  
**Status:** ✅ COMPLETE

---

## 🗄️ Epic 3: Note Archival with Analytics Preservation

### Epic Summary
Allow providers and administrators to archive old notes to reduce clutter while preserving aggregate analytics. The system maintains statistical summaries (encounter counts, category distributions) even after individual notes are archived or purged.

### Business Value
- **Cleaner interface**: Active notes list stays manageable
- **Compliance**: Historical data preserved for audits
- **Analytics integrity**: Metrics don't disappear with archived notes

### Acceptance Criteria
1. Notes older than X days can be auto-archived
2. Archived notes are hidden from default view but retrievable
3. Analytics dashboard shows data from ALL notes (including archived)
4. Admin can permanently delete archived notes while keeping stats

---

### User Story 3.1: Archive Old Notes
**As a** provider with many historical notes,  
**I want** to archive notes older than 30 days,  
**So that** my active notes list stays focused on recent encounters.

**Acceptance Criteria:**
- [x] Add `archived` boolean field to EncounterNote type
- [x] Add "Archive" action on individual notes
- [x] Add "Archive All Before..." bulk action (date picker)
- [x] Archived notes hidden from default EncounterLogs view
- [x] Toggle to "Show Archived" in EncounterLogs
- [x] Archived notes appear grayed out when shown

**Data Model Update:**
```typescript
interface EncounterNote {
  id: string;
  // ... existing fields ...
  archived: boolean;
  archived_at: string | null;
}
```

**Story Points:** 5  
**Priority:** HIGH  
**Sprint:** 8  
**Status:** ✅ COMPLETE

---

### User Story 3.2: Analytics Aggregation Layer
**As an** administrator viewing analytics,  
**I want** to see patient encounter statistics that include archived notes,  
**So that** my reports are accurate over time.

**Acceptance Criteria:**
- [x] Create `note_statistics` aggregate table/object:
  ```typescript
  interface NoteStatistics {
    period: string; // YYYY-MM format
    total_encounters: number;
    by_category: Record<string, number>;
    by_provider: Record<string, number>;
    unique_patients: number;
  }
  ```
- [x] Aggregate stats computed on archive/delete
- [x] Analytics dashboard reads from aggregate, not individual notes
- [x] Stats persist even if individual notes are purged

**Story Points:** 8  
**Priority:** HIGH  
**Sprint:** 8  
**Status:** ✅ COMPLETE

---

### User Story 3.3: Permanent Note Deletion (Admin)
**As an** administrator managing data retention,  
**I want** to permanently delete archived notes older than 1 year,  
**So that** we comply with data retention policies.

**Acceptance Criteria:**
- [ ] Admin-only "Purge Archived Notes" action
- [ ] Date threshold picker (default: 1 year old)
- [ ] Confirmation modal with count of notes to delete
- [ ] Deletion updates statistics aggregate before purging
- [ ] Audit log entry created for purge action
- [ ] Irreversible action warning

**Story Points:** 5  
**Priority:** MEDIUM  
**Sprint:** Backlog

---

### User Story 3.4: Auto-Archive Settings
**As a** provider who doesn't want to manually archive,  
**I want** notes to auto-archive after a configurable period,  
**So that** my interface stays clean without effort.

**Acceptance Criteria:**
- [ ] Add "Auto-Archive After" setting in Provider preferences
- [ ] Options: Never, 30 days, 60 days, 90 days
- [ ] Background job (or on-load check) archives qualifying notes
- [ ] Notification when notes are auto-archived

**Story Points:** 3  
**Priority:** LOW  
**Sprint:** Backlog

---

## 📊 Priority Matrix

| Story | Business Value | Effort | Priority Score |
|-------|---------------|--------|----------------|
| 1.1 Auto-Detect Device | HIGH | LOW (3) | ⭐⭐⭐⭐⭐ |
| 1.2 Mobile Quick Note | HIGH | MEDIUM (5) | ⭐⭐⭐⭐⭐ |
| 2.1 Appointment from Note | HIGH | HIGH (8) | ⭐⭐⭐⭐ |
| 3.1 Archive Notes | HIGH | MEDIUM (5) | ⭐⭐⭐⭐ |
| 2.2 Note Categories | MEDIUM | LOW (3) | ⭐⭐⭐⭐ |
| 3.2 Analytics Aggregation | HIGH | HIGH (8) | ⭐⭐⭐⭐ |
| 1.3 Desktop Optimization | MEDIUM | MEDIUM (5) | ⭐⭐⭐ |
| 2.3 Note Status | MEDIUM | LOW (3) | ⭐⭐⭐ |
| 3.3 Permanent Deletion | MEDIUM | MEDIUM (5) | ⭐⭐⭐ |
| 1.4 Manual Override | LOW | LOW (2) | ⭐⭐ |
| 3.4 Auto-Archive | LOW | LOW (3) | ⭐⭐ |

---

---

## � Epic 4: Battle-Ready PWA (Offline & Sync)

### Epic Summary
Empower field providers to operate seamlessly in disconnected environments (DIL - Disconnected, Intermittent, Limited bandwidth). The app must function 100% offline for data entry and reviewing cached data, synchronizing automatically when connectivity is restored.

### Business Value
- **Mission Criticality**: Field medics often operate in signal-dead zones.
- **Data Integrity**: No lost notes due to connection drops.
- **Speed**: Local-first architecture makes the UI instant (0ms latency).

### Acceptance Criteria
1. App loads instantly in Airplane Mode.
2. Users can create, edit, and archive notes while offline.
3. "Pending Sync" indicator shows for unsynced data.
4. Background sync handles data upload when connection returns.
5. Conflict resolution strategy defined (Last-Write-Wins or Manual Merge).

### User Story 4.1: Service Worker Caching Strategy
**As a** provider in a bunker with no signal,
**I want** the app shell and recent data to load immediately,
**So that** I maintain situational awareness without internet.

**Acceptance Criteria:**
- [x] Implement Workbox for advanced caching strategies.
- [x] Logic:
    - **Stale-While-Revalidate** for static assets (icons, stylesheets).
    - **Network-First** for list views (Encounter Logs).
    - **Cache-First** for "Immutable" resources (Profile pictures, Forms).
- [x] "You are offline" banner notification.

**Story Points:** 5
**Priority:** CRITICAL
**Sprint:** 9
**Status:** ✅ COMPLETE

### User Story 4.2: Robust Offline Write Queue (Outbox Pattern)
**As a** provider documenting a casualty,
**I want** to hit "Save" regardless of connection status,
**So that** I can move to the next patient immediately.

**Acceptance Criteria:**
- [ ] Create persistent local "Mutation Queue" (IndexedDB).
- [ ] All write operations (POST/PUT/DELETE) go to Queue first.
- [ ] "Sync Engine" processes queue when online.
- [ ] Retry mechanism with exponential backoff for failed syncs.

**Story Points:** 8
**Priority:** CRITICAL

---

## 🛡️ Epic 5: Fortified Security (Zero Trust)

### Epic Summary
Elevate security posture to meet strict DoD impact levels. Implement "Zero Trust" principles on the client side, ensuring data is encrypted at rest in the browser and authentication is resistant to session hijacking.

### User Story 5.1: Biometric Re-Authentication
**As a** provider sharing a tablet,
**I want** to use FaceID/TouchID to unlock the app after inactivity,
**So that** I don't have to type my long password repeatedly while ensuring security.

**Acceptance Criteria:**
- [ ] Implement WebAuthn API.
- [ ] "Unlock" screen overlays app after 5 mins inactivity.
- [ ] Fallback to PIN/Password if biometrics fail.

**Story Points:** 5
**Priority:** HIGH

### User Story 5.2: Client-Side Data Encryption
**As a** security officer,
**I want** sensitive local data (IndexedDB/LocalStorage) to be encrypted,
**So that** physical device theft doesn't compromise patient data.

**Acceptance Criteria:**
- [ ] Encrypt all "Rest" data in IndexedDB (AES-GCM).
- [ ] Encryption key derived from user session (not stored plain text).
- [ ] Clear sensitive data on explicit logout.

**Story Points:** 8
**Priority:** HIGH

---

## 🛠️ Technical Debt & Infrastructure

| Item | Description | Impact | Priority |
|------|-------------|--------|----------|
| **Virtualization** | Implement virtualized lists (react-window) for Encounter Logs. | Mobile performance crashes with >100 items. | HIGH |
| **A11y Audit** | WCAG 2.1 AA Compliance Check (High Contrast, Screen Reader). | Compliance requirement for Gov apps. | MEDIUM |
| **E2E Testing** | Implement Playwright suite for critical paths (Login -> Note -> Sync). | Prevents regression in complex sync logic. | HIGH |
| **Error Boundary** | Global error boundary with Sentry integration. | Observability of field crashes. | MEDIUM |

---

## ⚠️ Risk Assessment & Mitigation "Shortfalls"

### 1. Offline Data Conflict
*   **Risk**: Provider A edits a note offline. Admin B edits same note online. Provider A reconnects.
*   **Impact**: Data loss or overwrite.
*   **Mitigation**: Implement "Field Level LWW" (Last Write Wins) or visual diff merge. For MVP, Field Provider wins.

### 2. Local Storage Limits
*   **Risk**: Browser creates quota limit (usually ~50-100MB) for PWA.
*   **Impact**: App fails to cache media/charts.
*   **Mitigation**: Implement strict LRU (Least Recently Used) eviction policy for cached assets. Monitor `navigator.storage.estimate()`.

### 3. Session Expiry in Field
*   **Risk**: Auth token expires while offline.
*   **Impact**: User locked out until connectivity returns.
*   **Mitigation**: Implement long-lived "Refresh Tokens" that can be rotated. Allow "Offline Session" mode (read-only) if token expired but biometric check passes.

---

## 🗓️ Phase 2 Roadmap

### Sprint 9: "The Bunker" (Offline Foundation)
*   **Goals**: Service Worker, Caching Strategy, Offline Indicator.
*   **Stories**: 4.1, 1.3 (Desktop Dash)

### Sprint 10: "Sync or Swim" (Data Resilience)
*   **Goals**: Mutation Queue, Outbox Pattern, Conflict Basic Handling.
*   **Stories**: 4.2, 4.3

### Sprint 11: "Fort Knox" (Security)
*   **Goals**: Biometrics, Encryption, Audit Logs.
*   **Stories**: 5.1, 5.2, 3.3 (Perm Delete)

---

## 📎 Related Documents

- `BETA_2_ROADMAP.md` - Current roadmap
- `ARCHITECTURE.md` - System architecture
- `TEST_SCENARIOS.md` - Testing guide

---

**Document Owner:** Product Team  
**Next Review:** Weekly sprint planning
