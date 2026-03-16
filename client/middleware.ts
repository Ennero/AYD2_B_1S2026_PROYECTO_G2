import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value || request.headers.get('Authorization')

  // Prevent unauthenticated users from accessing protected routes
  const isProtectedPath = request.nextUrl.pathname.startsWith('/encargado-patio') || 
                          request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/admin')

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Prevent authenticated users from accessing login page again
  if (request.nextUrl.pathname.startsWith('/login') && token) {
    // Ideally we would decode token to see their role, but here we can just redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
