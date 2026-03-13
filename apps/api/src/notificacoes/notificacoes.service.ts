import { Injectable, NotFoundException } from '@nestjs/common';
import { createId } from '../common/utils/create-id';
import { NotificacoesRepository } from './repositories/notificacoes.repository';
import type { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import type { Notificacao } from './notificacao.interface';

@Injectable()
export class NotificacoesService {
  constructor(
    private readonly notificacoesRepository: NotificacoesRepository,
  ) {}

  criar(dados: CreateNotificacaoDto): Notificacao {
    return this.notificacoesRepository.create({
      id: createId(),
      pedidoId: dados.pedidoId.trim(),
      tipo: dados.tipo.trim(),
      mensagem: dados.mensagem.trim(),
      lida: false,
      criadaEm: new Date(),
    });
  }

  listar(): Notificacao[] {
    return this.notificacoesRepository.findAll();
  }

  marcarComoLida(id: string): Notificacao {
    const notificacao = this.notificacoesRepository.findById(id);

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    notificacao.lida = true;

    return notificacao;
  }
}
