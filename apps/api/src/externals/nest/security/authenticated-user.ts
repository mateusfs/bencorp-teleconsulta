import { UserRole } from '@/entities/user-role';

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};
