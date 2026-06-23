import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession['user'] & {
      id: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  }
}
