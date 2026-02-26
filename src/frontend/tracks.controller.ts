import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateModuleRequestDto } from './dto/create-module-request.dto';
import { FrontendService } from './frontend.service';

@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly frontendService: FrontendService) {}

  @Get()
  listTracks() {
    return this.frontendService.listTracks();
  }

  @Get(':trackId')
  getTrack(@Param('trackId') trackId: string) {
    return this.frontendService.getTrack(trackId);
  }

  @Get(':trackId/modules')
  listTrackModules(@Param('trackId') trackId: string) {
    return this.frontendService.listTrackModules(trackId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':trackId/modules')
  createTrackModule(
    @Param('trackId') trackId: string,
    @Body() dto: CreateModuleRequestDto,
    @CurrentUser() _user: { sub: string },
  ) {
    return this.frontendService.createTrackModule(trackId, dto);
  }
}
