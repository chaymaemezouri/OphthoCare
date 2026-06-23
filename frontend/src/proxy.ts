import { withAuth } from 'next-auth/middleware';

/** Protection des routes dashboard / compte (ex-middleware Next.js 16 → proxy). */
export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/account', '/account/:path*'],
};
