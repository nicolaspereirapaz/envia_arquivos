import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrecificacaoService } from './precificacao.service';
import { SimularPrecificacaoDto } from './dto/simular-precificacao.dto';
import type { SimulacaoPrecificacao } from './interfaces/precificacao.interface';

@ApiTags('precificacao')
@Controller('precificacao')
export class PrecificacaoController {
  constructor(private readonly precificacaoService: PrecificacaoService) {}

  @Post('simular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simula a precificacao de itens' })
  simular(@Body() dados: SimularPrecificacaoDto): SimulacaoPrecificacao {
    return this.precificacaoService.simular(dados);
  }
}
