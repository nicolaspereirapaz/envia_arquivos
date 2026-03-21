import { Module, forwardRef } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { UploadsModule } from '../uploads/uploads.module';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { DocumentosRepository } from './repositories/documentos.repository';

@Module({
  imports: [forwardRef(() => PedidosModule), UploadsModule],
  controllers: [DocumentosController],
  providers: [DocumentosService, DocumentosRepository],
  exports: [DocumentosService],
})
export class DocumentosModule {}
