import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AlertProvider } from '@/contexts/AlertContext';
import { AlertBanner } from '@/components/Alert/AlertBanner';

export const metadata: Metadata = {
  title: 'Thermal-X | AI Industrial Fire & Persistent Thermal Intelligence',
  description:
    'Spatio-temporal AI detection, baseline tracking, and explainable classification of industrial fires and persistent thermal sources. Built for SIH26162.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          background: 'var(--background)',
          color: '#f5ede0',
          fontFamily: "'Inter', -apple-system, sans-serif",
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <AlertProvider>
          <AlertBanner />
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
