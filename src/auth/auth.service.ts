import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { YandexLoginDto } from './dto/yandex-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventsService: EventsService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName || dto.name || dto.email.split('@')[0],
      role: Role.USER,
    });

    await this.eventsService.logEvent({
      userId: user.id,
      eventName: 'auth.register',
      payload: { method: 'email' },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.eventsService.logEvent({
      userId: user.id,
      eventName: 'auth.login',
      payload: { method: 'email' },
    });

    return this.issueTokens(user);
  }

  async loginWithYandex(dto: YandexLoginDto) {
    // In production, validate dto.oauthCode with Yandex OAuth API and resolve canonical user info.
    let user = await this.usersService.findByYandexId(dto.yandexId);

    if (!user) {
      user = await this.usersService.createUser({
        yandexId: dto.yandexId,
        email: dto.email,
        displayName: dto.displayName || `yandex_${dto.yandexId}`,
        role: Role.USER,
      });
    }

    await this.eventsService.logEvent({
      userId: user.id,
      eventName: 'auth.login',
      payload: { method: 'yandex' },
    });

    return this.issueTokens(user);
  }

  async loginWithTelegram(dto: TelegramLoginDto) {
    // In production, verify dto.hash according to Telegram Login Widget docs.
    let user = await this.usersService.findByTelegramId(dto.telegramId);

    if (!user) {
      user = await this.usersService.createUser({
        telegramId: dto.telegramId,
        displayName: dto.username || `tg_${dto.telegramId}`,
        role: Role.USER,
      });
    }

    await this.eventsService.logEvent({
      userId: user.id,
      eventName: 'auth.login',
      payload: { method: 'telegram' },
    });

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      const user = await this.usersService.findById(payload.sub);
      if (!user?.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
      if (!tokenMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    await this.eventsService.logEvent({
      userId,
      eventName: 'auth.logout',
    });

    return { success: true };
  }

  private async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessTtl'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshTtl'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
