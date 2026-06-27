import { BasketPilotLogo } from '@/components/brand/basketpilot-logo';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-h-screen flex-1 bg-slate-50 p-8">
        <header className="mb-8 rounded-3xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BasketPilotLogo showTagline />
            <div className="rounded-2xl bg-gradient-to-r from-orange/10 via-rose/10 to-purple/10 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-purple">Safe Creator Workflow</p>
              <p className="mt-1 text-sm font-medium text-slate-600">เลือกสินค้า → สร้างสคริปต์ → ตรวจความเสี่ยง → พร้อมปักตะกร้า</p>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
