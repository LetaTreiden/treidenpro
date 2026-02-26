import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificates/certificates.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import configuration from './config/configuration';
import { CoursesModule } from './courses/courses.module';
import { EventsModule } from './events/events.module';
import { FrontendModule } from './frontend/frontend.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RatingsModule } from './ratings/ratings.module';
import { RedisModule } from './redis/redis.module';
import { TestsModule } from './tests/tests.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    RedisModule,
    EventsModule,
    UsersModule,
    AuthModule,
    FrontendModule,
    AccessModule,
    CoursesModule,
    TestsModule,
    AssignmentsModule,
    CertificatesModule,
    RatingsModule,
    PaymentsModule,
    AdminModule,
  ],
  providers: [LoggingInterceptor],
})
export class AppModule {}
