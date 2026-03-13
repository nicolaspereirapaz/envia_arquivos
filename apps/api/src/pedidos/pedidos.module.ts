import { Module, forwardRef } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { FotosModule } from '../fotos/fotos.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { PrecificacaoModule } from '../precificacao/precificacao.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PedidoItensRepository } from './repositories/pedido-itens.repository';
import { PedidosRepository } from './repositories/pedidos.repository';

@Module({
  imports: [
    forwardRef(() => ClientesModule),
    PrecificacaoModule,
    forwardRef(() => FotosModule),
    forwardRef(() => DocumentosModule),
    NotificacoesModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosRepository, PedidoItensRepository],
  exports: [PedidosService],
})
export class PedidosModule {}
