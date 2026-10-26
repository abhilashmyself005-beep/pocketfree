/**
 * Tenant Security & Authentication Context
 * Integrates with Clerk to enforce multi-tenant isolation.
 */

export interface AuthSession {
  userId: string;
  email?: string;
  fullName?: string;
  isMock?: boolean;
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenTenantAccessError extends Error {
  constructor(message: string = 'Access denied: Tenant isolation violation') {
    super(message);
    this.name = 'ForbiddenTenantAccessError';
  }
}

/**
 * Returns current authenticated user context.
 * In development / demo preview with unconfigured Clerk keys,
 * falls back to a deterministic development tenant to allow vertical slice testing.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  // In production, strictly enforce Clerk session validation
  if (process.env.NODE_ENV === 'production' && (!clerkSecretKey || clerkSecretKey.includes('sample'))) {
    throw new Error('Production environment must configure a valid CLERK_SECRET_KEY');
  }

  // If live clerk keys are not set in development, use the demo tenant
  if (!clerkSecretKey || clerkSecretKey.includes('sample')) {
    return {
      userId: 'user_dev_saudi_pilot_01',
      email: 'demo@pocketfree.app',
      fullName: 'Tariq Al-Mansoor',
      isMock: true,
    };
  }

  // When Clerk is configured in live production:
  // In Next.js App Router, Clerk provides `auth()` from `@clerk/nextjs/server`
  try {
    // Dynamic import to allow compilation when Clerk package isn't yet bundled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerkModule: any = await import('@clerk/nextjs/server').catch(() => null);
    if (clerkModule && typeof clerkModule.auth === 'function') {
      const { userId, sessionClaims } = await clerkModule.auth();
      if (!userId) return null;
      return {
        userId,
        email: sessionClaims?.email,
        fullName: sessionClaims?.name,
      };
    }
  } catch (error) {
    console.error('Error verifying Clerk session:', error);
  }

  return null;
}

/**
 * Guarantees that the caller is authenticated; throws if not.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new UnauthorizedError('You must be signed in to perform this action.');
  }
  return session;
}

/**
 * Enforces strict tenant isolation.
 * Throws ForbiddenTenantAccessError if requested resource does not match user's identity.
 */
export function enforceTenantIsolation(resourceOwnerId: string, currentUserId: string): void {
  if (resourceOwnerId !== currentUserId) {
    throw new ForbiddenTenantAccessError(
      `Access denied: Target resource belongs to tenant "${resourceOwnerId}", but authenticated tenant is "${currentUserId}".`
    );
  }
}
