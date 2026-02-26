import { Injectable } from '@nestjs/common';
import { AccessSource, AccessType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async hasCourseAccess(userId: string, courseId: string): Promise<boolean> {
    const now = new Date();
    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        userId,
        courseId,
        isActive: true,
        OR: [{ type: AccessType.LIFETIME }, { expiresAt: { gt: now } }],
      },
    });

    return Boolean(grant);
  }

  grantLifetime(userId: string, courseId: string, source: AccessSource) {
    return this.prisma.accessGrant.create({
      data: {
        userId,
        courseId,
        type: AccessType.LIFETIME,
        source,
      },
    });
  }

  grantTemporary(userId: string, courseId: string, source: AccessSource, days: number) {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.accessGrant.create({
      data: {
        userId,
        courseId,
        type: AccessType.TEMPORARY,
        source,
        expiresAt,
      },
    });
  }

  listUserAccess(userId: string) {
    return this.prisma.accessGrant.findMany({
      where: { userId, isActive: true },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
