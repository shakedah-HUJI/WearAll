import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-scoped client — uses the user's cookie-based session.
// RLS policies apply, so users can only access their own data.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — cookies will be set by middleware
          }
        },
      },
    }
  );
}

// Service-role client — bypasses RLS. Use ONLY for server-side Storage operations
// (e.g., uploading a user's image on their behalf). Never expose to the client.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
