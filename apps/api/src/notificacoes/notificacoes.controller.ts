import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import { NotificacoesService } from './notificacoes.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import type { Notificacao } from './notificacao.interface';

@ApiTags('notificacoes')
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista notificacoes' })
  listar(): Notificacao[] {
    return this.notificacoesService.listar();
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Abre stream SSE de notificacoes' })
  stream(): Observable<MessageEvent> {
    return this.notificacoesService.stream();
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma notificacao' })
  criar(@Body() dados: CreateNotificacaoDto): Notificacao {
    return this.notificacoesService.criar(dados);
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marca notificacao como lida' })
  marcarComoLida(@Param('id') id: string): Notificacao {
    return this.notificacoesService.marcarComoLida(id);
  }
}
