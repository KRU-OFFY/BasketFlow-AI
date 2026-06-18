import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
