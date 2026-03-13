import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientesModule } from './clientes/clientes.module';
import { DocumentosModule } from './documentos/documentos.module';
import { FotosModule } from './fotos/fotos.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrecificacaoModule } from './precificacao/precificacao.module';
import { UploadsModule } from './uploads/uploads.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ClientesModule,
    PrecificacaoModule,
    FotosModule,
    DocumentosModule,
    PedidosModule,
    NotificacoesModule,
    WhatsappModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
