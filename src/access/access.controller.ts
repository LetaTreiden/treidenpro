import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccessService } from './access.service';

@Controller('access')
@UseGuards(JwtAuthGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('me')
  myAccess(@CurrentUser() user: { sub: string }) {
    return this.accessService.listUserAccess(user.sub);
  }
}
