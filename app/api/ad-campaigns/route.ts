import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * GET /api/ad-campaigns?owner_id=<uuid>
 * Returns all ad campaigns for the given owner using the service-role key to
 * bypass RLS (wallet-first app has no Supabase Auth session, so auth.uid() is
 * always null and the old owner-based policies would block all reads).
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return Response.json(
      { error: "Server misconfiguration: missing Supabase credentials" },
      { status: 500 },
    );
  }

  const ownerId = request.nextUrl.searchParams.get("owner_id");
  if (!ownerId) {
    return Response.json({ error: "owner_id query param required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(url, serviceKey);

  const { data, error } = await supabaseAdmin
    .from("ad_campaigns")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/ad-campaigns] Supabase error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

/**
 * POST /api/ad-campaigns
 * Creates an ad campaign using the service-role key to bypass RLS.
 * The browser passes owner_id from the wallet-linked user profile.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return Response.json(
      { error: "Server misconfiguration: missing Supabase credentials" },
      { status: 500 },
    );
  }

  let body: {
    owner_id?: string;
    title?: string;
    objective?: string;
    budget?: number;
    placements?: string[];
    route_hash?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { owner_id, title, objective, budget, placements, route_hash } = body;

  if (!owner_id || typeof owner_id !== "string") {
    return Response.json({ error: "owner_id is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(url, serviceKey);

  const { data, error } = await supabaseAdmin
    .from("ad_campaigns")
    .insert({
      owner_id,
      title,
      objective: objective ?? "traffic",
      budget: budget ?? 0,
      placements: placements ?? [],
      status: "draft",
      route_hash: route_hash ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[POST /api/ad-campaigns] Supabase error:", error);
    return Response.json(
      { error: error?.message ?? "Failed to create campaign" },
      { status: 500 },
    );
  }

  return Response.json(data, { status: 201 });
}
