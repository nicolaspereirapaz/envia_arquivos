import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { toBoolean } from '../../common/transforms/to-boolean';
import { toTrimmedString } from '../../common/transforms/to-trimmed-string';

export class CreateItemDocumentoDto {
  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  pedidoId: string;

  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  arquivoNome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  arquivoUrl?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiProperty()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  colorido: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  tipoImpressao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  acabamento?: string;
}
