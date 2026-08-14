import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QueueService, JOBS_QUEUE } from './queue.service';
import { JobProcessor } from './processors/job.processor';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JOBS_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: JOBS_QUEUE,
      adapter: BullMQAdapter,
    }),
    forwardRef(() => JobsModule),
  ],
  providers: [QueueService, JobProcessor],
  exports: [QueueService],
})
export class QueueModule {}
