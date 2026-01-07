/**
 * Users Controller
 * API endpoints for user profile and onboarding
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { OnboardingDto, UpdateUserDto, UpdateProfileDto, UserType } from './users.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req: any) {
    return this.usersService.getUserProfile(req.user.id);
  }

  /**
   * Complete onboarding with role selection
   */
  @Post('onboarding')
  @UseGuards(AuthGuard)
  async completeOnboarding(@Request() req: any, @Body() body: OnboardingDto) {
    return this.usersService.completeOnboarding(req.user.id, body);
  }

  /**
   * Update user basic info
   */
  @Put('me')
  @UseGuards(AuthGuard)
  async updateUser(@Request() req: any, @Body() body: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, body);
  }

  /**
   * Update user profile (founder or investor profile)
   */
  @Put('me/profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.usersService.updateUserProfile(req.user.id, body);
  }

  /**
   * Switch user type
   */
  @Post('me/switch-type')
  @UseGuards(AuthGuard)
  async switchType(@Request() req: any, @Body() body: { userType: UserType }) {
    return this.usersService.switchUserType(req.user.id, body.userType);
  }

  /**
   * Get subscription usage and limits
   */
  @Get('me/usage')
  @UseGuards(AuthGuard)
  async getUsage(@Request() req: any) {
    return this.usersService.getSubscriptionUsage(req.user.id);
  }
}
