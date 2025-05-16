import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes
const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware((authObject, req) => {
  // If the request is not for a public route, then protect it.
  if (!isPublicRoute(req)) {
    authObject.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};