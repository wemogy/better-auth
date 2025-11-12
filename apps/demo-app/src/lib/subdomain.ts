/**
 * Extract subdomain from hostname
 * Examples:
 * - tenant1.localhost:3000 -> tenant1
 * - tenant2.localhost -> tenant2
 * - app.example.com -> undefined (no subdomain)
 * - tenant1.example.com -> tenant1
 */
export function getSubdomain(hostname: string): string | undefined {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];

  // Split by dots
  const parts = hostWithoutPort.split('.');

  // For localhost, subdomain is first part (e.g., tenant1.localhost)
  // For production, subdomain is first part before domain (e.g., tenant1.example.com)
  if (parts.length >= 2) {
    // Check if it's localhost or a real domain
    const isLocalhost = parts[parts.length - 1] === 'localhost' || parts[parts.length - 1] === 'local';

    if (isLocalhost || parts.length > 2) {
      return parts[0];
    }
  }

  return undefined;
}

/**
 * Map subdomain to tenant ID
 * In the demo app, we use the subdomain directly as the tenant ID
 * Example: tenant1.localhost -> tenant ID: "tenant1"
 */
export function subdomainToTenantId(subdomain: string): string {
  // Use subdomain directly as tenant ID
  return subdomain;
}

/**
 * Get tenant ID from current hostname
 */
export function getTenantIdFromHostname(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const subdomain = getSubdomain(window.location.hostname);
  if (!subdomain) return undefined;

  return subdomainToTenantId(subdomain);
}
