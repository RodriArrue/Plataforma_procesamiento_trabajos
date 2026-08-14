import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { JobStatus } from '../../common/enums/job-status.enum';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly queueService: QueueService,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      type: createJobDto.type,
      payload: createJobDto.payload,
      priority: createJobDto.priority ?? 5,
      maxAttempts: createJobDto.maxAttempts ?? 3,
      status: JobStatus.PENDING,
    });

    const savedJob = await this.jobRepository.save(job);

    // Dispatch to BullMQ queue
    const bullJob = await this.queueService.addJob(
      savedJob.id,
      savedJob.type,
      savedJob.payload,
      {
        priority: savedJob.priority,
        attempts: savedJob.maxAttempts,
      },
    );

    // Update with BullMQ job ID
    savedJob.bullJobId = bullJob.id ?? null;
    await this.jobRepository.save(savedJob);

    this.logger.log(
      `Job created: ${savedJob.id} (type: ${savedJob.type}, bullJobId: ${bullJob.id})`,
    );

    return savedJob;
  }

  async findAll(
    queryDto: QueryJobsDto,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const { type, status, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .orderBy('job.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('job.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    return job;
  }

  async cancel(id: string): Promise<Job> {
    const job = await this.findOne(id);

    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING jobs can be cancelled. Current status: ${job.status}`,
      );
    }

    // Remove from BullMQ queue
    if (job.bullJobId) {
      await this.queueService.removeJob(job.bullJobId);
    }

    job.status = JobStatus.FAILED;
    job.error = 'Job cancelled by user';
    job.failedAt = new Date();

    return this.jobRepository.save(job);
  }

  async retry(id: string): Promise<Job> {
    const job = await this.findOne(id);

    if (job.status !== JobStatus.FAILED) {
      throw new BadRequestException(
        `Only FAILED jobs can be retried. Current status: ${job.status}`,
      );
    }

    // Reset job state
    job.status = JobStatus.PENDING;
    job.error = null;
    job.result = null;
    job.progress = 0;
    job.failedAt = null;
    job.processedAt = null;

    const savedJob = await this.jobRepository.save(job);

    // Re-dispatch to queue
    const bullJob = await this.queueService.addJob(
      savedJob.id,
      savedJob.type,
      savedJob.payload,
      {
        priority: savedJob.priority,
        attempts: savedJob.maxAttempts,
      },
    );

    savedJob.bullJobId = bullJob.id ?? null;
    await this.jobRepository.save(savedJob);

    this.logger.log(`Job retried: ${savedJob.id}`);

    return savedJob;
  }

  async getStats(): Promise<Record<string, unknown>> {
    const statusCounts = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.status')
      .getRawMany<{ status: string; count: string }>();

    const typeCounts = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.type')
      .getRawMany<{ type: string; count: string }>();

    const total = await this.jobRepository.count();

    const avgProcessingTime = await this.jobRepository
      .createQueryBuilder('job')
      .select(
        'AVG(EXTRACT(EPOCH FROM (job.processedAt - job.createdAt)))',
        'avgSeconds',
      )
      .where('job.status = :status', { status: JobStatus.COMPLETED })
      .andWhere('job.processedAt IS NOT NULL')
      .getRawOne<{ avgSeconds: string | null }>();

    const queueStats = await this.queueService.getQueueStats();

    return {
      total,
      byStatus: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = parseInt(item.count, 10);
          return acc;
        },
        {} as Record<string, number>,
      ),
      byType: typeCounts.reduce(
        (acc, item) => {
          acc[item.type] = parseInt(item.count, 10);
          return acc;
        },
        {} as Record<string, number>,
      ),
      avgProcessingTimeSeconds: avgProcessingTime?.avgSeconds
        ? parseFloat(avgProcessingTime.avgSeconds)
        : null,
      queue: queueStats,
    };
  }

  // Methods called by processors to update job status
  async markAsProcessing(id: string): Promise<void> {
    await this.jobRepository.update(id, {
      status: JobStatus.PROCESSING,
    });
  }

  async markAsCompleted(
    id: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    await this.jobRepository.update(id, {
      status: JobStatus.COMPLETED,
      result: result as any,
      processedAt: new Date(),
    });
  }

  async markAsFailed(id: string, error: string, attempts: number): Promise<void> {
    await this.jobRepository.update(id, {
      status: JobStatus.FAILED,
      error,
      attempts,
      failedAt: new Date(),
    });
  }

  async markAsRetrying(id: string, attempts: number): Promise<void> {
    await this.jobRepository.update(id, {
      status: JobStatus.RETRYING,
      attempts,
    });
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.jobRepository.update(id, { progress });
  }
}
