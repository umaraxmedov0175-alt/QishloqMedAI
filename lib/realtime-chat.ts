export type UserRole = "doctor" | "nurse" | "patient" | "dispatcher";
export type UserPresence = "online" | "away" | "offline";

export interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: { uz: string; en: string };
  avatarUrl?: string;
  specialtyOrDistrict: string;
  presence: UserPresence;
  lastSeen?: string;
}

export interface Attachment {
  id: string;
  type: "image" | "ecg" | "lab_sheet" | "voice_note" | "vitals_card";
  name: string;
  url: string;
  size?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  sanitizedContent: string;
  wasRedacted: boolean;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  attachment?: Attachment;
  clinicalTemplateKey?: string;
}

export interface ChatThread {
  id: string;
  type: "doctor_nurse" | "doctor_patient" | "nurse_patient";
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  patientCode?: string;
  updatedAt: string;
}

// Comprehensive RegEx pattern matching international, local Uzbekistan, spaced, hyphenated, dotted, and disguised phone numbers
const PHONE_PATTERNS: RegExp[] = [
  // International format: +998 90 123 45 67, +1-555-0199, +998901234567
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g,
  // Local Uzbekistan numbers: 90 123 45 67, 998901234567, 8 90 123 45 67
  /(?:998|8)?\s?\((?:90|91|93|94|95|97|98|99|88|50|33)\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}/g,
  // Disguised spaced digits: 9 0 1 2 3 4 5 6 7 or 9-0-1-2-3
  /\b\d(?:\s*[-.\s]*\d){6,12}\b/g,
  // Written-out digit sequences in Uzbek or English (e.g., nol to'qqiz bir / zero nine one)
  /\b(?:nol|bir|ikki|uch|to'rt|besh|oltida|yetti|sakkiz|to'qqiz|zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+|-)*(?:nol|bir|ikki|uch|to'rt|besh|oltida|yetti|sakkiz|to'qqiz|zero|one|two|three|four|five|six|seven|eight|nine){6,}\b/gi,
];

/**
 * Sanitizes chat messages by detecting phone numbers or external contact handles
 * and replacing them with [REDACTED FOR PRIVACY].
 */
export function sanitizeChatMessage(text: string): { sanitizedText: string; isRedacted: boolean } {
  if (!text) return { sanitizedText: "", isRedacted: false };

  let sanitizedText = text;
  let isRedacted = false;

  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      isRedacted = true;
      sanitizedText = sanitizedText.replace(pattern, "[REDACTED FOR PRIVACY]");
    }
  }

  // Double check strict 7+ continuous/separated digits heuristic
  const digitCleaned = text.replace(/[^0-9]/g, "");
  if (digitCleaned.length >= 7 && !isRedacted) {
    const rawMatches = text.match(/(?:\+?\d[\d\s.()-]{6,}\d)/g);
    if (rawMatches && rawMatches.length > 0) {
      isRedacted = true;
      for (const match of rawMatches) {
        sanitizedText = sanitizedText.replace(match, "[REDACTED FOR PRIVACY]");
      }
    }
  }

  return { sanitizedText, isRedacted };
}

export const SEED_USERS: Record<string, ChatUser> = {
  doctor_tomir: {
    id: "doctor_tomir",
    name: "Dr. Tomir",
    role: "doctor",
    roleTitle: { uz: "Markaziy vrach-mutaxassis", en: "Central Specialist Clinician" },
    specialtyOrDistrict: "Toshkent Tibbiyot Markazi · Kardiologiya",
    presence: "online",
  },
  nurse_malika: {
    id: "nurse_malika",
    name: "Malika Hamshira",
    role: "nurse",
    roleTitle: { uz: "Mobil klinika hamshirasi", en: "Mobile Clinic Nurse" },
    specialtyOrDistrict: "Urgut tumani · Tomir-01 Mobil klinika",
    presence: "online",
  },
  patient_tomir: {
    id: "patient_tomir",
    name: "Tomir (QM-2027-0042)",
    role: "patient",
    roleTitle: { uz: "Bemor", en: "Patient" },
    specialtyOrDistrict: "Samarqand viloyati · G'us qishlog'i",
    presence: "online",
    lastSeen: "2 min oldin",
  },
  patient_anvar: {
    id: "patient_anvar",
    name: "Anvar Rahimov (QM-2027-0039)",
    role: "patient",
    roleTitle: { uz: "Bemor", en: "Patient" },
    specialtyOrDistrict: "Payariq tumani · Chelak qishlog'i",
    presence: "away",
    lastSeen: "15 min oldin",
  },
};

