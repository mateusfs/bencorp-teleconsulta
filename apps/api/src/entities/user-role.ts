export enum UserRole {
  ADMIN = 'ADMIN',
  ENFERMEIRO = 'ENFERMEIRO',
  MEDICO = 'MEDICO',
}

export const CLINICAL_ROLES: readonly UserRole[] = [
  UserRole.ENFERMEIRO,
  UserRole.MEDICO,
] as const;

export function isClinicalRole(role: UserRole): boolean {
  return CLINICAL_ROLES.includes(role);
}
