import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { RatingsModule } from '../ratings/ratings.module';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  imports: [RatingsModule, EventsModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
