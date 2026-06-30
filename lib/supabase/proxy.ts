import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPrefixes = ['/dashboard', '/products', '/projects', '/posting-queue', '/analytics', '/settings'];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!url || !key) {
    if (!isProtected) return NextResponse.next({ request });
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'ระบบยังไม่ได้ตั้งค่า Supabase');
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
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

  const { data } = await supabase.auth.getUser();
  if (isProtected && !data.user) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }
  if (request.nextUrl.pathname === '/login' && data.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return response;
}
