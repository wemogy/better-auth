import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Extract subdomain from hostname
 */
function getSubdomain(hostname: string): string | undefined {
  const hostWithoutPort = hostname.split(':')[0];
  const parts = hostWithoutPort.split('.');

  if (parts.length >= 2) {
    const isLocalhost = parts[parts.length - 1] === 'localhost' || parts[parts.length - 1] === 'local';

    if (isLocalhost || parts.length > 2) {
      return parts[0];
    }
  }

  return undefined;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);

  // If subdomain exists, add it to request headers for use in the app and API routes
  if (subdomain) {
    // Use subdomain directly as tenant ID
    const tenantId = subdomain;

    // Create new request headers with tenant ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-subdomain', subdomain);
    requestHeaders.set('x-tenant-id', tenantId);

    // Create response with updated headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Also set response headers for client-side access
    response.headers.set('x-subdomain', subdomain);
    response.headers.set('x-tenant-id', tenantId);

    return response;
  }

  return NextResponse.next();
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths including API routes, except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
