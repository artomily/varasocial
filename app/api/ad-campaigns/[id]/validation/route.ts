import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * GET /api/ad-campaigns/[id]/validation
 * Returns the AI moderation result for a campaign using the service-role key
 * to bypass RLS (wallet-only app has no Supabase Auth session).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabaseAdmin = createClient(url, serviceKey);

  const { data, error } = await supabaseAdmin
    .from("ad_campaigns")
    .select("verified, ai_report")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ verified: null, ai_report: null }, { status: 200 });
  }

  return Response.json(
    { verified: data.verified ?? null, ai_report: data.ai_report ?? null },
    { status: 200 },
  );
}
