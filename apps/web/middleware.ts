import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/validate(.*)', // Allow validation without auth for demo
  '/api(.*)',
]);

export default clerkMiddleware((auth, request) => {
  // All routes are public for now - auth is handled at page level
  // For protected routes, redirect to sign-in if not authenticated
  if (!isPublicRoute(request)) {
    const { userId } = auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
