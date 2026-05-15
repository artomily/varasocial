import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      "[Supabase] Missing environment variables:",
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !key ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "",
    );
    return null;
  }
  try {
    _client = createClient(url, key);
  } catch (err) {
    console.error("[Supabase] Failed to create client:", err);
    return null;
  }
  return _client;
}

// A fully-chainable no-op query builder used when env vars are absent.
// It's a Proxy over a function so both property-access and invocation work.
// It's also thenable so `await supabase.from(...).select(...)` resolves safely.
function makeNoopQuery(): SupabaseClient {
  const handler: ProxyHandler<object> = {
    get(_, prop) {
      if (prop === "then") {
        // Make the proxy thenable so `await query` resolves to empty data.
        return (resolve: (v: { data: null; error: null }) => void) =>
          Promise.resolve({ data: null, error: null }).then(resolve);
      }
      // Every other method (select, eq, limit, order, single, …) returns itself.
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const proxy = new Proxy(function () {} as object, handler) as unknown as SupabaseClient;
  return proxy;
}

// Lazy proxy — safe to import at module level; only connects when methods are called
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getClient();
    if (!client) {
      if (prop === "from" || prop === "rpc") return () => makeNoopQuery();
      return undefined;
    }
    const value = (client as unknown as Record<string, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
