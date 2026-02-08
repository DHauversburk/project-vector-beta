# Contributing to Project Vector

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## Branching & Workflow
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Follow the **Tactical UI** design language (Dark themes, glow effects, high contrast).
3. Document all new components and functions with JSDoc.
4. Run `npm run build` to verify no regression in bundle size or types.

## Pull Request Guidelines
- Include screenshots for UI changes.
- Ensure all TypeScript errors are resolved.
- Update `BETA_2_ROADMAP.md` if milestones are reached.

## Coding Standards
- **Imports**: Use type-only imports for TS interfaces (`import type { ... }`).
- **Styles**: Use Tailwind utility classes. Avoid custom CSS unless necessary for complex animations.
- **API**: Add new functionality to `src/lib/api/` and re-export via `src/lib/api.ts`.
- **Testing**: Add unit tests for critical utility logic in `src/lib/utils/`.
