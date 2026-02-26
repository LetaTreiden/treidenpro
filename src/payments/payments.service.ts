import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessSource } from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import { AccessService } from '../access/access.service';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly accessService: AccessService,
    private readonly eventsService: EventsService,
  ) {}

  async createYookassaOrder(userId: string, dto: CreateOrderDto) {
    const localOrderId = randomUUID();
    const shopId = this.configService.get<string>('yookassa.shopId');
    const secretKey = this.configService.get<string>('yookassa.secretKey');

    if (!shopId || !secretKey) {
      throw new InternalServerErrorException('YooKassa credentials are not configured');
    }

    const payload = {
      amount: { value: dto.amountRub.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/payments/return`,
      },
      description: `Course purchase: ${dto.courseId}`,
      metadata: {
        localOrderId,
        userId,
        courseId: dto.courseId,
        accessType: dto.accessType || 'LIFETIME',
        accessDays: dto.accessDays || null,
      },
    };

    const authHeader = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
        'Idempotence-Key': localOrderId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(`YooKassa order create failed: ${body}`);
    }

    const payment = (await response.json()) as {
      id: string;
      status: string;
      confirmation?: { confirmation_url?: string };
    };

    const order = await this.prisma.order.create({
      data: {
        externalId: payment.id,
        provider: 'YOOKASSA',
        userId,
        courseId: dto.courseId,
        amount: dto.amountRub,
        status: 'PENDING',
        paymentUrl: payment.confirmation?.confirmation_url,
        rawPayload: payload,
      },
    });

    await this.eventsService.logEvent({
      userId,
      eventName: 'payment.order_created',
      payload: { orderId: order.id, externalId: order.externalId },
    });

    return order;
  }

  listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleYookassaWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: Record<string, any>,
  ) {
    this.verifyWebhookSignature(headers, body);

    const event = body.event as string;
    const paymentObject = body.object as {
      id: string;
      status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
      metadata?: Record<string, any>;
    };

    const order = await this.prisma.order.findUnique({
      where: { externalId: paymentObject.id },
    });

    if (!order) {
      return { ignored: true, reason: 'order_not_found' };
    }

    if (paymentObject.status === 'waiting_for_capture') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'WAITING_CAPTURE', rawPayload: body },
      });
      return { ok: true };
    }

    if (paymentObject.status === 'canceled') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELED', rawPayload: body },
      });
      return { ok: true };
    }

    if (paymentObject.status === 'succeeded') {
      if (order.accessGrantId) {
        return { ok: true, duplicated: true };
      }

      const storedMetadata = ((order.rawPayload as Record<string, any>) || {}).metadata || {};
      const webhookMetadata = paymentObject.metadata || {};
      const accessType = webhookMetadata.accessType || storedMetadata.accessType || 'LIFETIME';
      const accessDays = Number(webhookMetadata.accessDays || storedMetadata.accessDays || 30);

      const grant =
        accessType === 'TEMPORARY'
          ? await this.accessService.grantTemporary(
              order.userId,
              order.courseId,
              AccessSource.PURCHASE,
              accessDays,
            )
          : await this.accessService.grantLifetime(
              order.userId,
              order.courseId,
              AccessSource.PURCHASE,
            );

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'SUCCEEDED',
          accessGrantId: grant.id,
          rawPayload: body,
        },
      });

      await this.eventsService.logEvent({
        userId: order.userId,
        eventName: 'payment.succeeded',
        payload: { orderId: order.id, accessGrantId: grant.id, event },
      });

      return { ok: true };
    }

    return { ignored: true };
  }

  private verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    body: Record<string, any>,
  ) {
    const secret = this.configService.get<string>('yookassa.webhookSecret');
    if (!secret) {
      throw new InternalServerErrorException('Webhook secret is not configured');
    }

    const signatureHeader = headers['x-yookassa-signature'];
    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expected) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
