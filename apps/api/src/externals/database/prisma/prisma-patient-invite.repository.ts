import { Injectable } from '@nestjs/common';
import {
  CreatePatientInviteInput,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { PatientInviteLink } from '@/entities/sala';
import { PrismaService } from '@/externals/database/prisma/prisma.service';

@Injectable()
export class PrismaPatientInviteRepository implements PatientInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePatientInviteInput): Promise<PatientInviteLink> {
    const row = await this.prisma.patientInviteLink.create({
      data: {
        atendimentoId: input.atendimentoId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdByUserId: input.createdByUserId,
      },
    });
    return row;
  }

  async findByTokenHash(tokenHash: string): Promise<PatientInviteLink | null> {
    return this.prisma.patientInviteLink.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string, usedAt: Date): Promise<PatientInviteLink | null> {
    const result = await this.prisma.patientInviteLink.updateMany({
      where: { id, usedAt: null, revokedAt: null },
      data: { usedAt },
    });
    if (result.count === 0) {
      return null;
    }
    return this.prisma.patientInviteLink.findUnique({ where: { id } });
  }

  async revokeAllForAtendimento(
    atendimentoId: string,
    revokedAt: Date,
  ): Promise<number> {
    const result = await this.prisma.patientInviteLink.updateMany({
      where: { atendimentoId, revokedAt: null },
      data: { revokedAt },
    });
    return result.count;
  }
}
