# Architecture

The hackathon prototype uses Vinext/React with strict TypeScript, a server-side clinical-provider boundary, Cloudflare D1 for relational records, and private R2 diagnostic storage. A conventional email/password demo gate lets judges complete intake, preliminary assessment, clinician review, and referral without external credentials. Production uses Supabase Auth behind authenticated server routes; the demo gate is never a production authorization boundary.

`ClinicalAnalysisProvider` isolates model vendors. All responses pass `ClinicalAssessmentSchema`, request data is minimized, duplicate generation is prevented by request ID, and `requiresHumanReview` is forced to true.

Seed identities represent Tomir Mobile Clinic Network, Mobile Clinic 01 - Samarqand Region, and Tashkent Central Review Center. All demo records are synthetic.
