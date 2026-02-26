import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { RatingsModule } from '../ratings/ratings.module';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [RatingsModule, EventsModule],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
