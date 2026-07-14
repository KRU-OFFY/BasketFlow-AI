import './globals.css';
import type { Metadata } from 'next';
import { BASKETFLOW_DESCRIPTION, BASKETFLOW_NAME } from '@/components/brand/basketflow-logo';

export const metadata: Metadata = {
  title: BASKETFLOW_NAME,
  description: BASKETFLOW_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
