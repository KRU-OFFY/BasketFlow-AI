import './globals.css';
import type { Metadata } from 'next';
import { BASKETPILOT_NAME, BASKETPILOT_TAGLINE } from '@/components/brand/basketpilot-logo';

export const metadata: Metadata = {
  title: BASKETPILOT_NAME,
  description: BASKETPILOT_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
