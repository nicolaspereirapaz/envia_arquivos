import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { toTrimmedString } from '../../common/transforms/to-trimmed-string';

export class CreateClienteDto {
  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  telefone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  cpfCnpj?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  observacoes?: string;
}
