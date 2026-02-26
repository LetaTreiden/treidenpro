import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { YandexLoginDto } from './dto/yandex-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.displayName,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('yandex')
  loginWithYandex(@Body() dto: YandexLoginDto) {
    return this.authService.loginWithYandex(dto);
  }

  @Post('telegram')
  loginWithTelegram(@Body() dto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: { sub: string }) {
    return this.authService.logout(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string; email?: string; role: string }) {
    return user;
  }
}
