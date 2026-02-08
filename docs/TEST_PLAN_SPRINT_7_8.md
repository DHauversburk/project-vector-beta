# Test Plan: Sprint 7 & 8 Features
## Patient Notes Refactoring - Comprehensive Testing Guide

**Version:** 1.0.0  
**Created:** 2026-01-31  
**Scope:** Device Detection, Quick Note Enhancements, Note Archival, Status Management  

---

## 📋 Test Environment Setup

### Prerequisites
1. Run `npm run build` to ensure clean build ✅
2. Start dev server: `npm run dev`
3. Clear localStorage to start fresh: `localStorage.clear()` in browser console
4. Have a Provider account logged in

### Test Devices
- **Desktop:** Chrome/Firefox (>1024px width)
- **Tablet:** iPad simulator or resize to 768px
- **Mobile:** iPhone simulator or resize to 375px

---

## 🧪 Test Suite 1: Device Detection (Story 1.1)

### TC-1.1.1: Auto-Detection on Desktop
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app on desktop (>1024px) | App loads |
| 2 | Open DevTools Console | Execute: `window.__DEVICE_CONTEXT__` or check React DevTools |
| 3 | Verify device type | Should return `device: 'desktop'` |

### TC-1.1.2: Auto-Detection on Mobile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools and enable mobile view (375px) | View switches |
| 2 | Refresh the page | Context re-evaluates |
| 3 | Verify device type | Should return `device: 'mobile'` |

### TC-1.1.3: Orientation Change Detection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set mobile view to portrait (375x667) | Portrait mode |
| 2 | Rotate to landscape (667x375) | Orientation changes |
| 3 | Verify context update | `orientation: 'landscape'` |

---

## 🧪 Test Suite 2: Mobile Bottom-Sheet Modal (Story 1.2)

### TC-1.2.1: Modal Appearance on Mobile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to mobile (375px width) | Mobile view active |
| 2 | Navigate to Provider Dashboard | Dashboard loads |
| 3 | Click "Quick Note" button | Modal slides up from bottom |
| 4 | Verify modal position | Modal anchored to bottom, covers ~90% |
| 5 | Verify drag handle | Gray pill-shaped handle visible at top |

### TC-1.2.2: Swipe-to-Dismiss
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Quick Note modal on mobile | Modal visible |
| 2 | Touch drag handle and swipe down ~50px | Modal follows finger, backdrop fades slightly |
| 3 | Release before 100px threshold | Modal snaps back to original position |
| 4 | Swipe down >100px and release | Modal dismisses with animation |

### TC-1.2.3: Modal Appearance on Desktop
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to desktop (>1024px) | Desktop view active |
| 2 | Click "Quick Note" button | Modal appears centered |
| 3 | Verify modal style | Rounded corners, no drag handle |

---

## 🧪 Test Suite 3: Note Categories (Story 2.2)

### TC-2.2.1: Category Selection in Quick Note
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Quick Note modal | Modal visible |
| 2 | View category buttons | 8 categories visible: Question, Counseling, Routine, Follow-up, Urgent, Reschedule, Admin, Other |
| 3 | Tap each category | Selected category highlights with color |
| 4 | Submit note with "Urgent" category | Note created with `category: 'urgent'` |

### TC-2.2.2: Category Filter in Encounter Logs
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to "Clinical Logs" view | Logs display |
| 2 | Click category filter dropdown | All categories listed |
| 3 | Select "Urgent" | Only urgent notes shown |
| 4 | Select "All" | All notes visible again |

---

## 🧪 Test Suite 4: Note Status Toggle (Story 2.3)

### TC-2.3.1: Status Display in Encounter Logs
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to "Clinical Logs" | Logs visible |
| 2 | View any note card | Status badge visible (Active/Action/Resolved) |
| 3 | Verify status icon | Clock (Active), Warning (Action), Check (Resolved) |

### TC-2.3.2: Status Cycle Toggle
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a note with "Active" status | Blue "ACTIVE" badge |
| 2 | Click the status badge | Toast: "Status updated to Needs Action" |
| 3 | Verify badge update | Amber "ACTION" badge |
| 4 | Click again | Toast: "Status updated to Resolved" |
| 5 | Verify badge | Green "RESOLVED" badge |
| 6 | Click again | Cycles back to "Active" |

### TC-2.3.3: Needs Action Count
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View stats bar at top of Encounter Logs | Three stat cards visible |
| 2 | Check "Needs Action" count | Shows count of notes with `requires_action` status |
| 3 | Update a note to "Needs Action" | Count increments |

