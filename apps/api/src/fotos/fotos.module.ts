import { Module, forwardRef } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { FotosController } from './fotos.controller';
import { FotosService } from './fotos.service';
import { FotosRepository } from './repositories/fotos.repository';

@Module({
  imports: [forwardRef(() => PedidosModule)],
  controllers: [FotosController],
  providers: [FotosService, FotosRepository],
  exports: [FotosService],
})
export class FotosModule {}
