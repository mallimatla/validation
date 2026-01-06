import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Validation Council - AI-Powered Startup Validation',
  description: 'Validate your startup idea with 12 specialized AI agents',
  icons: {
    icon: '/favicon.svg',
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
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
