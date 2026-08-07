import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UnauthorizedError } from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';
import { AuthPrincipal } from './authenticated-user';

type JwtPayload = {
  sub: string;
  kind?: 'professional' | 'patient';
  email?: string;
  role?: UserRole;
  atendimentoId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthPrincipal {
    if (payload.kind === 'patient') {
      if (!payload.atendimentoId) {
        throw new UnauthorizedError('Token de paciente inválido');
      }
      return {
        kind: 'patient',
        patientId: payload.sub,
        atendimentoId: payload.atendimentoId,
      };
    }

    if (!payload.email || !payload.role) {
      throw new UnauthorizedError('Token profissional inválido');
    }

    return {
      kind: 'professional',
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
