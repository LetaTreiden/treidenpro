import { Injectable } from '@nestjs/common';
import { AssignmentsService } from '../assignments/assignments.service';
import { CreateAssignmentDto } from '../assignments/dto/create-assignment.dto';
import { ReviewSubmissionDto } from '../assignments/dto/review-submission.dto';
import { CertificatesService } from '../certificates/certificates.service';
import { IssueCertificateDto } from '../certificates/dto/issue-certificate.dto';
import { CoursesService } from '../courses/courses.service';
import { EventsService } from '../events/events.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestsService } from '../tests/tests.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
    private readonly testsService: TestsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly certificatesService: CertificatesService,
    private readonly paymentsService: PaymentsService,
    private readonly eventsService: EventsService,
  ) {}

  getAnalyticsOverview() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.order.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.certificate.count(),
      this.prisma.assignmentSubmission.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.testAttempt.count(),
    ]).then(
      ([users, courses, successfulOrders, certificates, pendingSubmissions, attempts]) => ({
        users,
        courses,
        successfulOrders,
        certificates,
        pendingSubmissions,
        testAttempts: attempts,
      }),
    );
  }

  getEventAnalytics(days = 30) {
    return this.eventsService.getEventCountsByName(days);
  }

  getRecentEvents(limit = 100) {
    return this.eventsService.getRecent(limit);
  }

  getPendingSubmissions() {
    return this.assignmentsService.getPendingSubmissions();
  }

  createAssignment(dto: CreateAssignmentDto, creatorId: string) {
    return this.assignmentsService.createAssignment(dto, creatorId);
  }

  reviewSubmission(
    submissionId: string,
    reviewerId: string,
    dto: ReviewSubmissionDto,
  ) {
    return this.assignmentsService.reviewSubmission(submissionId, reviewerId, dto);
  }

  issueCertificate(dto: IssueCertificateDto, issuerId: string) {
    return this.certificatesService.issueCertificate(dto, issuerId);
  }

  // Expose domain services for admin panel usage.
  get courses() {
    return this.coursesService;
  }

  get tests() {
    return this.testsService;
  }

  get payments() {
    return this.paymentsService;
  }
}
