import { IsOptional, IsString } from 'class-validator';

export class ListarPacientesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
