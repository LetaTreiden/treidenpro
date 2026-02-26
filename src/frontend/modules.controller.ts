import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';
import { ReorderModulesRequestDto } from './dto/reorder-modules-request.dto';
import { UpdateModuleRequestDto } from './dto/update-module-request.dto';
import { FrontendService } from './frontend.service';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly frontendService: FrontendService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('reorder')
  reorderModules(@Body() dto: ReorderModulesRequestDto) {
    return this.frontendService.reorderModules(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':moduleId')
  updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleRequestDto,
  ) {
    return this.frontendService.updateModule(moduleId, dto);
  }

  @Get(':moduleId/lessons')
  listModuleLessons(@Param('moduleId') moduleId: string) {
    return this.frontendService.listModuleLessons(moduleId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':moduleId/lessons')
  createModuleLesson(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.frontendService.createModuleLesson(moduleId, dto, user.sub);
  }
}
