import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Session NextAuth : ouverture uniquement après succès du couple access/refresh
 * (login mot de passe / 2FA géré dans la page via l’API Nest, puis signIn avec jetons).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        accessToken: { label: 'Access token', type: 'text' },
        refreshToken: { label: 'Refresh token', type: 'text' },
      },
      async authorize(credentials) {
        const accessToken = credentials?.accessToken?.trim();
        const refreshToken = credentials?.refreshToken?.trim();
        if (!accessToken || !refreshToken) return null;

        try {
          const r = await fetch(`${apiBase}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!r.ok) return null;
          const u = (await r.json()) as {
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            role?: string;
          };
          return {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            accessToken,
            refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id: string;
          email?: string | null;
          firstName?: string;
          lastName?: string;
          role?: string;
          accessToken?: string;
          refreshToken?: string;
        };
        token.id = u.id;
        token.email = u.email;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.role = u.role;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
      }
      if (trigger === 'update' && session && typeof session === 'object') {
        const s = session as Record<string, unknown>;
        if (s.firstName !== undefined) token.firstName = (s.firstName as string) || undefined;
        if (s.lastName !== undefined) token.lastName = (s.lastName as string) || undefined;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const su = session.user as typeof session.user & {
          id?: string;
          firstName?: string;
          lastName?: string;
          role?: string;
        };
        su.id = token.id as string;
        su.email = token.email as string;
        su.firstName = token.firstName as string | undefined;
        su.lastName = token.lastName as string | undefined;
        su.role = token.role as string | undefined;
      }
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
