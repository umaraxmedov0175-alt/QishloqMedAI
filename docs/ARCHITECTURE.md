# Architecture

The hackathon prototype uses a Vinext/React interface with strict TypeScript, a server-side clinical-provider boundary, Cloudflare D1 for relational records, and a private R2 binding for diagnostic files. The deterministic demo currently operates in the browser so judges can complete intake → preliminary assessment → clinician review → referral without credentials. Production writes must move behind authenticated server routes using `db/index.ts`.

The provider boundary is `ClinicalAnalysisProvider`. All responses pass `ClinicalAssessmentSchema`, request data is minimized, duplicate generation is prevented by a unique request ID, and `requiresHumanReview` is forced to `true`.

Seed identities represent `QishloqMed Mobile Clinic Network`, `Mobile Clinic 01 - Samarqand Region`, and `Tashkent Central Review Center`. Demo records are synthetic and deterministic.
