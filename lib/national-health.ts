export interface NationalHealthAdapter{readonly id:string;publishEncounter(reference:{patientToken:string;encounterId:string}):Promise<{status:"accepted"|"unavailable"}>}
export class NoopNationalHealthAdapter implements NationalHealthAdapter{readonly id="noop-national-health";async publishEncounter(){return{status:"unavailable" as const}}}
