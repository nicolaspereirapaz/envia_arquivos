import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import type { Cliente } from './cliente.interface';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um cliente' })
  criar(@Body() cliente: CreateClienteDto): Cliente {
    return this.clientesService.criar(cliente);
  }

  @Get()
  @ApiOperation({ summary: 'Lista clientes' })
  listar(): Cliente[] {
    return this.clientesService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca cliente por id' })
  buscarPorId(@Param('id') id: string): Cliente {
    return this.clientesService.buscarPorId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza cliente' })
  atualizar(@Param('id') id: string, @Body() dados: UpdateClienteDto): Cliente {
    return this.clientesService.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove cliente' })
  @ApiNoContentResponse()
  remover(@Param('id') id: string): void {
    this.clientesService.remover(id);
  }
}
