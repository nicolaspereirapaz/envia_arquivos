import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { Notificacao } from '../notificacao.interface';

@Injectable()
export class NotificacoesRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  create(notificacao: Notificacao): Notificacao {
    const notificacoes = this.store.read('notificacoes');
    notificacoes.push(notificacao);
    this.store.write('notificacoes', notificacoes);
    return notificacao;
  }

  findAll(): Notificacao[] {
    return this.store.read('notificacoes');
  }

  findById(id: string): Notificacao | undefined {
    return this.store.read('notificacoes').find((item) => item.id === id);
  }

  update(notificacao: Notificacao): Notificacao {
    const notificacoes = this.store.read('notificacoes');
    const index = notificacoes.findIndex((item) => item.id === notificacao.id);

    if (index >= 0) {
      notificacoes[index] = notificacao;
    } else {
      notificacoes.push(notificacao);
    }

    this.store.write('notificacoes', notificacoes);
    return notificacao;
  }
}
