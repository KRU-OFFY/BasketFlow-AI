import { BasketFlowLogo } from '@/components/brand/basketflow-logo';
import { logout } from '@/actions/auth';
import { Sidebar } from './sidebar';
import { NavigationLinks } from './navigation-links';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-slate-50 p-4 md:p-8">
        <header className="mb-8 rounded-3xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BasketFlowLogo idPrefix="app-header" showTagline />
            <div className="flex w-full flex-col gap-3 rounded-2xl bg-gradient-to-r from-cyan/10 via-purple/10 to-pink/10 px-4 py-3 text-right sm:w-auto sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-purple">Workflow ที่ปลอดภัยและวัดผลได้</p>
                <p className="mt-1 text-sm font-medium text-slate-600">นำเข้าสินค้า → สร้างคอนเทนต์ → ตรวจความเสี่ยง → ติดตามผลลัพธ์</p>
              </div>
              <form action={logout}><button className="whitespace-nowrap text-sm font-bold text-navy underline">ออกจากระบบ</button></form>
            </div>
          </div>
          <nav className="mt-4 flex gap-3 overflow-x-auto border-t border-slate-100 pt-4 text-sm font-bold text-navy lg:hidden">
            <NavigationLinks mobile />
          </nav>
        </header>
        {children}
      </main>
    </div>
  );
}
