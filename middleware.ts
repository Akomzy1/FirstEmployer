import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh + route gating for the authenticated app area.
 * - /app/**       requires a session; unauthenticated → /auth
 * - /auth, /onboarding/** are reachable without a session (magic-link entry)
 * Everything under (marketing) and static assets is untouched.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAppArea = pathname === "/app" || pathname.startsWith("/app/");

  if (isAppArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
