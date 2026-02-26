import { Module } from '@nestjs/common';
import { FrontendService } from './frontend.service';
import { LessonsController } from './lessons.controller';
import { ModulesController } from './modules.controller';
import { ProfileController } from './profile.controller';
import { ProgressController } from './progress.controller';
import { TracksController } from './tracks.controller';

@Module({
  controllers: [
    ProfileController,
    TracksController,
    ModulesController,
    LessonsController,
    ProgressController,
  ],
  providers: [FrontendService],
})
export class FrontendModule {}
