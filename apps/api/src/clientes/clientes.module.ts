import { Module, forwardRef } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { ClientesRepository } from './repositories/clientes.repository';

@Module({
  imports: [forwardRef(() => PedidosModule)],
  controllers: [ClientesController],
  providers: [ClientesService, ClientesRepository],
  exports: [ClientesService],
})
export class ClientesModule {}