---

## 🧪 Test Suite 5: Note Archival (Story 3.1)

### TC-3.1.1: Archive a Note
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find active note in Encounter Logs | Archive button visible |
| 2 | Click "Archive" button | Toast: "Note archived" |
| 3 | Verify note disappears | Note removed from list |
| 4 | Check "Archived" count | Incremented by 1 |

### TC-3.1.2: Show Archived Toggle
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate "Show Archived" button in filter bar | Button visible |
| 2 | Click toggle | Button changes to active state |
| 3 | Verify archived notes appear | Notes shown with grayed-out styling |
| 4 | Verify archive indicator | Left border stripe shows archived status |

### TC-3.1.3: Restore Archived Note
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable "Show Archived" toggle | Archived notes visible |
| 2 | Find archived note | "Restore" button visible |
| 3 | Click "Restore" | Toast: "Note restored" |
| 4 | Disable "Show Archived" | Note now appears in active list |

---

## 🧪 Test Suite 6: Follow-Up Scheduling (Story 2.1)

### TC-2.1.1: Follow-Up Toggle in Quick Note
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Quick Note modal | Modal visible |
| 2 | Scroll to toggles section | Two toggles: Rapid-Fire, Schedule Follow-Up |
| 3 | Toggle "Schedule Follow-Up" ON | Toggle turns green |
| 4 | Verify date/time picker appears | Date input and time dropdown visible |

### TC-2.1.2: Follow-Up Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable "Schedule Follow-Up" | Picker visible |
| 2 | Leave date empty | -- |
| 3 | Fill in patient ID and content | -- |
| 4 | Click "Save Note" | Error: "Please select a follow-up date" |

### TC-2.1.3: Complete Follow-Up Submission
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable "Schedule Follow-Up" | Picker visible |
| 2 | Select date: tomorrow | Date set |
| 3 | Select time: 10:00 | Time set |
| 4 | Fill patient ID and note content | Form complete |
| 5 | Click "Save Note" | Toast: "Note saved with follow-up scheduled for [DATE] at 10:00" |
| 6 | Verify category auto-set | Note created with `category: 'follow_up'` |

### TC-2.1.4: Follow-Up Link Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | After saving with follow-up | Note created |
| 2 | Check localStorage or API | Note has `follow_up_appointment_id` set |

---

## 🧪 Test Suite 7: Integration Tests

### TC-INT-1: Full Note Lifecycle
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create note with "Urgent" category | Note saved |
| 2 | Navigate to Encounter Logs | Note visible with urgent badge |
| 3 | Update status to "Needs Action" | Status updates |
| 4 | Archive the note | Note disappears |
| 5 | Enable "Show Archived" | Note visible, grayed |
| 6 | Restore note | Note active again |

### TC-INT-2: Mobile Full Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable mobile viewport | Mobile view |
| 2 | Open Quick Note (bottom-sheet) | Sheet slides up |
| 3 | Use dictation button | Speech recognition activates |
| 4 | Speak note content | Text appears |
| 5 | Enable follow-up scheduling | Picker shows |
| 6 | Save note | Success toast |
| 7 | Swipe modal down | Modal dismisses |

---

## 🔍 Regression Checklist

- [ ] Provider Dashboard loads without errors
- [ ] Member Dashboard loads without errors
- [ ] Theme toggle (light/dark) works
- [ ] Navigation between views works
- [ ] Appointment booking still functions
- [ ] Login/logout flow intact
- [ ] PWA offline capabilities work

---

## 🐛 Known Issues

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| KI-001 | Bundle size warning (514KB) | Low | Backlog |
| KI-002 | Dashboard widget "Needs Action" highlight pending | Low | Sprint 9 |

---

## 📊 Test Results Summary

| Test Suite | Total | Passed | Failed | Skipped |
|------------|-------|--------|--------|---------|
| Device Detection | 3 | -- | -- | -- |
| Mobile Modal | 3 | -- | -- | -- |
| Note Categories | 2 | -- | -- | -- |
| Status Toggle | 3 | -- | -- | -- |
| Archival | 3 | -- | -- | -- |
| Follow-Up | 4 | -- | -- | -- |
| Integration | 2 | -- | -- | -- |
| **TOTAL** | **20** | -- | -- | -- |

---

**Test Run Date:** _______________  
**Tester:** _______________  
**Build Version:** 2.0.0-beta  
**Sign-off:** _______________
