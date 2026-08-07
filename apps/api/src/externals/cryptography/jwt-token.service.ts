import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenClaims,
  IssuedToken,
  TokenService,
} from '@/app/contracts/token-service';

const DEFAULT_EXPIRES_SECONDS = 8 * 60 * 60;

function parseExpiresInToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    return DEFAULT_EXPIRES_SECONDS;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return DEFAULT_EXPIRES_SECONDS;
  }
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sign(claims: AccessTokenClaims): Promise<IssuedToken> {
    const expiresInRaw = this.config.get<string>('JWT_EXPIRES_IN') ?? '8h';
    const expiresInSeconds = parseExpiresInToSeconds(expiresInRaw);
    const accessToken = await this.jwt.signAsync(
      {
        email: claims.email,
        role: claims.role,
      },
      {
        subject: claims.sub,
        expiresIn: expiresInSeconds,
      },
    );

    return { accessToken, expiresIn: expiresInRaw };
  }
}
