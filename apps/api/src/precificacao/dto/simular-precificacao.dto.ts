import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, ValidateNested } from 'class-validator';
import {
  PRAZOS_PEDIDO,
  type PrazoPedido,
} from '../../common/types/prazo-pedido.type';
import { ItemPrecificacaoDto } from './item-precificacao.dto';

export class SimularPrecificacaoDto {
  @ApiProperty({ type: () => [ItemPrecificacaoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPrecificacaoDto)
  itens: ItemPrecificacaoDto[];

  @ApiProperty({ enum: PRAZOS_PEDIDO })
  @IsIn(PRAZOS_PEDIDO)
  prazo: PrazoPedido;
}
