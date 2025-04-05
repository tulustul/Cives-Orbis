# Cives Orbis Development Guide

- Don't run any code linting.

## Build Commands

- Run development server: `npm run dev`
- Build project: `npm run build`
- Lint code: `npm run lint`
- Run tests: `vitest run [filepath]` (e.g., `vitest run src/core/combat.spec.ts`)

## Code Style Guidelines

- Use TypeScript with strict mode enabled
- Path aliases: Use `@/` prefix for imports (e.g., `import { Game } from "@/core/game"`)
- React: Use functional components with hooks
- State management: RxJS for game state, Zustand for UI state
- File naming: lowercase-hyphen for utilities, PascalCase for components
- CSS: Use tailwind
- Prefer async/await over raw promises
- Create tests for core game logic in .spec.ts files
- Always use curly braces, even for single line expressions
- Ignore backward compatibility completely
- For core, try to extract game logic into separate classes and files
