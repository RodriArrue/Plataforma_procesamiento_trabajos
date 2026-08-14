import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JobType } from '../../../common/enums/job-type.enum';
import { JobStatus } from '../../../common/enums/job-status.enum';

export class QueryJobsDto {
  @ApiPropertyOptional({
    enum: JobType,
    description: 'Filter by job type',
  })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional({
    enum: JobStatus,
    description: 'Filter by job status',
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
