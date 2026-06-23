import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import '@/styles/globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { authOptions } from '@/lib/auth';
import { APP_CONFIG } from '@/lib/constants/app-config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.APP_NAME} — Plateforme santé`,
  description: `${APP_CONFIG.APP_NAME} : recherche de praticiens, rendez-vous en ligne, dossier patient et outils pour les cabinets (multi-spécialités).`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
