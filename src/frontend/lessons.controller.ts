import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AutosaveLessonDto } from './dto/autosave-lesson.dto';
import { ReorderLessonsRequestDto } from './dto/reorder-lessons-request.dto';
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto';
import { FrontendService } from './frontend.service';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly frontendService: FrontendService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('reorder')
  reorderLessons(@Body() dto: ReorderLessonsRequestDto) {
    return this.frontendService.reorderLessons(dto);
  }

  @Get(':lessonId')
  getLesson(@Param('lessonId') lessonId: string) {
    return this.frontendService.getLesson(lessonId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':lessonId')
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonRequestDto,
  ) {
    return this.frontendService.updateLesson(lessonId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':lessonId/publish')
  @HttpCode(200)
  publishLesson(@Param('lessonId') lessonId: string) {
    return this.frontendService.publishLesson(lessonId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':lessonId/draft')
  @HttpCode(200)
  draftLesson(@Param('lessonId') lessonId: string) {
    return this.frontendService.draftLesson(lessonId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':lessonId/autosave')
  @HttpCode(200)
  autosaveLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: AutosaveLessonDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.frontendService.autosaveLesson(lessonId, dto, user.sub);
  }

  @Get(':lessonId/versions')
  listLessonVersions(@Param('lessonId') lessonId: string) {
    return this.frontendService.listLessonVersions(lessonId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':lessonId/restore/:versionId')
  @HttpCode(200)
  restoreLessonVersion(
    @Param('lessonId') lessonId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.frontendService.restoreLessonVersion(lessonId, versionId, user.sub);
  }
}
