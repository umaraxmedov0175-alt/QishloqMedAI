# Security and threat checklist

Implemented foundations:

- Direct identifiers are stripped by `buildClinicalCase()` / `minimizeForAi()` before provider use.
- Role guards separate nurse clinic writes, clinician review, dispatcher logistics, and administration.
- Diagnostic objects use private storage paths; the UI never claims a pending image is available.
- Client and demo-server checks limit diagnostic assets to JPEG/PNG and 10 MB. These are basic checks, not content sniffing, malware scanning, or radiology validation.
- `/api` responses are excluded from service-worker caching.
- Idempotency keys and deterministic server receipts prevent duplicate demo synchronization acknowledgments.
- Protected workspace layouts enforce the expected HttpOnly demo role on the server; sync endpoints independently require the mobile-nurse role.
- Clinically meaningful transitions have a fail-visible `recordAuditEvent()` boundary.
- Secrets remain server-side environment variables; analytics receives no health data by default.

Required before a pilot:

- Supabase Auth or equivalent production sessions, MFA/session-revocation policy, and demo shortcuts disabled.
- RLS/authorization tests preventing cross-clinic access and insecure direct object references.
- Private bucket policies, signed access, server MIME sniffing, malware scanning, file-size limits, and resumable upload.
- Prompt-injection isolation for uploaded text and no raw prompt logging.
- Append-only/externally protected audit storage and session-revocation controls.
- Cybersecurity, privacy, incident-response, legal, and regulatory assessment.

Threats explicitly tracked: unauthorized patient access, diagnostic-image leakage, exposed keys, cross-clinic leakage, IDOR, malicious/oversized uploads, prompt injection, audit manipulation, and session misuse.
