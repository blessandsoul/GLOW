import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/my-services', '/admin', '/create'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('accessToken')?.value;
    const session = request.cookies.get('session')?.value;

    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    // Only redirect to login if NEITHER access token NOR session marker exists.
    // When the access token has expired but the session cookie remains, the
    // client-side AuthHydrator will refresh the token transparently.
    if (isProtectedPath && !token && !session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

    if (isAuthPath && (token || session)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // /verify-phone requires a session but should NOT redirect to dashboard
    if (pathname === '/verify-phone' && !token && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/my-services/:path*',
        '/admin/:path*',
        '/create',
        '/login',
        '/register',
        '/verify-phone',
    ],
};
