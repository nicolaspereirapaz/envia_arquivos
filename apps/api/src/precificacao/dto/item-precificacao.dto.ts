import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { toBoolean } from '../../common/transforms/to-boolean';
import { toTrimmedString } from '../../common/transforms/to-trimmed-string';

export class ItemPrecificacaoDto {
  @ApiProperty({ enum: ['foto', 'documento'] })
  @IsIn(['foto', 'documento'])
  tipo: 'foto' | 'documento';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  tamanho?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  colorido?: boolean;
}
