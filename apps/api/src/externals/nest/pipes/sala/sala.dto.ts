import { IsOptional, IsUUID } from 'class-validator';

export class ResgatarLinkDto {
  @IsOptional()
  @IsUUID()
  atendimentoId?: string;
}
