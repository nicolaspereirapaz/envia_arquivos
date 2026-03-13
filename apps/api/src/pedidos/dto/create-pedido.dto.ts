import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PRAZOS_PEDIDO, type PrazoPedido } from '../../common/types/prazo-pedido.type';
import { toBoolean } from '../../common/transforms/to-boolean';
import { toTrimmedString } from '../../common/transforms/to-trimmed-string';
import { ItemPrecificacaoDto } from '../../precificacao/dto/item-precificacao.dto';

export class CreatePedidoFotoItemDto {
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
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  tamanho: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brilho?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contraste?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  saturacao?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  cropData?: string;
}

export class CreatePedidoDocumentoItemDto {
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

export class CreatePedidoDto {
  @ApiProperty()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  clienteId: string;

  @ApiProperty({ enum: PRAZOS_PEDIDO })
  @IsIn(PRAZOS_PEDIDO)
  prazo: PrazoPedido;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ type: () => [ItemPrecificacaoDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPrecificacaoDto)
  itens?: ItemPrecificacaoDto[];

  @ApiPropertyOptional({ type: () => [CreatePedidoFotoItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoFotoItemDto)
  fotos?: CreatePedidoFotoItemDto[];

  @ApiPropertyOptional({ type: () => [CreatePedidoDocumentoItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoDocumentoItemDto)
  documentos?: CreatePedidoDocumentoItemDto[];
}
