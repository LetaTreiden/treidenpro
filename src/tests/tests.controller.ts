import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTestDto } from './dto/create-test.dto';
import { SubmitTestAttemptDto } from './dto/submit-test-attempt.dto';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  createTest(@Body() dto: CreateTestDto, @CurrentUser() user: { sub: string }) {
    return this.testsService.createTest(dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':testId/start')
  startTest(@Param('testId') testId: string, @CurrentUser() user: { sub: string }) {
    return this.testsService.startTest(testId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':testId/attempts')
  submitAttempt(
    @Param('testId') testId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SubmitTestAttemptDto,
  ) {
    return this.testsService.submitAttempt(testId, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('diagnostic/recommendation/me')
  getMyDiagnosticRecommendation(@CurrentUser() user: { sub: string }) {
    return this.testsService.getMyDiagnosticRecommendation(user.sub);
  }
}
