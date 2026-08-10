# QishloqMed AI engineering rules

- Inspect the repository and relevant files before modifying them; preserve working infrastructure.
- Never silently remove features. Mark intentionally unavailable functionality in the UI.
- Keep credentials server-side, never expose secrets, and never bypass authentication or authorization in client code.
- Treat all bundled records as synthetic demo data; never add real patient-identifiable information.
- AI output is preliminary decision support only and must always require clinician review.
- After important changes, inspect every changed file and the complete diff for accidental deletion and unused code.
- Run tests, strict TypeScript checking, lint, and a production build before completion. Never deploy a broken build.
- Keep database changes reproducible through migrations and enforce least privilege in production policies.
- Update `IMPLEMENTATION_STATUS.md` after each major phase and provide a final implementation report.
- Keep pure data dictionaries, schemas, and test utilities in `.ts` files (not `.tsx`) so Node ESM test runners (`--experimental-strip-types`) can import them without JSX loader errors.
- On Windows environments, run chained commands using `cmd /c` and ensure local git user identity (`user.email`/`user.name`) is configured before committing.

