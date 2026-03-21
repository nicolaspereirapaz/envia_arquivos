import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Subject, concat, defer, map, of, type Observable } from 'rxjs';
import { createId } from '../common/utils/create-id';
import { NotificacoesRepository } from './repositories/notificacoes.repository';
import type { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import type { Notificacao } from './notificacao.interface';
import {
  serializarNotificacao,
  type NotificacoesStreamPayload,
} from './interfaces/notificacoes-stream.interface';

@Injectable()
export class NotificacoesService {
  private readonly changes$ = new Subject<
    NotificacoesStreamPayload['reason']
  >();

  constructor(
    private readonly notificacoesRepository: NotificacoesRepository,
  ) {}

  criar(dados: CreateNotificacaoDto): Notificacao {
    const notificacao = this.notificacoesRepository.create({
      id: createId(),
      pedidoId: dados.pedidoId.trim(),
      tipo: dados.tipo.trim(),
      mensagem: dados.mensagem.trim(),
      lida: false,
      criadaEm: new Date(),
    });

    this.emitirAtualizacao('criada');

    return notificacao;
  }

  listar(): Notificacao[] {
    return this.notificacoesRepository.findAll();
  }

  stream(): Observable<MessageEvent> {
    return defer(() =>
      concat(
        of(this.criarMensagemDeStream('snapshot')),
        this.changes$.pipe(map((reason) => this.criarMensagemDeStream(reason))),
      ),
    );
  }

  marcarComoLida(id: string): Notificacao {
    const notificacao = this.notificacoesRepository.findById(id);

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    const notificacaoAtualizada = this.notificacoesRepository.update({
      ...notificacao,
      lida: true,
    });

    this.emitirAtualizacao('atualizada');

    return notificacaoAtualizada;
  }

  private emitirAtualizacao(reason: NotificacoesStreamPayload['reason']): void {
    this.changes$.next(reason);
  }

  private criarMensagemDeStream(
    reason: NotificacoesStreamPayload['reason'],
  ): MessageEvent {
    return {
      type: 'notificacoes',
      data: {
        reason,
        updatedAt: new Date().toISOString(),
        notificacoes: this.listar().map(serializarNotificacao),
      } satisfies NotificacoesStreamPayload,
    };
  }
}
