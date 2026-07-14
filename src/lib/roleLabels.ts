/**
 * Returns the display label for a role.
 * Roles are displayed as-is without any mapping.
 */
export function getRoleLabel(role: string, _instituteType?: string): string {
  if (!role) return '';
  return role.trim();
}
