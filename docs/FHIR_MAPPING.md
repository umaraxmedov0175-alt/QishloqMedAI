# FHIR-ready mapping

The prototype is not a FHIR server. `lib/fhir-mapping.ts` documents future mappings for Patient, Encounter, Observation, DiagnosticReport/DocumentReference, Practitioner, and Organization. Application UUIDs become resource identifiers; storage paths must be replaced with authenticated attachment references. Profiles, terminology validation, consent, provenance, and jurisdiction-specific requirements remain pilot work.
