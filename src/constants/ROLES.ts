/**
 * Role constants for user role-based access control.
 * Used to determine user permissions and navigation access.
 */
export const ADMIN_ROLES: readonly string[] = ['admin'] as const;
export const SUPERVISOR_ROLES: readonly string[] = ['tenant_admin'] as const;
export const LC_ROLES: readonly string[] = ['session_manager','org_admin'] as const;
export const MENTOR_ROLES: readonly string[] = ['mentor'] as const;
export const PARTICIPANT_ROLES: readonly string[] = ['user'] as const;

export const ROLE_NAMES = {
  ADMIN: 'admin',
  LC: 'org_admin',
  SESSION_MANAGER: 'Session Manager',
  ORG_ADMIN: 'org_admin',
  PARTICIPANT: 'Participant',
  USER: 'user',
}

// Display names for role titles
export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  admin: 'Admin',
  tenant_admin: 'Supervisor',
  org_admin: 'Linkage Champion',
  mentor: 'Support Provider',
  user: 'Participant',
};

// Entity Type
export const ENTITY_TYPE = {
  PARTICIPANT: 'participant',
}
