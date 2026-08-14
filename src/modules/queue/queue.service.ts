import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const JOBS_QUEUE = 'jobs-queue';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(JOBS_QUEUE)
    private readonly jobsQueue: Queue,
  ) {}

  async addJob(
    jobId: string,
    type: string,
    payload: Record<string, unknown>,
    options: { priority: number; attempts: number },
  ) {
    const job = await this.jobsQueue.add(
      type,
      { jobId, type, payload },
      {
        priority: options.priority,
        attempts: options.attempts,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s base: 2s, 4s, 8s, 16s...
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    );

    this.logger.log(
      `Job added to queue: ${job.id} (type: ${type}, priority: ${options.priority})`,
    );

    return job;
  }

  async removeJob(bullJobId: string): Promise<void> {
    const job = await this.jobsQueue.getJob(bullJobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job removed from queue: ${bullJobId}`);
    }
  }

  async getQueueStats(): Promise<Record<string, unknown>> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobsQueue.getWaitingCount(),
      this.jobsQueue.getActiveCount(),
      this.jobsQueue.getCompletedCount(),
      this.jobsQueue.getFailedCount(),
      this.jobsQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      isPaused: await this.jobsQueue.isPaused(),
    };
  }
}
