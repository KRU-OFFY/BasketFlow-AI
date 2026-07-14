import Link from 'next/link';
import { BasketFlowLogo } from '@/components/brand/basketflow-logo';
import { NavigationLinks } from './navigation-links';

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-navy p-6 text-white lg:block">
      <Link href="/dashboard" className="mb-8 block rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10">
        <BasketFlowLogo idPrefix="app-sidebar" inverted />
      </Link>
      <nav className="space-y-2">
        <NavigationLinks />
      </nav>
    </aside>
  );
}
