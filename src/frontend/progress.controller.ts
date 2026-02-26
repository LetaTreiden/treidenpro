import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FrontendService } from './frontend.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly frontendService: FrontendService) {}

  @Get('summary')
  summary(@CurrentUser() user: { sub: string }) {
    return this.frontendService.progressSummary(user.sub);
  }

  @Get('tracks/:trackId')
  trackProgress(
    @CurrentUser() user: { sub: string },
    @Param('trackId') trackId: string,
  ) {
    return this.frontendService.trackProgress(user.sub, trackId);
  }

  @Get('modules/:moduleId')
  moduleProgress(
    @CurrentUser() user: { sub: string },
    @Param('moduleId') moduleId: string,
  ) {
    return this.frontendService.moduleProgress(user.sub, moduleId);
  }

  @Post('lessons/:lessonId/complete')
  @HttpCode(200)
  completeLesson(
    @CurrentUser() user: { sub: string },
    @Param('lessonId') lessonId: string,
  ) {
    return this.frontendService.completeLesson(user.sub, lessonId);
  }
}
