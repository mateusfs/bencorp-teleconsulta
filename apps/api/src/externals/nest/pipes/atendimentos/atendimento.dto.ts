import {
  IsBooleanString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AtendimentoStatus, ClassificacaoRisco } from '@/entities/atendimento';
import { PeriodoFila } from '@/entities/periodo-fila';

export class ListarFilaQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(AtendimentoStatus)
  status?: AtendimentoStatus;

  @IsOptional()
  @IsIn(['HOJE', 'ONTEM', 'ULTIMA_SEMANA', 'TODOS'])
  periodo?: PeriodoFila;

  @IsOptional()
  @IsBooleanString()
  encaminhadosOnly?: string;
}

export class CriarSolicitacaoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  patientName!: string;

  @IsString()
  @MinLength(11)
  @MaxLength(14)
  patientCpf!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(40)
  patientContact!: string;

  @IsOptional()
  @IsEnum(ClassificacaoRisco)
  riskClassification?: ClassificacaoRisco;
}
