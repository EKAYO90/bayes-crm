import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bayes CRM — Sales & Pipeline Management',
  description: 'Purpose-built CRM for Bayes Consulting Limited',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
