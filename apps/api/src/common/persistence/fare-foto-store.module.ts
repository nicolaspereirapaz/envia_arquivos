import { Global, Module } from '@nestjs/common';
import { FareFotoStoreService } from './fare-foto-store.service';

@Global()
@Module({
  providers: [FareFotoStoreService],
  exports: [FareFotoStoreService],
})
export class FareFotoStoreModule {}
