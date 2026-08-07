import { UserRole } from '@/entities/user-role';

export type AuthenticatedUser = {
  kind: 'professional';
  userId: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedPatient = {
  kind: 'patient';
  patientId: string;
  atendimentoId: string;
};

export type AuthPrincipal = AuthenticatedUser | AuthenticatedPatient;
