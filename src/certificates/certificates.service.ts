import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly eventsService: EventsService,
  ) {}

  async issueCertificate(dto: IssueCertificateDto, issuedById: string) {
    const serialNumber = await this.generateSerialNumber();

    const cert = await this.prisma.certificate.create({
      data: {
        serialNumber,
        userId: dto.userId,
        courseId: dto.courseId,
        issuedById,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    await this.ratingsService.addPoints(dto.userId, 100, 'certificate_issued', cert.id);
    await this.eventsService.logEvent({
      userId: issuedById,
      eventName: 'certificate.issued',
      payload: { certificateId: cert.id, serialNumber },
    });

    return cert;
  }

  listMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  verifyBySerial(serial: string) {
    return this.prisma.certificate.findUnique({
      where: { serialNumber: serial },
      include: {
        user: { select: { displayName: true } },
        course: { select: { title: true } },
        issuedBy: { select: { displayName: true } },
      },
    });
  }

  private async generateSerialNumber(): Promise<string> {
    const year = new Date().getFullYear();

    while (true) {
      const random = Math.random().toString(36).slice(2, 8).toUpperCase();
      const serial = `TRD-${year}-${random}`;
      const exists = await this.prisma.certificate.findUnique({
        where: { serialNumber: serial },
      });

      if (!exists) {
        return serial;
      }
    }
  }
}
