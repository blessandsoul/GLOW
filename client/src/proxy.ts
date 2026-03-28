import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/my-services', '/admin', '/create'];
const authPaths = ['/login', '/register'];

export function proxy(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('accessToken')?.value;
    const session = request.cookies.get('session')?.value;
    const onboardingCompleted = request.cookies.get('onboardingCompleted')?.value === '1';

    const isAuthenticated = !!(token || session);
    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );
    const isOnboardingPath = pathname === '/onboarding';
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

    // Authenticated users who haven't completed onboarding → send to /onboarding
    if (isAuthenticated && !onboardingCompleted && isProtectedPath) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // /onboarding is always accessible for authenticated users (they can re-do it from profile)

    // /onboarding requires a session (not public)
    if (isOnboardingPath && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protected paths: redirect to login if not authenticated
    if (isProtectedPath && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Auth pages: redirect to dashboard if already authenticated with valid token
    if (isAuthPath && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // /verify-phone requires a session
    if (pathname === '/verify-phone' && !isAuthenticated) {
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
        '/onboarding',
    ],
};
