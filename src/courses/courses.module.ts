import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { EventsModule } from '../events/events.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [AccessModule, EventsModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
