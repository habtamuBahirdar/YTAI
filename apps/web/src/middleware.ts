import { NextRequest, NextResponse } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/dub', '/history', '/settings'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for session cookie
    const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                        request.cookies.get('__Secure-authjs.session-token')?.value;

    // If no session, redirect to login
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dub/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
};

