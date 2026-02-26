import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoursesService } from './courses.service';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseVersionDto } from './dto/create-course-version.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseVersionDto } from './dto/update-course-version.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listPublicCourses() {
    return this.coursesService.listPublicCourses();
  }

  @Get(':courseId')
  getPublicCourse(@Param('courseId') courseId: string) {
    return this.coursesService.getPublicCourse(courseId);
  }

  @Get(':courseId/versions/:versionId/outline')
  getVersionOutline(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.coursesService.getVersionOutline(courseId, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':courseId/versions/:versionId/content')
  getVersionContent(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.coursesService.getVersionContent(courseId, versionId, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':courseId')
  updateCourse(@Param('courseId') courseId: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(courseId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':courseId/versions')
  createCourseVersion(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseVersionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.coursesService.createCourseVersion(courseId, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':courseId/versions/:versionId')
  updateCourseVersion(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateCourseVersionDto,
  ) {
    return this.coursesService.updateCourseVersion(courseId, versionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('versions/:versionId/sections')
  createSection(@Param('versionId') versionId: string, @Body() dto: CreateSectionDto) {
    return this.coursesService.createSection(versionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('sections/:sectionId/modules')
  createModule(@Param('sectionId') sectionId: string, @Body() dto: CreateModuleDto) {
    return this.coursesService.createModule(sectionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('modules/:moduleId/lessons')
  createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.coursesService.createLesson(moduleId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('lessons/:lessonId/content-blocks')
  createContentBlock(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateContentBlockDto,
  ) {
    return this.coursesService.createContentBlock(lessonId, dto);
  }
}
