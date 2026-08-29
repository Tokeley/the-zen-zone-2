import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/src/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // getUser() makes a verified server-side call — more secure than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination so we can redirect back after sign-in
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // /api/admin/upload verifies the session itself and returns API-friendly JSON errors.
  matcher: ['/admin', '/admin/:path*', '/api/admin/scenes', '/api/admin/scenes/:path*'],
};
