import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PRAZOS_PEDIDO,
  type PrazoPedido,
} from '../common/types/prazo-pedido.type';
import { roundCurrency } from '../common/utils/round-currency';
import type { ItemPrecificacaoDto } from './dto/item-precificacao.dto';
import type { SimularPrecificacaoDto } from './dto/simular-precificacao.dto';
import type {
  DetalhePrecificacao,
  ItemPrecificacao,
  ItemPrecificacaoDocumento,
  ItemPrecificacaoFoto,
  SimulacaoPrecificacao,
} from './interfaces/precificacao.interface';

const FOTO_PRECOS: Record<string, number> = {
  '10x15': 1,
  '13x18': 2,
  '15x21': 3.5,
};

const DOCUMENTO_PRECOS = {
  pb: 0.5,
  colorido: 1.5,
} as const;

const TAXAS_URGENCIA: Record<PrazoPedido, number> = {
  vinte_quatro_horas: 0,
  uma_hora: 5,
  na_hora: 10,
};

@Injectable()
export class PrecificacaoService {
  simular(dados: SimularPrecificacaoDto): SimulacaoPrecificacao {
    if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
      throw new BadRequestException('Informe ao menos um item para simular.');
    }

    if (!this.isPrazoValido(dados.prazo)) {
      throw new BadRequestException('Prazo inválido.');
    }

    const detalhes = dados.itens.map((item, index) =>
      this.simularItem(item, index),
    );
    const subtotal = roundCurrency(
      detalhes.reduce((acumulador, item) => acumulador + item.totalItem, 0),
    );
    const taxaUrgencia = roundCurrency(TAXAS_URGENCIA[dados.prazo]);

    return {
      subtotal,
      taxaUrgencia,
      total: roundCurrency(subtotal + taxaUrgencia),
      detalhes,
    };
  }

  private simularItem(
    item: ItemPrecificacao | ItemPrecificacaoDto,
    index: number,
  ): DetalhePrecificacao {
    const itemRecebido = item as
      | (ItemPrecificacao & ItemPrecificacaoDto)
      | null
      | undefined;

    if (!itemRecebido || typeof itemRecebido !== 'object') {
      throw new BadRequestException(
        `O item ${index + 1} da simulação é inválido.`,
      );
    }

    if (itemRecebido.tipo === 'foto') {
      return this.simularFoto(itemRecebido, index);
    }

    if (itemRecebido.tipo === 'documento') {
      return this.simularDocumento(itemRecebido, index);
    }

    throw new BadRequestException(`O item ${index + 1} tem tipo inválido.`);
  }

  private simularFoto(
    item: ItemPrecificacaoFoto,
    index: number,
  ): DetalhePrecificacao {
    const tamanho = this.validarTextoObrigatorio(
      item.tamanho,
      `tamanho do item ${index + 1}`,
    );
    const quantidade = this.validarQuantidade(
      item.quantidade,
      `quantidade do item ${index + 1}`,
    );
    const valorUnitario = FOTO_PRECOS[tamanho];

    if (valorUnitario === undefined) {
      throw new BadRequestException(
        `Tamanho de foto inválido no item ${index + 1}.`,
      );
    }

    return {
      tipo: 'foto',
      descricao: `Foto ${tamanho}`,
      valorUnitario: roundCurrency(valorUnitario),
      quantidade,
      totalItem: roundCurrency(valorUnitario * quantidade),
    };
  }

  private simularDocumento(
    item: ItemPrecificacaoDocumento,
    index: number,
  ): DetalhePrecificacao {
    const quantidade = this.validarQuantidade(
      item.quantidade,
      `quantidade do item ${index + 1}`,
    );

    if (typeof item.colorido !== 'boolean') {
      throw new BadRequestException(
        `O campo colorido do item ${index + 1} é obrigatório.`,
      );
    }

    const valorUnitario = item.colorido
      ? DOCUMENTO_PRECOS.colorido
      : DOCUMENTO_PRECOS.pb;

    return {
      tipo: 'documento',
      descricao: item.colorido ? 'Documento colorido' : 'Documento P&B',
      valorUnitario: roundCurrency(valorUnitario),
      quantidade,
      totalItem: roundCurrency(valorUnitario * quantidade),
    };
  }

  private isPrazoValido(prazo: string): prazo is PrazoPedido {
    return PRAZOS_PEDIDO.includes(prazo as PrazoPedido);
  }

  private validarTextoObrigatorio(valor: string, campo: string): string {
    if (typeof valor !== 'string' || valor.trim().length === 0) {
      throw new BadRequestException(`O campo ${campo} é obrigatório.`);
    }

    return valor.trim();
  }

  private validarQuantidade(valor: number, campo: string): number {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new BadRequestException(
        `O campo ${campo} deve ser um inteiro positivo.`,
      );
    }

    return valor;
  }
}
