import { describe, it, expect } from 'vitest';
import { enforceTenantIsolation, ForbiddenTenantAccessError } from '../src/server/auth';

describe('Tenant Isolation & Authorization Boundary', () => {
  it('allows access when resource owner matches authenticated tenant', () => {
    const currentUserId = 'user_clerk_saudi_01';
    expect(() => enforceTenantIsolation(currentUserId, currentUserId)).not.toThrow();
  });

  it('strictly blocks access when resource belongs to a different tenant', () => {
    const currentUserId = 'user_clerk_saudi_01';
    const targetResourceId = 'user_clerk_malicious_attacker';

    expect(() => enforceTenantIsolation(targetResourceId, currentUserId)).toThrow(
      ForbiddenTenantAccessError
    );
  });
});
