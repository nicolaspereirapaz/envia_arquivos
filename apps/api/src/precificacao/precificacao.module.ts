import { Module } from '@nestjs/common';
import { PrecificacaoController } from './precificacao.controller';
import { PrecificacaoService } from './precificacao.service';

@Module({
  controllers: [PrecificacaoController],
  providers: [PrecificacaoService],
  exports: [PrecificacaoService],
})
export class PrecificacaoModule {}
