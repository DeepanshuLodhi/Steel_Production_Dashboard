import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Steel Production Dashboard',
  description: 'Real-time monitoring dashboard for steel production KPIs including coils production, tonnage, and shipping metrics.',
  keywords: 'steel production, dashboard, KPI, monitoring, real-time, analytics',
  authors: [{ name: 'Steel Production Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Steel Production Dashboard',
    description: 'Real-time monitoring dashboard for steel production KPIs',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#667eea" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body suppressHydrationWarning={true}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}