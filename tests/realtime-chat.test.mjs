import assert from "node:assert/strict";
import test from "node:test";
import {
  getChatMessages,
  getChatThreads,
  markThreadAsRead,
  sanitizeChatMessage,
  sendMessage,
} from "../lib/realtime-chat.ts";

test("privacy engine sanitizes international, local Uzbekistan, and spaced phone numbers", () => {
  const t1 = sanitizeChatMessage("Mening raqamim +998901234567, menga qo'ng'iroq qiling");
  assert.equal(t1.isRedacted, true);
  assert.ok(t1.sanitizedText.includes("[REDACTED FOR PRIVACY]"));
  assert.equal(t1.sanitizedText.includes("998901234567"), false);

  const t2 = sanitizeChatMessage("Aloqa uchun: (90) 123-45-67 raqamiga yozing");
  assert.equal(t2.isRedacted, true);
  assert.ok(t2.sanitizedText.includes("[REDACTED FOR PRIVACY]"));

  const t3 = sanitizeChatMessage("Telefon: 9 0 1 2 3 4 5 6 7");
  assert.equal(t3.isRedacted, true);
  assert.ok(t3.sanitizedText.includes("[REDACTED FOR PRIVACY]"));

  const t4 = sanitizeChatMessage("Bemor vital ko'rsatkichlari: SpO2 89%, pulsi 108 bpm.");
  assert.equal(t4.isRedacted, false);
  assert.equal(t4.sanitizedText, "Bemor vital ko'rsatkichlari: SpO2 89%, pulsi 108 bpm.");
});

test("sending message updates thread last message, unread count, and stores payload", () => {
  const threads = getChatThreads();
  assert.ok(threads.length >= 3);

  const initialMsgs = getChatMessages("thread-doc-nurse");
  const initialCount = initialMsgs.length;

  const result = sendMessage({
    threadId: "thread-doc-nurse",
    senderId: "nurse_malika",
    senderName: "Malika Hamshira",
    senderRole: "nurse",
    content: "Bemor SpO2 ko'rsatkichi 92% ga ko'tarildi.",
  });

  assert.ok(result.message.id);
  assert.equal(result.wasRedacted, false);

  const updatedMsgs = getChatMessages("thread-doc-nurse");
  assert.equal(updatedMsgs.length, initialCount + 1);

  const lastMsg = updatedMsgs[updatedMsgs.length - 1];
  assert.equal(lastMsg.content, "Bemor SpO2 ko'rsatkichi 92% ga ko'tarildi.");

  markThreadAsRead("thread-doc-nurse", "doctor_tomir");
  const threadsAfterRead = getChatThreads();
  const thread = threadsAfterRead.find((t) => t.id === "thread-doc-nurse");
  assert.ok(thread);
  assert.equal(thread.unreadCount["doctor_tomir"], 0);
});

test("clinical template messages carry structured metadata keys", () => {
  const result = sendMessage({
    threadId: "thread-doc-nurse",
    senderId: "doctor_tomir",
    senderName: "Dr. Tomir",
    senderRole: "doctor",
    content: "Zudlik bilan kislorod yordamini oshiring.",
    clinicalTemplateKey: "order_oxygen",
  });

  assert.equal(result.message.clinicalTemplateKey, "order_oxygen");
  assert.equal(result.message.senderRole, "doctor");
});
