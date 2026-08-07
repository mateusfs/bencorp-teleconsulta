import { UserRole } from '@/entities/user-role';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: UserRole;
};

export type PatientTokenClaims = {
  sub: string;
  atendimentoId: string;
};

export type IssuedToken = {
  accessToken: string;
  expiresIn: string;
};

export interface TokenService {
  sign(claims: AccessTokenClaims): Promise<IssuedToken>;
  signPatient(
    claims: PatientTokenClaims,
    expiresInSeconds: number,
  ): Promise<IssuedToken>;
}
