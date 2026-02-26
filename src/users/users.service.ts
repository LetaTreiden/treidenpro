import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByYandexId(yandexId: string) {
    return this.prisma.user.findUnique({ where: { yandexId } });
  }

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  createUser(data: {
    email?: string;
    passwordHash?: string;
    displayName: string;
    role?: Role;
    yandexId?: string;
    telegramId?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  updateRefreshToken(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}
