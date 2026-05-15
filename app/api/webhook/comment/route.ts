import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { post_id, comment_id, author_id } = await req.json();

  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    await fetch(`${webhookUrl}/webhook/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify({ post_id, comment_id, author_id }),
    });
  } catch (err) {
    console.error("[webhook/comment] Failed to call webhook:", err);
  }

  return NextResponse.json({ ok: true });
}
