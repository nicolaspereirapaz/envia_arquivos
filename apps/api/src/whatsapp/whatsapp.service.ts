import { Injectable } from '@nestjs/common';
import { ClientesService } from '../clientes/clientes.service';
import { DocumentosService } from '../documentos/documentos.service';
import { FotosService } from '../fotos/fotos.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { WHATSAPP_LOJA_NUMERO } from './constants/whatsapp.constants';
import type { WhatsappResumoPedido } from './interfaces/whatsapp-resumo.interface';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly clientesService: ClientesService,
    private readonly fotosService: FotosService,
    private readonly documentosService: DocumentosService,
  ) {}

  gerarResumoPedido(id: string): WhatsappResumoPedido {
    const pedido = this.pedidosService.buscarDetalhadoPorId(id);
    const cliente = this.clientesService.buscarPorId(pedido.clienteId);
    const fotos = this.fotosService.listarPorPedidoId(pedido.id);
    const documentos = this.documentosService.listarPorPedidoId(pedido.id);
    const linhas = [
      'Pedido Fare Foto',
      `Cliente: ${cliente.nome}`,
      `Telefone: ${cliente.telefone}`,
      `Pedido: ${pedido.id}`,
      `Status: ${pedido.status}`,
      `Prazo: ${pedido.prazo}`,
    ];

    if (pedido.observacoes) {
      linhas.push(`Observacoes: ${pedido.observacoes}`);
    }

    linhas.push('Fotos:');

    if (fotos.length > 0) {
      linhas.push(
        ...fotos.map(
          (item) => `- ${item.arquivoNome} | ${item.tamanho} | qtd ${item.quantidade}`,
        ),
      );
    } else if (pedido.itens.some((item) => item.tipo === 'foto')) {
      linhas.push(
        ...pedido.itens
          .filter((item) => item.tipo === 'foto')
          .map((item) => `- item foto | ${item.tamanho} | qtd ${item.quantidade}`),
      );
    } else {
      linhas.push('- Nenhuma foto');
    }

    linhas.push('Documentos:');

    if (documentos.length > 0) {
      linhas.push(
        ...documentos.map(
          (item) =>
            `- ${item.arquivoNome} | ${item.colorido ? 'colorido' : 'preto e branco'} | qtd ${item.quantidade}`,
        ),
      );
    } else if (pedido.itens.some((item) => item.tipo === 'documento')) {
      linhas.push(
        ...pedido.itens
          .filter((item) => item.tipo === 'documento')
          .map(
            (item) =>
              `- item documento | ${item.colorido ? 'colorido' : 'preto e branco'} | qtd ${item.quantidade}`,
          ),
      );
    } else {
      linhas.push('- Nenhum documento');
    }

    linhas.push(`Subtotal: R$ ${pedido.subtotal.toFixed(2)}`);
    linhas.push(`Taxa urgencia: R$ ${pedido.taxaUrgencia.toFixed(2)}`);
    linhas.push(`Total: R$ ${pedido.total.toFixed(2)}`);

    const mensagem = linhas.join('\n');

    return {
      pedidoId: pedido.id,
      mensagem,
      link: `https://wa.me/${WHATSAPP_LOJA_NUMERO}?text=${encodeURIComponent(
        mensagem,
      )}`,
    };
  }
}
