import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly eventsService: EventsService,
  ) {}

  async createAssignment(dto: CreateAssignmentDto, creatorId: string) {
    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        maxScore: dto.maxScore || 100,
        courseId: dto.courseId,
        courseVersionId: dto.courseVersionId,
        lessonId: dto.lessonId,
      },
    });

    await this.eventsService.logEvent({
      userId: creatorId,
      eventName: 'assignment.created',
      payload: { assignmentId: assignment.id, title: dto.title },
    });

    return assignment;
  }

  getAssignment(assignmentId: string) {
    return this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
  }

  async submitAssignment(
    assignmentId: string,
    userId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    await this.eventsService.logEvent({
      userId,
      eventName: 'assignment.submitted',
      payload: { assignmentId, submissionId: submission.id },
    });

    return submission;
  }

  getMySubmissions(assignmentId: string, userId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPendingSubmissions() {
    return this.prisma.assignmentSubmission.findMany({
      where: {
        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW] },
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        assignment: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    dto: ReviewSubmissionDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const status = dto.status
      ? (dto.status as SubmissionStatus)
      : SubmissionStatus.REVIEWED;

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
    });

    if (status === SubmissionStatus.REVIEWED) {
      const normalized = Math.round((dto.score / submission.assignment.maxScore) * 100);
      const points = Math.max(5, Math.round(normalized / 5));
      await this.ratingsService.addPoints(
        submission.userId,
        points,
        'assignment_reviewed',
        submissionId,
      );
    }

    await this.eventsService.logEvent({
      userId: reviewerId,
      eventName: 'assignment.reviewed',
      payload: { submissionId, status, score: dto.score },
    });

    return updated;
  }
}
