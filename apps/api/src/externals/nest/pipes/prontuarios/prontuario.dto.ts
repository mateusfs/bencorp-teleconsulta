import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ClassificacaoRisco } from '@/entities/atendimento';

export class AtualizarProntuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  queixa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  anamnese?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  conduta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  prescricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  complementoMedico?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt({ message: 'PA sistólica deve ser um número inteiro' })
  @Min(50, { message: 'PA sistólica deve ser no mínimo 50' })
  @Max(300, { message: 'PA sistólica deve ser no máximo 300' })
  paSistolica?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt({ message: 'PA diastólica deve ser um número inteiro' })
  @Min(20, { message: 'PA diastólica deve ser no mínimo 20' })
  @Max(200, { message: 'PA diastólica deve ser no máximo 200' })
  paDiastolica?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt({ message: 'FC deve ser um número inteiro' })
  @Min(20, { message: 'FC deve ser no mínimo 20' })
  @Max(250, { message: 'FC deve ser no máximo 250' })
  fc?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({}, { message: 'Temperatura deve ser um número' })
  @Min(30, { message: 'Temperatura deve ser no mínimo 30' })
  @Max(45, { message: 'Temperatura deve ser no máximo 45' })
  temperatura?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt({ message: 'SpO₂ deve ser um número inteiro' })
  @Min(50, { message: 'SpO₂ deve ser no mínimo 50' })
  @Max(100, { message: 'SpO₂ deve ser no máximo 100' })
  spo2?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(ClassificacaoRisco, {
    message: 'Classificação de risco inválida',
  })
  riskClassification?: ClassificacaoRisco | null;
}

export class CriarAdendoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  texto!: string;
}
