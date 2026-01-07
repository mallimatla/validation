/**
 * User DTOs
 */

import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserType {
  FOUNDER = 'FOUNDER',
  INVESTOR = 'INVESTOR',
  ADMIN = 'ADMIN',
}

export class FounderProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @IsOptional()
  @IsBoolean()
  openToInvestors?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @IsOptional()
  @IsBoolean()
  lookingForCofounder?: boolean;
}

export class InvestorProfileDto {
  @IsOptional()
  @IsString()
  firmName?: string;

  @IsOptional()
  @IsString()
  firmType?: string;

  @IsOptional()
  @IsNumber()
  checkSizeMin?: number;

  @IsOptional()
  @IsNumber()
  checkSizeMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geography?: string[];

  @IsOptional()
  @IsString()
  thesis?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;
}

export class OnboardingDto {
  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @ValidateNested()
  @Type(() => FounderProfileDto)
  founderProfile?: FounderProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvestorProfileDto)
  investorProfile?: InvestorProfileDto;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FounderProfileDto)
  founderProfile?: FounderProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvestorProfileDto)
  investorProfile?: InvestorProfileDto;
}
