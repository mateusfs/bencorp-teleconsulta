import { isClinicalRole, UserRole } from './user-role';

describe('UserRole', () => {
  it('identifica papéis clínicos', () => {
    expect(isClinicalRole(UserRole.ENFERMEIRO)).toBe(true);
    expect(isClinicalRole(UserRole.MEDICO)).toBe(true);
    expect(isClinicalRole(UserRole.ADMIN)).toBe(false);
  });
});