const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  "thread-doc-nurse": [
    {
      id: "msg-101",
      threadId: "thread-doc-nurse",
      senderId: "nurse_malika",
      senderName: "Malika Hamshira",
      senderRole: "nurse",
      content: "Assalomu alaykum doctor. Bemor QM-2027-0042 (Tomir) vital ko'rsatkichlari sinxronlandi. SpO2 89%, pulsi 108 bpm.",
      sanitizedContent: "Assalomu alaykum doctor. Bemor QM-2027-0042 (Tomir) vital ko'rsatkichlari sinxronlandi. SpO2 89%, pulsi 108 bpm.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: "read",
    },
    {
      id: "msg-102",
      threadId: "thread-doc-nurse",
      senderId: "doctor_tomir",
      senderName: "Dr. Tomir",
      senderRole: "doctor",
      content: "Vaziyat nazoratda. Zudlik bilan kislorod berishni boshlang va takroriy EKG yozuvini yuklang.",
      sanitizedContent: "Vaziyat nazoratda. Zudlik bilan kislorod berishni boshlang va takroriy EKG yozuvini yuklang.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      status: "read",
      clinicalTemplateKey: "request_repeat_ecg",
    },
    {
      id: "msg-103",
      threadId: "thread-doc-nurse",
      senderId: "nurse_malika",
      senderName: "Malika Hamshira",
      senderRole: "nurse",
      content: "EKG yozuvi va ko'krak qafasi rentgen tasviri biriktirildi. Bemorda chap qo'lga tarqaluvchi og'riq mavjud.",
      sanitizedContent: "EKG yozuvi va ko'krak qafasi rentgen tasviri biriktirildi. Bemorda chap qo'lga tarqaluvchi og'riq mavjud.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: "read",
      attachment: {
        id: "att-001",
        type: "ecg",
        name: "EKG_EKG_QM-2027-0042.png",
        url: "/og.png",
        size: "2.4 MB",
      },
    },
  ],
  "thread-doc-patient": [
    {
      id: "msg-201",
      threadId: "thread-doc-patient",
      senderId: "doctor_tomir",
      senderName: "Dr. Tomir",
      senderRole: "doctor",
      content: "Assalomu alaykum Tomir opa. Ahamiyat bering: Toshkent markaziy kardiologiya markazidan sizning holatingizni nazorat qilyapmiz.",
      sanitizedContent: "Assalomu alaykum Tomir opa. Ahamiyat bering: Toshkent markaziy kardiologiya markazidan sizning holatingizni nazorat qilyapmiz.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "read",
    },
    {
      id: "msg-202",
      threadId: "thread-doc-patient",
      senderId: "patient_tomir",
      senderName: "Tomir (QM-2027-0042)",
      senderRole: "patient",
      content: "Rahmat shifokor. Ko'kragimda qisilish bor, lekin kislorod apparatidan keyin biroz yengillashdim.",
      sanitizedContent: "Rahmat shifokor. Ko'kragimda qisilish bor, lekin kislorod apparatidan keyin biroz yengillashdim.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: "read",
      attachment: {
        id: "att-voice-1",
        type: "voice_note",
        name: "Ovozli_xabar_01.mp3",
        url: "",
        metadata: { durationSeconds: 14 },
      },
    },
  ],
  "thread-nurse-patient": [
    {
      id: "msg-301",
      threadId: "thread-nurse-patient",
      senderId: "nurse_malika",
      senderName: "Malika Hamshira",
      senderRole: "nurse",
      content: "Anvar aka, ertaga ertalab soat 9:00 da qayta ko'rik uchun mobil klinikaga kelishingiz so'raladi.",
      sanitizedContent: "Anvar aka, ertaga ertalab soat 9:00 da qayta ko'rik uchun mobil klinikaga kelishingiz so'raladi.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      status: "read",
    },
    {
      id: "msg-302",
      threadId: "thread-nurse-patient",
      senderId: "patient_anvar",
      senderName: "Anvar Rahimov",
      senderRole: "patient",
      content: "Tushundim, rahmat! Belgilangan vaqtda boraman.",
      sanitizedContent: "Tushundim, rahmat! Belgilangan vaqtda boraman.",
      wasRedacted: false,
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      status: "read",
    },
  ],
};

export const INITIAL_THREADS: ChatThread[] = [
  {
    id: "thread-doc-nurse",
    type: "doctor_nurse",
    participants: [SEED_USERS.doctor_tomir, SEED_USERS.nurse_malika],
    patientCode: "QM-2027-0042",
    lastMessage: SEED_MESSAGES["thread-doc-nurse"][SEED_MESSAGES["thread-doc-nurse"].length - 1],
    unreadCount: { doctor_tomir: 0, nurse_malika: 0 },
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "thread-doc-patient",
    type: "doctor_patient",
    participants: [SEED_USERS.doctor_tomir, SEED_USERS.patient_tomir],
    patientCode: "QM-2027-0042",
    lastMessage: SEED_MESSAGES["thread-doc-patient"][SEED_MESSAGES["thread-doc-patient"].length - 1],
    unreadCount: { doctor_tomir: 1, patient_tomir: 0 },
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "thread-nurse-patient",
    type: "nurse_patient",
    participants: [SEED_USERS.nurse_malika, SEED_USERS.patient_anvar],
    patientCode: "QM-2027-0039",
    lastMessage: SEED_MESSAGES["thread-nurse-patient"][SEED_MESSAGES["thread-nurse-patient"].length - 1],
    unreadCount: { doctor_tomir: 0, nurse_malika: 0 },
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
];

const STORAGE_THREADS_KEY = "tomir_chat_threads_v2";
const STORAGE_MESSAGES_KEY = "tomir_chat_messages_v2";
const BROADCAST_CHAT_CHANNEL = "tomir_chat_channel";

let memoryThreads: ChatThread[] = [...INITIAL_THREADS];
let memoryMessages: Record<string, ChatMessage[]> = { ...SEED_MESSAGES };

export function getChatThreads(): ChatThread[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_THREADS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatThread[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryThreads = parsed;
        }
      }
    } catch {
      // Fallback to memory
    }
  }
  return memoryThreads;
}

