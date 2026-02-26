import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { RatingsModule } from '../ratings/ratings.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [RatingsModule, EventsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
