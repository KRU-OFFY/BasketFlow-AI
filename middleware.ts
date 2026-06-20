import { NextResponse, type NextRequest } from 'next/server';
const protectedPrefixes = ['/dashboard','/products','/projects','/posting-queue','/analytics','/settings'];
export function middleware(request: NextRequest) { const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); const isProtected = protectedPrefixes.some(p=>request.nextUrl.pathname.startsWith(p)); if (!hasEnv || !isProtected) return NextResponse.next(); const hasSession = request.cookies.getAll().some(c=>c.name.includes('auth-token')); if (!hasSession) return NextResponse.redirect(new URL('/login', request.url)); return NextResponse.next(); }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