export function getChatMessages(threadId: string): ChatMessage[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, ChatMessage[]>;
        if (parsed && parsed[threadId]) {
          memoryMessages[threadId] = parsed[threadId];
        }
      }
    } catch {
      // Fallback to memory
    }
  }
  return memoryMessages[threadId] || [];
}

export function saveChatState(threads: ChatThread[], messagesMap: Record<string, ChatMessage[]>): void {
  memoryThreads = threads;
  memoryMessages = messagesMap;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messagesMap));

      const bc = new BroadcastChannel(BROADCAST_CHAT_CHANNEL);
      bc.postMessage({ type: "CHAT_SYNC", threads, messagesMap });
      bc.close();
    } catch {
      // Storage/BroadcastChannel fallback
    }
  }
}

export function sendMessage(input: {
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachment?: Attachment;
  clinicalTemplateKey?: string;
}): { message: ChatMessage; wasRedacted: boolean } {
  const { sanitizedText, isRedacted } = sanitizeChatMessage(input.content);
  const now = new Date().toISOString();

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    threadId: input.threadId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    content: input.content,
    sanitizedContent: sanitizedText,
    wasRedacted: isRedacted,
    timestamp: now,
    status: "sent",
    attachment: input.attachment,
    clinicalTemplateKey: input.clinicalTemplateKey,
  };

  const currentThreads = getChatThreads();
  const currentMessages = { ...memoryMessages };

  const existingMsgs = currentMessages[input.threadId] || [];
  currentMessages[input.threadId] = [...existingMsgs, newMessage];

  const threadIndex = currentThreads.findIndex((t) => t.id === input.threadId);
  if (threadIndex !== -1) {
    const targetThread = currentThreads[threadIndex];
    const updatedUnread = { ...targetThread.unreadCount };

    // Increment unread count for other participants
    for (const p of targetThread.participants) {
      if (p.id !== input.senderId) {
        updatedUnread[p.id] = (updatedUnread[p.id] || 0) + 1;
      }
    }

    currentThreads[threadIndex] = {
      ...targetThread,
      lastMessage: newMessage,
      unreadCount: updatedUnread,
      updatedAt: now,
    };
  }

  saveChatState(currentThreads, currentMessages);
  return { message: newMessage, wasRedacted: isRedacted };
}

export function markThreadAsRead(threadId: string, userId: string): void {
  const currentThreads = getChatThreads();
  const threadIndex = currentThreads.findIndex((t) => t.id === threadId);
  if (threadIndex !== -1) {
    const target = currentThreads[threadIndex];
    if (target.unreadCount[userId] && target.unreadCount[userId] > 0) {
      const updatedUnread = { ...target.unreadCount, [userId]: 0 };
      currentThreads[threadIndex] = { ...target, unreadCount: updatedUnread };

      // Mark messages as read
      const currentMsgs = { ...memoryMessages };
      if (currentMsgs[threadId]) {
        currentMsgs[threadId] = currentMsgs[threadId].map((m) =>
          m.senderId !== userId ? { ...m, status: "read" } : m,
        );
      }
      saveChatState(currentThreads, currentMsgs);
    }
  }
}

export function subscribeToChatUpdates(
  callback: (threads: ChatThread[], messagesMap: Record<string, ChatMessage[]>) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  callback(getChatThreads(), memoryMessages);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_CHAT_CHANNEL);
    bc.onmessage = (event) => {
      if (event.data && event.data.type === "CHAT_SYNC") {
        memoryThreads = event.data.threads;
        memoryMessages = event.data.messagesMap;
        callback(event.data.threads, event.data.messagesMap);
      }
    };
  } catch {
    // BroadcastChannel unsupported
  }

  const handleStorage = (e: StorageEvent) => {
    if ((e.key === STORAGE_THREADS_KEY || e.key === STORAGE_MESSAGES_KEY) && e.newValue) {
      callback(getChatThreads(), memoryMessages);
    }
  };
  window.addEventListener("storage", handleStorage);

  const interval = setInterval(() => {
    callback(getChatThreads(), memoryMessages);
  }, 2500);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("storage", handleStorage);
    clearInterval(interval);
  };
}
