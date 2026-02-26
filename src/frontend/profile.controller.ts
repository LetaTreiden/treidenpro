import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FrontendService } from './frontend.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly frontendService: FrontendService) {}

  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.frontendService.getMe(user.sub);
  }
}
