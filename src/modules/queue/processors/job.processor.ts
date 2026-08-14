import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobsService } from '../../jobs/jobs.service';
import { JOBS_QUEUE } from '../queue.service';
import { JobType } from '../../../common/enums/job-type.enum';

interface JobData {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
}

@Processor(JOBS_QUEUE, {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000, // Max 10 jobs per second
  },
})
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<Record<string, unknown>> {
    const { jobId, type, payload } = job.data;

    this.logger.log(`Processing job ${jobId} (type: ${type}, attempt: ${job.attemptsMade + 1})`);

    // Update DB status to PROCESSING
    await this.jobsService.markAsProcessing(jobId);

    // Route to the appropriate handler
    switch (type) {
      case JobType.SEND_EMAIL:
        return this.processEmail(job, jobId, payload);
      case JobType.GENERATE_REPORT:
        return this.processReport(job, jobId, payload);
      case JobType.PROCESS_IMAGE:
        return this.processImage(job, jobId, payload);
      case JobType.NOTIFICATION:
        return this.processNotification(job, jobId, payload);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  // ─── Email Processor ───────────────────────────────────────────────
  private async processEmail(
    job: Job<JobData>,
    jobId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { to, subject, body } = payload as {
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!to) throw new Error('Email "to" field is required');

    this.logger.log(`📧 Sending email to ${to}`);

    // Simulate email sending (1-3 seconds)
    await this.simulateWork(1000, 3000);
    await job.updateProgress(50);
    await this.jobsService.updateProgress(jobId, 50);

    // Simulate SMTP response
    await this.simulateWork(500, 1500);
    await job.updateProgress(100);
    await this.jobsService.updateProgress(jobId, 100);

    const result = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      to,
      subject: subject || '(no subject)',
      body: body ? `${String(body).substring(0, 50)}...` : '(no body)',
      deliveredAt: new Date().toISOString(),
      provider: 'simulated-smtp',
    };

    this.logger.log(`📧 Email sent successfully to ${to}`);
    return result;
  }

  // ─── Report Processor ──────────────────────────────────────────────
  private async processReport(
    job: Job<JobData>,
    jobId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { reportType, dateRange, format } = payload as {
      reportType?: string;
      dateRange?: { from: string; to: string };
      format?: string;
    };

    this.logger.log(`📊 Generating report: ${reportType || 'general'}`);

    const steps = [
      'Collecting data',
      'Processing records',
      'Generating charts',
      'Building document',
      'Finalizing report',
    ];

    for (let i = 0; i < steps.length; i++) {
      this.logger.log(`📊 Step ${i + 1}/${steps.length}: ${steps[i]}`);

      // Simulate heavy processing (1-2 seconds per step)
      await this.simulateWork(1000, 2000);

      const progress = Math.round(((i + 1) / steps.length) * 100);
      await job.updateProgress(progress);
      await this.jobsService.updateProgress(jobId, progress);
    }

    const result = {
      reportUrl: `https://storage.example.com/reports/report_${Date.now()}.${format || 'pdf'}`,
      reportType: reportType || 'general',
      format: format || 'pdf',
      dateRange: dateRange || { from: 'all', to: 'all' },
      pages: Math.floor(Math.random() * 50) + 10,
      fileSize: `${(Math.random() * 5 + 1).toFixed(2)} MB`,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`📊 Report generated successfully`);
    return result;
  }

  // ─── Image Processor ───────────────────────────────────────────────
  private async processImage(
    job: Job<JobData>,
    jobId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { imageUrl, operations } = payload as {
      imageUrl?: string;
      operations?: string[];
    };

    if (!imageUrl) throw new Error('Image URL is required');

    const ops = operations || ['resize', 'compress'];
    this.logger.log(`🖼️ Processing image: ${imageUrl} (ops: ${ops.join(', ')})`);

    for (let i = 0; i < ops.length; i++) {
      this.logger.log(`🖼️ Applying operation: ${ops[i]}`);

      // Simulate image processing (1-3 seconds per operation)
      await this.simulateWork(1000, 3000);

      const progress = Math.round(((i + 1) / ops.length) * 100);
      await job.updateProgress(progress);
      await this.jobsService.updateProgress(jobId, progress);
    }

    const result = {
      originalUrl: imageUrl,
      processedUrl: `https://cdn.example.com/processed/img_${Date.now()}.webp`,
      operations: ops,
      originalSize: `${(Math.random() * 10 + 2).toFixed(2)} MB`,
      processedSize: `${(Math.random() * 2 + 0.1).toFixed(2)} MB`,
      dimensions: {
        width: 1920,
        height: 1080,
      },
      processedAt: new Date().toISOString(),
    };

    this.logger.log(`🖼️ Image processed successfully`);
    return result;
  }

  // ─── Notification Processor ────────────────────────────────────────
  private async processNotification(
    job: Job<JobData>,
    jobId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { userId, channel, title, message } = payload as {
      userId?: string;
      channel?: string;
      title?: string;
      message?: string;
    };

    if (!userId) throw new Error('User ID is required for notifications');

    const notifChannel = channel || 'push';
    this.logger.log(`🔔 Sending ${notifChannel} notification to user ${userId}`);

    // Simulate notification sending (0.5-2 seconds)
    await this.simulateWork(500, 2000);
    await job.updateProgress(100);
    await this.jobsService.updateProgress(jobId, 100);

    const result = {
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      channel: notifChannel,
      title: title || 'Notification',
      message: message || '',
      delivered: true,
      deliveredAt: new Date().toISOString(),
    };

    this.logger.log(`🔔 Notification sent to user ${userId} via ${notifChannel}`);
    return result;
  }

  // ─── Worker Events ─────────────────────────────────────────────────
  @OnWorkerEvent('completed')
  async onCompleted(job: Job<JobData>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`✅ Job completed: ${jobId}`);
    await this.jobsService.markAsCompleted(
      jobId,
      job.returnvalue as Record<string, unknown>,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobData> | undefined, error: Error): Promise<void> {
    if (!job) return;

    const { jobId } = job.data;
    const willRetry = job.attemptsMade < (job.opts.attempts ?? 3);

    if (willRetry) {
      this.logger.warn(
        `⚠️ Job ${jobId} failed (attempt ${job.attemptsMade}/${job.opts.attempts}), will retry. Error: ${error.message}`,
      );
      await this.jobsService.markAsRetrying(jobId, job.attemptsMade);
    } else {
      this.logger.error(
        `❌ Job ${jobId} failed permanently after ${job.attemptsMade} attempts. Error: ${error.message}`,
      );
      await this.jobsService.markAsFailed(jobId, error.message, job.attemptsMade);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<JobData>): void {
    this.logger.log(
      `▶️ Job started: ${job.data.jobId} (attempt ${job.attemptsMade + 1})`,
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  private simulateWork(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
