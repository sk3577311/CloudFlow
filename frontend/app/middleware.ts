// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Because your auth token lives in localStorage (client-side), middleware
 * cannot reliably protect routes. Keep middleware minimal so it won't interfere
 * with client reloader pages. If you later switch to cookies, reintroduce checks.
 */
export function middleware(request: NextRequest) {
  // no-op middleware; just pass through
  return NextResponse.next();
}

// keep matcher empty to avoid surprising behavior.
// If you later want to protect server routes with cookies, change this.
export const config = { matcher: [] };
