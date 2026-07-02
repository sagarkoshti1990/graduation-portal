/**
 * Role constants for user role-based access control.
 * Used to determine user permissions and navigation access.
 */
export const ADMIN_ROLES: readonly string[] = ['admin'] as const;
export const SUPERVISOR_ROLES: readonly string[] = ['tenant_admin', 'supervisor'] as const;
export const LC_ROLES: readonly string[] = ['lc','session_manager','org_admin'] as const;
export const PARTICIPANT: readonly string[] = ['user'] as const;

export const ROLE_NAMES = {
  ADMIN: 'Admin',
  LC: 'LC',
  SESSION_MANAGER: 'Session Manager',
  ORG_ADMIN: 'Organization Admin',
  PARTICIPANT: 'Participant',
  USER: 'user',
}

// Entity Type
export const ENTITY_TYPE = {
  PARTICIPANT: 'participant',
}
