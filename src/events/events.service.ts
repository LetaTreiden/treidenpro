import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LogEventDto } from './dto/log-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  logEvent(dto: LogEventDto) {
    return this.prisma.eventLog.create({
      data: {
        userId: dto.userId,
        eventName: dto.eventName,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        ip: dto.ip,
        userAgent: dto.userAgent,
      },
    });
  }

  getRecent(limit = 100) {
    return this.prisma.eventLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEventCountsByName(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.eventLog.groupBy({
      by: ['eventName'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
      orderBy: { eventName: 'asc' },
    });

    return rows.map((r) => ({ eventName: r.eventName, count: r._count._all }));
  }
}
