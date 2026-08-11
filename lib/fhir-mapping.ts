export const fhirMapping = {
  patient: {
    id: "Patient.identifier",
    patientCode: "Patient.identifier",
    sex: "Patient.gender",
    dateOfBirth: "Patient.birthDate",
  },
  encounter: {
    id: "Encounter.identifier",
    patientId: "Encounter.subject",
    clinicId: "Encounter.serviceProvider",
    status: "Encounter.status",
  },
  vitals: {
    encounterId: "Observation.encounter",
    oxygenSaturation: "Observation.valueQuantity",
    heartRate: "Observation.valueQuantity",
  },
  labResults: {
    testName: "Observation.code",
    resultValue: "Observation.valueQuantity",
  },
  diagnosticAssets: {
    storagePath: "DocumentReference.content.attachment.url",
  },
  profiles: {
    id: "Practitioner.identifier",
  },
  organizations: {
    id: "Organization.identifier",
  },
} as const;

export interface FhirCaseInput {
  caseCode: string;
  patientName: string;
  age: number;
  sex: string;
  village: string;
  chiefComplaint: string;
  symptoms: string;
  triage: string;
  vitals: { label: string; value: string }[];
  referral?: {
    facility: string;
    specialty: string;
    urgency: string;
  };
}

export function generateFhirR4Bundle(input: FhirCaseInput) {
  const patientId = `patient-${input.caseCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const encounterId = `encounter-${input.caseCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  const genderMap: Record<string, string> = {
    Ayol: "female",
    Erkak: "male",
    Female: "female",
    Male: "male",
  };

  const bundle = {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: "Patient",
          id: patientId,
          identifier: [
            {
              system: "https://tomir.uz/identifiers/patient-code",
              value: input.caseCode,
            },
          ],
          name: [
            {
              text: input.patientName,
            },
          ],
          gender: genderMap[input.sex] || "unknown",
          address: [
            {
              text: input.village,
              country: "Uzbekistan",
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:${encounterId}`,
        resource: {
          resourceType: "Encounter",
          id: encounterId,
          status: "in-progress",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory",
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          reasonCode: [
            {
              text: input.chiefComplaint,
            },
          ],
          priority: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
                code: input.triage.toUpperCase(),
              },
            ],
          },
        },
      },
      ...input.vitals.map((v, idx) => ({
        fullUrl: `urn:uuid:observation-${idx + 1}`,
        resource: {
          resourceType: "Observation",
          id: `obs-${idx + 1}`,
          status: "final",
          code: {
            text: v.label,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          encounter: {
            reference: `Encounter/${encounterId}`,
          },
          valueString: v.value,
        },
      })),
      ...(input.referral
        ? [
            {
              fullUrl: `urn:uuid:servicerequest-referral`,
              resource: {
                resourceType: "ServiceRequest",
                id: "referral-1",
                status: "active",
                intent: "order",
                priority: input.referral.urgency,
                subject: {
                  reference: `Patient/${patientId}`,
                },
                performer: [
                  {
                    display: input.referral.facility,
                  },
                ],
                category: [
                  {
                    text: input.referral.specialty,
                  },
                ],
              },
            },
          ]
        : []),
    ],
  };

  return bundle;
}

export function downloadFhirJson(input: FhirCaseInput) {
  const bundle = generateFhirR4Bundle(input);
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FHIR_${input.caseCode}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
