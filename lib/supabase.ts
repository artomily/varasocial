import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

// Lazy proxy — safe to import at module level; only connects when methods are called
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getClient();
    if (!client) {
      // Return a stub that silently returns empty results during SSR/prerender
      return () => Promise.resolve({ data: null, error: { message: "Supabase env vars not configured" } });
    }
    const value = (client as unknown as Record<string, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
