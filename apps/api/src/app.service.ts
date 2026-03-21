import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from './common/persistence/fare-foto-store.service';

@Injectable()
export class AppService {
  constructor(private readonly store: FareFotoStoreService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: 'ok'; persistence: string } {
    return {
      status: 'ok',
      persistence: this.store.getDriver(),
    };
  }
}
