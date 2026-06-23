/**
 * Centrally maps role labels based on the institution configuration.
 * For school-type institutions, the 'Admin' display role is replaced with 'Principal'.
 */
export function getRoleLabel(role: string, instituteType?: string): string {
  if (!role) return '';
  const trimmed = role.trim();
  if (trimmed.toLowerCase() === 'admin' && instituteType?.toLowerCase() === 'school') {
    return 'Principal';
  }
  return role;
}
