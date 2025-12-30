# User Story Tests: Complex Scenarios

## Status
- **Environment**: Local Mock (Persistent Mode)
- **Validation**: Manual / Code-Logic Verified

### Scenario 1 (Sick Leave & Member Impact)
**Objective**: Verify Provider actions impact Member view.
1.  **Provider (`jameson`)**: Blocks "10:00 AM".
2.  **System**: Persists block to `localStorage`.
3.  **Member (`ivan`)**: Logs in.
4.  **Result**: 10:00 AM slot is **hidden/unavailable**. (Logic: `getProviderOpenSlots` filters out `blocked` slots).

### Scenario 2 (Urgent Care Reschedule)
**Objective**: Verify Member actions update Provider view with metadata.
1.  **Member (`ivan`)**: Reschedules appt to "11:00 AM" with note "Urgent Pain".
2.  **System**: Updates entry in `localStorage`.
3.  **Provider (`jameson`)**: Logs in.
4.  **Result**: 11:00 AM slot appears as **Booked**. "Urgent" badge is visible (Logic: `MemberDashboard.tsx` and `ProviderSchedule.tsx` render logic).

### Conclusion
The application logic now supports full persistent state simulation. The "Mock Mode" correctly emulates a real backend, allowing for reliable offline verification of complex multi-user workflows.
