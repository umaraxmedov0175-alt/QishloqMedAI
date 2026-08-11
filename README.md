# Tomir AI

Tomir AI is an offline-first mobile diagnostic coordination prototype for remote communities in Uzbekistan. Mobile nurses capture encounters during unreliable connectivity, synchronize them idempotently, and send evidence to a central specialist queue where AI remains preliminary decision support and clinicians make final decisions.

> Medical-use disclaimer: this is synthetic hackathon software, not a licensed medical device and not for clinical use. Production use requires clinical validation, legal and regulatory review, cybersecurity assessment, data-governance approval, specialist oversight, training, and incident response.

## Roles and workflows

- Mobile nurse (`/mobile`): seven-step controlled intake, consent enforcement, unit-labelled vitals, repeatable laboratory rows, diagnostic checks, durable IndexedDB queue, and authenticated demo synchronization.
- Central clinician (`/central`): emergency-first queue, evidence-first split review, original AI vs clinician-final comparison, durable local decisions, additional-information request, and referral action.
- Dispatcher (`/operations`): clinician-created referral handoff, route status, fleet state, and synthetic aggregate metrics without unnecessary clinical details.
- Landing (`/`): conventional demo login and controlled role shortcuts using HttpOnly demo sessions. Production role shortcuts must remain disabled.

## Architecture

- Vinext, React 19, strict TypeScript, Tailwind-compatible CSS
- Cloudflare D1 schema and reproducible Drizzle migrations
- Private R2 binding for diagnostic assets
- IndexedDB field queue; API responses are not blindly cached
- Zod-validated `ClinicalAssessmentSchema` and replaceable `ClinicalAnalysisProvider`
- Server-oriented case assembler, role guards, audit helper, FHIR mapping, DICOM and national-integration boundaries
- Installable PWA shell that caches static assets and a public offline fallback, never clinical HTML or `/api` responses

## Local setup

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The public demo login is `tomir@tomir.demo` / `demo2026`; all records are synthetic. Protected workspaces require a server-issued role session.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit actual values.

- `DEMO_MODE`: deterministic credential-free workflow
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: future Supabase Auth/Postgres/Storage adapter
- `AI_PROVIDER`, `AI_API_KEY`: server-side real-provider adapter

The current hosted runtime uses D1/R2 logical bindings. Supabase production integration is not enabled until credentials, RLS policies, and authorization tests are supplied.

## Data and integrations

Generate migrations with `npm run db:generate`. The seed cases include eight fictional workflows and golden case `QM-2027-0042`. `docs/FHIR_MAPPING.md` maps core resources; `docs/DICOM_ROADMAP.md` covers DICOMweb/PACS evolution. `NationalHealthAdapter` defaults to a no-op and makes no claim of official government integration.

## Quality gates

```bash
npm run typecheck
npm run lint
npm run test:unit
npm test
npm run build
```

## Demo in 2–4 minutes

1. Sign in as Mobile Nurse, load the golden case, simulate offline, and submit it.
2. Show the durable pending queue, restore connectivity, and synchronize.
3. Open Specialist view; show priority rationale and original evidence before AI.
4. Edit the clinician summary and create a referral.
5. Open Operations to show the logistics-only referral and aggregate view.

## Security notes

Diagnostic storage must remain private; generated paths replace user filenames. The demo server authenticates the nurse role and rechecks file type and size, but does not yet persist objects to R2. Production routes must also enforce clinic scope, sniff content, scan uploads, and write immutable audit events. See `docs/SECURITY.md` and `IMPLEMENTATION_STATUS.md` for current boundaries.

## Screenshots

Browser QA covers mobile, tablet, and desktop breakpoints; capture publication screenshots only after the final manual deployment.
