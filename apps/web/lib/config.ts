/**
 * Centralized configuration for the Startup Verdict web application
 *
 * Primary Domain: StartupVerdict.com
 * Redirect Domain: IdeaJury.com → StartupVerdict.com
 */

// API URL - uses environment variable in production, falls back to production URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.startupverdict.com';

// App URL - the main website URL
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://startupverdict.com';

// Domain configuration
export const DOMAINS = {
  primary: 'startupverdict.com',
  redirect: 'ideajury.com',
  api: 'api.startupverdict.com',
} as const;

// App metadata
export const APP_NAME = 'Startup Verdict';
export const APP_DESCRIPTION = 'Get your startup idea validated by 12 AI agents representing real investor perspectives';
export const APP_TAGLINE = 'The AI Validation Council for Startup Ideas';
