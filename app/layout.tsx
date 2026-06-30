import './globals.css';
import type { Metadata } from 'next';
import { BASKETPILOT_NAME, BASKETPILOT_TAGLINE } from '@/components/brand/basketpilot-logo';
import { DatadogRum } from '@/components/observability/datadog-rum';

export const metadata: Metadata = {
  title: BASKETPILOT_NAME,
  description: BASKETPILOT_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <DatadogRum />
        {children}
      </body>
    </html>
  );
}
