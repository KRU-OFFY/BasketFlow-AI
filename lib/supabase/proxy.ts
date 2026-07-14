import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { resolveSupabasePublicConfig } from './public-config';

const protectedPrefixes = ['/dashboard', '/products', '/projects', '/posting-queue', '/analytics', '/settings'];

export async function updateSession(request: NextRequest) {
  const config = resolveSupabasePublicConfig(process.env);
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!config) {
    if (!isProtected) return NextResponse.next({ request });
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'การตั้งค่า Supabase ฝั่งสาธารณะไม่ครบถ้วน');
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        } catch {
          // A read-only runtime may reject cookie writes; auth verification still runs.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (isProtected && (error || !user)) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return response;
}
