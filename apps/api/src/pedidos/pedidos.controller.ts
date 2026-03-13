import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoStatusDto } from './dto/update-pedido-status.dto';
import type { Pedido, PedidoDetalhado } from './pedido.interface';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um pedido' })
  criar(@Body() dados: CreatePedidoDto): PedidoDetalhado {
    return this.pedidosService.criar(dados);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pedidos' })
  listar(): Pedido[] {
    return this.pedidosService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca pedido por id' })
  buscarPorId(@Param('id') id: string): PedidoDetalhado {
    return this.pedidosService.buscarDetalhadoPorId(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualiza status do pedido' })
  atualizarStatus(
    @Param('id') id: string,
    @Body() dados: UpdatePedidoStatusDto,
  ): Pedido {
    return this.pedidosService.atualizarStatus(id, dados.status);
  }
}
