import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { JobType } from '../../../common/enums/job-type.enum';

export class CreateJobDto {
  @ApiProperty({
    enum: JobType,
    description: 'Type of job to process',
    example: JobType.SEND_EMAIL,
  })
  @IsEnum(JobType)
  @IsNotEmpty()
  type!: JobType;

  @ApiProperty({
    description: 'Job payload data',
    example: {
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Hello from the Job Processing Platform',
    },
  })
  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Job priority (1 = highest, 10 = lowest)',
    example: 5,
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts',
    example: 3,
    minimum: 1,
    maximum: 10,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;
}
