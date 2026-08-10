# Implementation status

## Competition-ready demo capabilities

- Role-specific workspaces for mobile nurses, central specialists, and dispatchers.
- Conventional demo credentials plus role shortcuts backed by HttpOnly, SameSite cookies and server route guards. No ChatGPT authentication is used.
- Durable IndexedDB intake queue with local identifiers, idempotency keys, explicit states, retries, duplicate-safe patient writes, and reload persistence.
- Seven-step controlled intake form with consent enforcement, validation, unit-labelled vitals, repeatable laboratory rows, safe image checks, review, and offline submission.
- Authenticated demo synchronization endpoints for metadata and JPEG/PNG binaries. Failures remain visible and retryable; deterministic receipts prevent duplicate acknowledgements.
- Eight fictional cases, emergency-first triage, explained priority, evidence-first specialist review, separate AI/clinician text, and durable browser-local clinician decisions/referrals.
- Dispatcher view reflects clinician-created referrals while hiding detailed clinical evidence.
- PWA manifest and public offline fallback. Clinical HTML documents and API responses are not service-worker cached.
- D1/R2 schema foundation, FHIR mapping, DICOM roadmap, replaceable AI and national-integration boundaries, audit helper, role authorization helper, and identifier minimization.

## Intentionally demo-only

- Sync receipts are validated by the server but are not yet committed to D1 transactions or R2 object storage.
- Clinical actions persist in browser-local IndexedDB, not the hosted database.
- Demo credentials and role shortcuts are public because all data is synthetic. Production must disable them and use Supabase Auth or an equivalent identity provider with RLS.
- Uzbek/English selection changes live connection labels; the complete string catalog is not yet translated.

## Required before any real clinical pilot

- Production identity, clinic-scoped authorization, RLS/IDOR tests, session revocation, and MFA policy.
- D1 or Postgres transactional sync, private R2/Supabase Storage writes, signed reads, resumable upload, server MIME sniffing, malware scanning, and retention policy.
- Real AI provider adapter with evaluation, monitoring, prompt-injection controls, model governance, and human-override audit trails.
- DICOM/PACS integration, approved national integrations, push notifications, accessibility audit, clinical validation, cybersecurity assessment, privacy review, incident response, and regulatory approval.

## Verification completed on 10 August 2026

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test:unit` — 6/6 passed.
- `npm test` — production build passed and 7/7 tests passed.
- `git diff --check` — passed.
- Live browser: server role denial, conventional sign-in, controlled edits across wizard steps, offline save, reload persistence, duplicate-safe resubmission, authenticated sync to zero pending, durable clinician referral after reload, dispatcher handoff, and zero console warnings/errors.
- Responsive checks at 390, 820, and 1440 CSS pixels found no horizontal document overflow.

## Deployment boundary

The repository is ready to push for review. It was not auto-deployed because the project specification explicitly reserves deployment as a manual action.

## Next engineering step

Connect the authenticated queue endpoints to D1 transactions and private R2 storage, then add integration tests that prove idempotency, clinic isolation, failure recovery, and signed diagnostic access.
