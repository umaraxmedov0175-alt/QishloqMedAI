import { recordAuditEvent } from "@/lib/audit";
import { getChatMessages, sendMessage, type Attachment } from "@/lib/realtime-chat";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    return Response.json({ error: "Missing threadId parameter" }, { status: 400 });
  }

  const messages = getChatMessages(threadId);
  return Response.json({ success: true, threadId, messages });
}

export async function POST(request: Request) {
  let body: {
    threadId?: string;
    senderId?: string;
    senderName?: string;
    senderRole?: "doctor" | "nurse" | "patient" | "dispatcher";
    content?: string;
    attachment?: Attachment;
    clinicalTemplateKey?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  if (!body.threadId || !body.senderId || !body.senderName || !body.senderRole || !body.content) {
    return Response.json({ error: "Missing required message parameters" }, { status: 400 });
  }

  const { message, wasRedacted } = sendMessage({
    threadId: body.threadId,
    senderId: body.senderId,
    senderName: body.senderName,
    senderRole: body.senderRole,
    content: body.content,
    attachment: body.attachment,
    clinicalTemplateKey: body.clinicalTemplateKey,
  });

  await recordAuditEvent(null, {
    actorId: body.senderId,
    action: "chat_message_sent",
    resourceType: "chat_message",
    resourceId: message.id,
    metadata: {
      threadId: body.threadId,
      senderRole: body.senderRole,
      wasRedacted,
      hasAttachment: Boolean(body.attachment),
    },
  });

  return Response.json(
    {
      success: true,
      message,
      wasRedacted,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
