import { DEMO_ROLE_COOKIE } from "@/lib/demo-session";

export async function POST(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": `${DEMO_ROLE_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`,
      },
    },
  );
}
