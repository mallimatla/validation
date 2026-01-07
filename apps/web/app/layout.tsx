import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { UserProvider } from '../contexts/UserContext';
import { APP_NAME, APP_DESCRIPTION, DOMAINS } from '../lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} - AI-Powered Startup Validation`,
  description: APP_DESCRIPTION,
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL(`https://${DOMAINS.primary}`),
  openGraph: {
    title: `${APP_NAME} - AI-Powered Startup Validation`,
    description: APP_DESCRIPTION,
    url: `https://${DOMAINS.primary}`,
    siteName: APP_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - AI-Powered Startup Validation`,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <UserProvider>{children}</UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
