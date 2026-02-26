import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.assignmentsService.createAssignment(dto, user.sub);
  }

  @Get(':assignmentId')
  getAssignment(@Param('assignmentId') assignmentId: string) {
    return this.assignmentsService.getAssignment(assignmentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':assignmentId/submissions')
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submitAssignment(assignmentId, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':assignmentId/submissions/me')
  getMySubmissions(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.assignmentsService.getMySubmissions(assignmentId, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Get('submissions/pending')
  getPendingSubmissions() {
    return this.assignmentsService.getPendingSubmissions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Patch('submissions/:submissionId/review')
  reviewSubmission(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.assignmentsService.reviewSubmission(submissionId, user.sub, dto);
  }
}
