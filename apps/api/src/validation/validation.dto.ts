/**
 * Validation DTOs
 * Data transfer objects for validation endpoints
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum ValidationTier {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ValidationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  AWAITING_DELIBERATION = 'AWAITING_DELIBERATION',
  SYNTHESIZING = 'SYNTHESIZING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateValidationDto {
  @ApiProperty({ description: 'Title of the startup idea' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Detailed description of the idea' })
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  description: string;

  @ApiPropertyOptional({ description: 'Problem being solved' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  problemStatement?: string;

  @ApiPropertyOptional({ description: 'Proposed solution' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  solution?: string;

  @ApiPropertyOptional({ description: 'Target customer profile' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  targetCustomer?: string;

  @ApiPropertyOptional({ description: 'Industry category' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Business model type' })
  @IsString()
  @IsOptional()
  businessModel?: string;

  @ApiPropertyOptional({ description: 'Current stage of the idea' })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ description: 'Target geographies' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  geography?: string[];

  @ApiPropertyOptional({ description: 'Additional founder-provided data' })
  @IsObject()
  @IsOptional()
  founderData?: Record<string, any>;

  @ApiPropertyOptional({ enum: ValidationTier, default: ValidationTier.STANDARD })
  @IsEnum(ValidationTier)
  @IsOptional()
  tier?: ValidationTier;

  @ApiPropertyOptional({ description: 'Specific agents to run' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requestedAgents?: string[];
}

export class UpdateValidationDto {
  @ApiPropertyOptional({ description: 'Title of the startup idea' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the idea' })
  @IsString()
  @IsOptional()
  @MinLength(50)
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Problem being solved' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  problemStatement?: string;

  @ApiPropertyOptional({ description: 'Proposed solution' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  solution?: string;

  @ApiPropertyOptional({ description: 'Target customer profile' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  targetCustomer?: string;

  @ApiPropertyOptional({ description: 'Industry category' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Business model type' })
  @IsString()
  @IsOptional()
  businessModel?: string;

  @ApiPropertyOptional({ description: 'Current stage' })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ description: 'Target geographies' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  geography?: string[];

  @ApiPropertyOptional({ description: 'Additional founder-provided data' })
  @IsObject()
  @IsOptional()
  founderData?: Record<string, any>;
}

export class ValidationQueryDto {
  @ApiPropertyOptional({ enum: ValidationStatus })
  @IsEnum(ValidationStatus)
  @IsOptional()
  status?: ValidationStatus;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
