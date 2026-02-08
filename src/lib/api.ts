import { mockStore } from './api/mockStore';
import { appointmentActions } from './api/appointments';
import { providerActions } from './api/providers';
import { adminActions } from './api/admin';
import { authActions } from './api/auth';
import { interactionActions } from './api/interactions';

export * from './api/types';

/**
 * PROJECT VECTOR API CLIENT (REFACTORED)
 * ------------------------------------
 * This client now uses a modular structure under src/lib/api/.
 * The 'api' object below maintains backward compatibility with the existing codebase.
 */
export const api = {
    mockStore,
    ...appointmentActions,
    ...providerActions,
    ...adminActions,
    ...authActions,
    ...interactionActions
};
