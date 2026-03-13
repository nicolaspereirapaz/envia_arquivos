import { Injectable } from '@nestjs/common';
import type { Notificacao } from '../notificacao.interface';

@Injectable()
export class NotificacoesRepository {
  private readonly notificacoes: Notificacao[] = [];

  create(notificacao: Notificacao): Notificacao {
    this.notificacoes.push(notificacao);
    return notificacao;
  }

  findAll(): Notificacao[] {
    return this.notificacoes;
  }

  findById(id: string): Notificacao | undefined {
    return this.notificacoes.find((item) => item.id === id);
  }
}
