/**
 * Investor DTOs
 * Data transfer objects for investor features
 */

import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DealQueryDto {
  @ApiPropertyOptional({ description: 'Filter by industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Filter by stage' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ description: 'Minimum score filter' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'overallScore' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of results', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class SaveDealDto {
  @ApiPropertyOptional({ description: 'Private notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Folder/list name' })
  @IsOptional()
  @IsString()
  folder?: string;
}

export enum InterestType {
  INTERESTED = 'INTERESTED',
  VERY_INTERESTED = 'VERY_INTERESTED',
  PASSED = 'PASSED',
  WATCHING = 'WATCHING',
}

export class ExpressInterestDto {
  @ApiProperty({ enum: InterestType, description: 'Type of interest' })
  @IsEnum(InterestType)
  type: InterestType;

  @ApiPropertyOptional({ description: 'Message to founder' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Potential check size' })
  @IsOptional()
  @IsString()
  checkSize?: string;
}

export enum MeetingType {
  INTRO_CALL = 'INTRO_CALL',
  DEEP_DIVE = 'DEEP_DIVE',
  DEMO = 'DEMO',
  PITCH = 'PITCH',
}

export class RequestMeetingDto {
  @ApiProperty({ enum: MeetingType, description: 'Type of meeting' })
  @IsEnum(MeetingType)
  type: MeetingType;

  @ApiProperty({ description: 'Reason for meeting request' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Preferred meeting times' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[];

  @ApiPropertyOptional({ description: 'Investor calendly link' })
  @IsOptional()
  @IsString()
  calendlyLink?: string;
}

export class RespondMeetingDto {
  @ApiProperty({ description: 'Accept or decline', enum: ['ACCEPTED', 'DECLINED'] })
  @IsString()
  status: 'ACCEPTED' | 'DECLINED';

  @ApiPropertyOptional({ description: 'Response message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Scheduled meeting time' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Meeting link' })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}

export class MakePublicDto {
  @ApiPropertyOptional({ description: 'Pitch deck URL' })
  @IsOptional()
  @IsString()
  pitchDeckUrl?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Allow meeting requests', default: true })
  @IsOptional()
  allowMeetings?: boolean;

  @ApiPropertyOptional({ description: 'Allow messages', default: true })
  @IsOptional()
  allowMessages?: boolean;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsOptional()
  @IsString()
  founderLinkedIn?: string;
}
