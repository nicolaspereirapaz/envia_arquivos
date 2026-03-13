import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PEDIDO_STATUS, type PedidoStatus } from '../pedido.interface';

export class UpdatePedidoStatusDto {
  @ApiProperty({ enum: PEDIDO_STATUS })
  @IsIn(PEDIDO_STATUS)
  status: PedidoStatus;
}
