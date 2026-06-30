import Link from 'next/link';
import { BasketPilotLogo } from '@/components/brand/basketpilot-logo';

const links = [
  ['/dashboard', 'แดชบอร์ด'],
  ['/products', 'สินค้า'],
  ['/projects', 'โปรเจกต์'],
  ['/posting-queue', 'คิวเผยแพร่'],
  ['/analytics', 'Analytics'],
  ['/settings', 'ตั้งค่า'],
  ['/settings/ai-logs', 'AI Logs'],
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-navy p-6 text-white lg:block">
      <Link href="/dashboard" className="mb-8 block rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10">
        <BasketPilotLogo inverted />
      </Link>
      <nav className="space-y-2">
        {links.map(([href, label]) => (
          <Link
            className="block rounded-xl px-4 py-3 text-slate-200 transition hover:bg-white/10 hover:text-white"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
