import NextAuth from 'next-auth';

import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, protectedRoutes, publicRoutes } from '@/routes';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(req => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname) || publicRoutes.some(route => nextUrl.pathname.startsWith(route));

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && isProtectedRoute) {
    return Response.redirect(new URL('/auth/sign-in', nextUrl));
  }

  return null;
});

export const config = {
  // copied from clerk
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
