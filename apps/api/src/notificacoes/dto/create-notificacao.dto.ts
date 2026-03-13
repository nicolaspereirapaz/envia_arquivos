import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { toTrimmedString } from '../../common/transforms/to-trimmed-string';

export class CreateNotificacaoDto {
  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  pedidoId: string;

  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  mensagem: string;
}
