import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { CreateItemDocumentoDto } from './dto/create-item-documento.dto';
import type { ItemDocumento } from './item-documento.interface';

@ApiTags('documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria item de documento' })
  criar(@Body() dados: CreateItemDocumentoDto): ItemDocumento {
    return this.documentosService.criar(dados);
  }

  @Get()
  @ApiOperation({ summary: 'Lista itens de documento' })
  listar(): ItemDocumento[] {
    return this.documentosService.listar();
  }

  @Get('pedido/:pedidoId')
  @ApiOperation({ summary: 'Lista itens de documento por pedido' })
  listarPorPedidoId(@Param('pedidoId') pedidoId: string): ItemDocumento[] {
    return this.documentosService.listarPorPedidoId(pedidoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca item de documento por id' })
  buscarPorId(@Param('id') id: string): ItemDocumento {
    return this.documentosService.buscarPorId(id);
  }
}
