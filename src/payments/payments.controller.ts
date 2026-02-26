import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  createOrder(@CurrentUser() user: { sub: string }, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createYookassaOrder(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/me')
  getMyOrders(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.listMyOrders(user.sub);
  }

  @Post('yookassa/webhook')
  yookassaWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, any>,
  ) {
    return this.paymentsService.handleYookassaWebhook(headers, body);
  }
}
