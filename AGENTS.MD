# AGENTS.md

## Start here

- Read [docs/DECISIONS.MD](docs/DECISIONS.MD) before changing behavior or tests. Accepted decisions are authoritative when other project documentation is less specific.
- Inspect the working tree before editing and preserve unrelated user changes.
- Keep changes focused on the requested task and verify them with the narrowest relevant checks.

## Project map

- `src/` contains the React and TypeScript application.
- `src/test/` contains Vitest and Testing Library tests.
- `e2e/` contains Playwright tests.
- `playwright.config.ts` runs Playwright tests in both the `desktop` and `mobile` modes. Modes are defined as projects in `playwright.config.ts`.

## Common checks

- `npm run lint` — lint the repository.
- `npm test` — run Vitest tests.
- `npm run test:e2e` — run Playwright tests in every configured `project`.
- `npm run test:e2e:list` — list the Playwright tests and their projects without running them.

## Testing guidance

- Prefer accessible roles, names, and labels for UI queries.
- Do not set the viewport inside individual Playwright tests unless a test specifically needs to change it temporarily; viewport coverage belongs in the configured Playwright projects.
