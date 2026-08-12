export type BodyRegionId =
  | "head"
  | "face"
  | "neck"
  | "shoulder_left"
  | "shoulder_right"
  | "chest_left"
  | "chest_right"
  | "abdomen_upper"
  | "abdomen_lower"
  | "back_upper"
  | "back_lower"
  | "arm_upper_left"
  | "arm_upper_right"
  | "elbow_left"
  | "elbow_right"
  | "forearm_left"
  | "forearm_right"
  | "hand_left"
  | "hand_right"
  | "hip_left"
  | "hip_right"
  | "groin"
  | "thigh_left"
  | "thigh_right"
  | "knee_left"
  | "knee_right"
  | "shin_left"
  | "shin_right"
  | "foot_left"
  | "foot_right";

export interface BodyRegion {
  id: BodyRegionId;
  meshName: string;
  label: { uz: string; ru: string; en: string };
  side: "left" | "right" | "center";
  view: "front" | "back" | "both";
  icd11Hint?: string;
}

export const BODY_REGIONS: Record<BodyRegionId, BodyRegion> = {
  head: {
    id: "head",
    meshName: "head_mesh",
    label: { uz: "Bosh va Miya", ru: "Голова и мозг", en: "Head & Brain" },
    side: "center",
    view: "both",
    icd11Hint: "MB23.0 - Headache / Neurological",
  },
  face: {
    id: "face",
    meshName: "face_mesh",
    label: { uz: "Yuz va Jag'", ru: "Лицо и челюсть", en: "Face & Jaw" },
    side: "center",
    view: "front",
    icd11Hint: "DA01 - Maxillofacial / ENT",
  },
  neck: {
    id: "neck",
    meshName: "neck_mesh",
    label: { uz: "Bo'yin va Tomoq", ru: "Шея и горло", en: "Neck & Throat" },
    side: "center",
    view: "both",
    icd11Hint: "CA00 - ENT / Cervical",
  },
  shoulder_left: {
    id: "shoulder_left",
    meshName: "shoulder_l_mesh",
    label: { uz: "Chap Yelka", ru: "Левое плечо", en: "Left Shoulder" },
    side: "left",
    view: "both",
    icd11Hint: "FA00 - Shoulder Girdle",
  },
  shoulder_right: {
    id: "shoulder_right",
    meshName: "shoulder_r_mesh",
    label: { uz: "O'ng Yelka", ru: "Правое плечо", en: "Right Shoulder" },
    side: "right",
    view: "both",
    icd11Hint: "FA00 - Shoulder Girdle",
  },
  chest_left: {
    id: "chest_left",
    meshName: "chest_l_mesh",
    label: { uz: "Chap Ko'krak (Yurak / O'pka)", ru: "Левая грудь (Сердце / Легкое)", en: "Left Chest (Heart / Lung)" },
    side: "left",
    view: "front",
    icd11Hint: "BC00 - Acute Coronary / Respiratory",
  },
  chest_right: {
    id: "chest_right",
    meshName: "chest_r_mesh",
    label: { uz: "O'ng Ko'krak (O'pka)", ru: "Правая грудь (Легкое)", en: "Right Chest (Lung)" },
    side: "right",
    view: "front",
    icd11Hint: "CA20 - Pulmonary / Thoracic",
  },
  abdomen_upper: {
    id: "abdomen_upper",
    meshName: "abdomen_u_mesh",
    label: { uz: "Qorinning Yuqori Qismi (Oshqozon / Jig'ildoq)", ru: "Верхняя часть живота (Желудок)", en: "Upper Abdomen (Gastric)" },
    side: "center",
    view: "front",
    icd11Hint: "DA20 - Epigastric / Hepatic",
  },
  abdomen_lower: {
    id: "abdomen_lower",
    meshName: "abdomen_l_mesh",
    label: { uz: "Qorinning Pastki Qismi (Ichaklar / Appendiks)", ru: "Нижняя часть живота (Кишечник)", en: "Lower Abdomen (GI / Appendix)" },
    side: "center",
    view: "front",
    icd11Hint: "DB10 - Appendicitis / Acute Abdomen",
  },
  back_upper: {
    id: "back_upper",
    meshName: "back_u_mesh",
    label: { uz: "Yuqori Orqa (Umurtqa va Kurak)", ru: "Верхняя часть спины (Позвоночник)", en: "Upper Back (Spine)" },
    side: "center",
    view: "back",
    icd11Hint: "FA20 - Thoracic Spine",
  },
  back_lower: {
    id: "back_lower",
    meshName: "back_l_mesh",
    label: { uz: "Beli (Buyraklar va Bel)", ru: "Поясница (Почки и поясница)", en: "Lower Back (Lumbar / Kidneys)" },
    side: "center",
    view: "back",
    icd11Hint: "GB00 - Nephrological / Lumbar Pain",
  },
  arm_upper_left: {
    id: "arm_upper_left",
    meshName: "arm_u_l_mesh",
    label: { uz: "Chap Yuqori Qo'l", ru: "Левое плечо (рука)", en: "Left Upper Arm" },
    side: "left",
    view: "both",
    icd11Hint: "FB00 - Upper Arm",
  },
  arm_upper_right: {
    id: "arm_upper_right",
    meshName: "arm_u_r_mesh",
    label: { uz: "O'ng Yuqori Qo'l", ru: "Правое плечо (рука)", en: "Right Upper Arm" },
    side: "right",
    view: "both",
    icd11Hint: "FB00 - Upper Arm",
  },
  elbow_left: {
    id: "elbow_left",
    meshName: "elbow_l_mesh",
    label: { uz: "Chap Tirsak", ru: "Левый локоть", en: "Left Elbow" },
    side: "left",
    view: "both",
    icd11Hint: "FB10 - Elbow Joint",
  },
  elbow_right: {
    id: "elbow_right",
    meshName: "elbow_r_mesh",
    label: { uz: "O'ng Tirsak", ru: "Правый локоть", en: "Right Elbow" },
    side: "right",
    view: "both",
    icd11Hint: "FB10 - Elbow Joint",
  },
  forearm_left: {
    id: "forearm_left",
    meshName: "forearm_l_mesh",
    label: { uz: "Chap Bilak", ru: "Левое предплечье", en: "Left Forearm" },
    side: "left",
    view: "both",
    icd11Hint: "FB20 - Forearm",
  },
  forearm_right: {
    id: "forearm_right",
    meshName: "forearm_r_mesh",
    label: { uz: "O'ng Bilak", ru: "Правое предплечье", en: "Right Forearm" },
    side: "right",
    view: "both",
    icd11Hint: "FB20 - Forearm",
  },
  hand_left: {
    id: "hand_left",
    meshName: "hand_l_mesh",
    label: { uz: "Chap Qo'l Panjasi", ru: "Левая кисть", en: "Left Hand" },
    side: "left",
    view: "both",
    icd11Hint: "FB30 - Hand & Wrist",
  },
  hand_right: {
    id: "hand_right",
    meshName: "hand_r_mesh",
    label: { uz: "O'ng Qo'l Panjasi", ru: "Правая кисть", en: "Right Hand" },
    side: "right",
    view: "both",
    icd11Hint: "FB30 - Hand & Wrist",
  },
  hip_left: {
    id: "hip_left",
    meshName: "hip_l_mesh",
    label: { uz: "Chap Tos Bo'g'imi", ru: "Левый тазобедренный сустав", en: "Left Hip" },
    side: "left",
    view: "both",
    icd11Hint: "FC00 - Hip Joint",
  },
  hip_right: {
    id: "hip_right",
    meshName: "hip_r_mesh",
    label: { uz: "O'ng Tos Bo'g'imi", ru: "Правый тазобедренный сустав", en: "Right Hip" },
    side: "right",
    view: "both",
    icd11Hint: "FC00 - Hip Joint",
  },
  groin: {
    id: "groin",
    meshName: "groin_mesh",
    label: { uz: "Chot Sohasining Qismi", ru: "Паховая область", en: "Groin Area" },
    side: "center",
    view: "front",
    icd11Hint: "GA00 - Inguinal / Pelvic",
  },
  thigh_left: {
    id: "thigh_left",
    meshName: "thigh_l_mesh",
    label: { uz: "Chap Son", ru: "Левое бедро", en: "Left Thigh" },
    side: "left",
    view: "both",
    icd11Hint: "FC10 - Femoral Region",
  },
  thigh_right: {
    id: "thigh_right",
    meshName: "thigh_r_mesh",
    label: { uz: "O'ng Son", ru: "Правое бедро", en: "Right Thigh" },
    side: "right",
    view: "both",
    icd11Hint: "FC10 - Femoral Region",
  },
  knee_left: {
    id: "knee_left",
    meshName: "knee_l_mesh",
    label: { uz: "Chap Tizda", ru: "Левое колено", en: "Left Knee" },
    side: "left",
    view: "both",
    icd11Hint: "FC20 - Knee Joint",
  },
  knee_right: {
    id: "knee_right",
    meshName: "knee_r_mesh",
    label: { uz: "O'ng Tizda", ru: "Правое колено", en: "Right Knee" },
    side: "right",
    view: "both",
    icd11Hint: "FC20 - Knee Joint",
  },
  shin_left: {
    id: "shin_left",
    meshName: "shin_l_mesh",
    label: { uz: "Chap Boldiq", ru: "Левая голень", en: "Left Shin / Calf" },
    side: "left",
    view: "both",
    icd11Hint: "FC30 - Lower Leg",
  },
  shin_right: {
    id: "shin_right",
    meshName: "shin_r_mesh",
    label: { uz: "O'ng Boldiq", ru: "Правая голень", en: "Right Shin / Calf" },
    side: "right",
    view: "both",
    icd11Hint: "FC30 - Lower Leg",
  },
  foot_left: {
    id: "foot_left",
    meshName: "foot_l_mesh",
    label: { uz: "Chap Oyoq Kafti", ru: "Левая стопа", en: "Left Foot" },
    side: "left",
    view: "both",
    icd11Hint: "FC40 - Ankle & Foot",
  },
  foot_right: {
    id: "foot_right",
    meshName: "foot_r_mesh",
    label: { uz: "O'ng Oyoq Kafti", ru: "Правая стопа", en: "Right Foot" },
    side: "right",
    view: "both",
    icd11Hint: "FC40 - Ankle & Foot",
  },
};

const MESH_NAME_TO_REGION_MAP: Record<string, BodyRegionId> = Object.values(BODY_REGIONS).reduce(
  (acc, r) => {
    acc[r.meshName.toLowerCase()] = r.id;
    acc[r.id.toLowerCase()] = r.id;
    return acc;
  },
  {} as Record<string, BodyRegionId>
);

export function getRegionByMeshName(name: string): BodyRegion | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  
  // 1. Direct match
  if (MESH_NAME_TO_REGION_MAP[clean]) {
    return BODY_REGIONS[MESH_NAME_TO_REGION_MAP[clean]];
  }

  // 2. Partial match heuristics for GLTF / OBJ mesh names
  for (const region of Object.values(BODY_REGIONS)) {
    if (
      clean.includes(region.id.toLowerCase()) ||
      clean.includes(region.meshName.toLowerCase())
    ) {
      return region;
    }
  }

  if (clean.includes("male") || clean.includes("body") || clean.includes("lambert")) {
    return BODY_REGIONS.chest_left;
  }

  return null;
}
