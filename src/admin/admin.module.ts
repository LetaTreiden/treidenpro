import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { CoursesModule } from '../courses/courses.module';
import { EventsModule } from '../events/events.module';
import { PaymentsModule } from '../payments/payments.module';
import { TestsModule } from '../tests/tests.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    CoursesModule,
    TestsModule,
    AssignmentsModule,
    CertificatesModule,
    PaymentsModule,
    EventsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
