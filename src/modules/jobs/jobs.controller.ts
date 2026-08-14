import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created and queued for processing' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, description: 'Returns job stats by status and type' })
  getStats() {
    return this.jobsService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of jobs' })
  findAll(@Query() queryDto: QueryJobsDto) {
    return this.jobsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Returns job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Job cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.cancel(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 201, description: 'Job re-queued for processing' })
  @ApiResponse({ status: 400, description: 'Job cannot be retried' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.retry(id);
  }
}
