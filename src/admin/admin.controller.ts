import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateAssignmentDto } from '../assignments/dto/create-assignment.dto';
import { ReviewSubmissionDto } from '../assignments/dto/review-submission.dto';
import { IssueCertificateDto } from '../certificates/dto/issue-certificate.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateCourseVersionDto } from '../courses/dto/create-course-version.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { UpdateCourseVersionDto } from '../courses/dto/update-course-version.dto';
import { CreateOrderDto } from '../payments/dto/create-order.dto';
import { CreateTestDto } from '../tests/dto/create-test.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics/overview')
  analyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/events')
  analyticsEvents(@Query('days') days?: string) {
    const parsed = days ? Number(days) : 30;
    return this.adminService.getEventAnalytics(Number.isNaN(parsed) ? 30 : parsed);
  }

  @Get('events/recent')
  recentEvents(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.adminService.getRecentEvents(Number.isNaN(parsed) ? 100 : parsed);
  }

  @Get('submissions/pending')
  pendingSubmissions() {
    return this.adminService.getPendingSubmissions();
  }

  @Patch('submissions/:submissionId/review')
  reviewSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.reviewSubmission(submissionId, user.sub, dto);
  }

  @Post('certificates/issue')
  issueCertificate(@Body() dto: IssueCertificateDto, @CurrentUser() user: { sub: string }) {
    return this.adminService.issueCertificate(dto, user.sub);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.adminService.courses.createCourse(dto);
  }

  @Patch('courses/:courseId')
  updateCourse(@Param('courseId') courseId: string, @Body() dto: UpdateCourseDto) {
    return this.adminService.courses.updateCourse(courseId, dto);
  }

  @Post('courses/:courseId/versions')
  createCourseVersion(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseVersionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.courses.createCourseVersion(courseId, dto, user.sub);
  }

  @Patch('courses/:courseId/versions/:versionId')
  updateCourseVersion(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateCourseVersionDto,
  ) {
    return this.adminService.courses.updateCourseVersion(courseId, versionId, dto);
  }

  @Post('tests')
  createTest(@Body() dto: CreateTestDto, @CurrentUser() user: { sub: string }) {
    return this.adminService.tests.createTest(dto, user.sub);
  }

  @Post('assignments')
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.createAssignment(dto, user.sub);
  }

  @Post('payments/orders/:userId')
  createOrderForUser(
    @Param('userId') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.adminService.payments.createYookassaOrder(userId, dto);
  }
}
