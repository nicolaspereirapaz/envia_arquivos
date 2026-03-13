import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FotosService } from './fotos.service';
import { CreateItemFotoDto } from './dto/create-item-foto.dto';
import type { ItemFoto } from './item-foto.interface';

@ApiTags('fotos')
@Controller('fotos')
export class FotosController {
  constructor(private readonly fotosService: FotosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria item de foto' })
  criar(@Body() dados: CreateItemFotoDto): ItemFoto {
    return this.fotosService.criar(dados);
  }

  @Get()
  @ApiOperation({ summary: 'Lista itens de foto' })
  listar(): ItemFoto[] {
    return this.fotosService.listar();
  }

  @Get('pedido/:pedidoId')
  @ApiOperation({ summary: 'Lista itens de foto por pedido' })
  listarPorPedidoId(@Param('pedidoId') pedidoId: string): ItemFoto[] {
    return this.fotosService.listarPorPedidoId(pedidoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca item de foto por id' })
  buscarPorId(@Param('id') id: string): ItemFoto {
    return this.fotosService.buscarPorId(id);
  }
}
