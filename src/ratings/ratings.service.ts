import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const LEADERBOARD_CACHE_KEY = 'ratings:leaderboard:top100';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async addPoints(userId: string, points: number, reason: string, sourceId?: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.ratingEvent.create({
        data: { userId, points, reason, sourceId },
      });

      const current = await tx.userRating.findUnique({ where: { userId } });
      const total = (current?.points || 0) + points;
      const level = Math.max(1, Math.floor(total / 1000) + 1);

      await tx.userRating.upsert({
        where: { userId },
        create: { userId, points: total, level },
        update: { points: total, level },
      });
    });

    await this.redisService.del(LEADERBOARD_CACHE_KEY);
  }

  async getLeaderboard(limit = 100) {
    if (limit === 100) {
      const cached = await this.redisService.get<unknown[]>(LEADERBOARD_CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    const board = await this.prisma.userRating.findMany({
      take: limit,
      orderBy: { points: 'desc' },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (limit === 100) {
      await this.redisService.set(LEADERBOARD_CACHE_KEY, board, 120);
    }

    return board;
  }

  getUserRating(userId: string) {
    return this.prisma.userRating.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, displayName: true } },
      },
    });
  }
}
