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

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  paSistolica?: number | null;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(200)
  paDiastolica?: number | null;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(250)
  fc?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatura?: number | null;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  spo2?: number | null;

  @IsOptional()
  @IsEnum(ClassificacaoRisco)
  riskClassification?: ClassificacaoRisco | null;
}

export class CriarAdendoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  texto!: string;
}
