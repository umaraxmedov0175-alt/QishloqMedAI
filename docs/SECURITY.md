# Security

- Production identity uses server-validated authentication. Client UI never grants authorization.
- D1 authorization must apply least privilege by role and clinic; dispatcher views exclude unnecessary clinical detail.
- Diagnostic assets belong in the private `DIAGNOSTIC_ASSETS` R2 binding, addressed by storage path and served only through short-lived authenticated access.
- AI and service credentials are server-only environment variables. `.env.example` contains names, never values.
- AI submissions omit names, phones, national identifiers, and unrelated context.
- Audit records contain identifiers and actions, never file bodies or secrets.
- Before production use, implement and test the equivalent of RLS policies for every patient-related server endpoint.
