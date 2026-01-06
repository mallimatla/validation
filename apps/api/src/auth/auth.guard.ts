/**
 * Auth Guard
 * Protects routes requiring authentication
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // For public routes, still try to extract user if token is present
    if (isPublic) {
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const { userId } = await this.authService.verifyToken(token);
          const user = await this.authService.getOrCreateUser(userId);
          request.user = user;
        } catch {
          // Ignore auth errors on public routes - just proceed without user
        }
      }
      return true;
    }

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    // Check for API key auth
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      const user = await this.authService.verifyApiKey(apiKey);

      if (!user) {
        throw new UnauthorizedException('Invalid API key');
      }

      request.user = user;
      return this.checkPermissions(context, user);
    }

    // Check for Bearer token auth
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { userId } = await this.authService.verifyToken(token);
      const user = await this.authService.getOrCreateUser(userId);

      request.user = user;
      return this.checkPermissions(context, user);
    }

    throw new UnauthorizedException('Invalid authorization format');
  }

  private async checkPermissions(context: ExecutionContext, user: any): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check user permissions based on subscription plan
    // This would be expanded to check actual permissions
    return true;
  }
}
