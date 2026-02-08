# Project Vector - High-Level Architecture

## Overview
Project Vector is a modern, enterprise-grade healthcare portal designed for high-security environments. It features a cinematic user experience, PWA capabilities, and a robust role-based access control system.

## Tech Stack
- **Frontend**: React 19, TypeScript 5, Vite 7
- **Styling**: Tailwind CSS 3 (utility-first)
- **Backend**: Supabase (PostgreSQL, Auth, RPCs)
- **State Management**: React Context (Auth, Theme, Onboarding)
- **Icons**: Lucide React
- **Time/Dates**: date-fns

## Key Design Patterns

### 1. Dual-Mode API (Mock vs. Real)
The application implements a "Dual Mode" strategy in `src/lib/api.ts` (and its modular friends in `src/lib/api/`):
- **Mock Mode**: Enabled when `VITE_SUPABASE_URL` is missing or `IS_MOCK` is forced. Uses an in-memory `mockStore` that persists to `localStorage`.
- **Real Mode**: Connects to Supabase production environment.
- **Auto-Automation**: The mock store includes logic to automatically detect no-shows and complete past appointments on load, simulating a living system.

### 2. Operational Role-Based Routing
Access is governed by the `AuthContext` and enforced at the routing level.
- **Admin**: "Mission Control" - System-wide monitoring and user provisioning.
- **Provider**: "Clinical Node" - Schedule management and patient documentation.
- **Member**: "Patient Portal" - Token-based booking and resource access.

### 3. Tactical UI Component Library
Optimized for high-density information and touch interfaces:
- **Button/Input**: Primitive components with custom glow and focus states.
- **Badge**: Status management (Confirmed, Blocked, Urgent).
- **TacticalPinField**: A specialized component for 4-digit security PINs.

### 4. PWA & Service Worker
The application uses `vite-plugin-pwa` to provide:
- **Offline Mode**: Core assets are cached for offline access.
- **Background Sync**: (Planned) To handle documentation sync in low-connectivity areas.
- **Installability**: Provides an app-like experience on mobile devices.

## Performance Strategies
- **Code Splitting**: Routes are lazily loaded via `React.lazy` and `Suspense`.
- **Bundle Optimization**: Minification and chunking to keep core modules responsive.
- **Optimistic UI**: (Implementation in progress) Ensuring interactions feel instantaneous.

## Security Controls
- **Token-Alias Auth**: Patients authenticate via physical token aliases, minimizing email exposure.
- **Tactical PIN**: An additional security layer (4-digit PIN) required for dashboard access.
- **Audit Logging**: All critical actions (logins, bookings, clinical notes) are logged.
