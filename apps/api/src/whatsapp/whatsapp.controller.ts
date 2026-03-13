import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import type { WhatsappResumoPedido } from './interfaces/whatsapp-resumo.interface';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('pedido/:id/resumo')
  @ApiOperation({ summary: 'Gera resumo do pedido para WhatsApp' })
  gerarResumo(@Param('id') id: string): WhatsappResumoPedido {
    return this.whatsappService.gerarResumoPedido(id);
  }
}
