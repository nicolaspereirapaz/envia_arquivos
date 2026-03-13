import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { FotosModule } from '../fotos/fotos.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [PedidosModule, ClientesModule, FotosModule, DocumentosModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
