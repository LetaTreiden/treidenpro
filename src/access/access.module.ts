import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  providers: [AccessService],
  controllers: [AccessController],
  exports: [AccessService],
})
export class AccessModule {}
