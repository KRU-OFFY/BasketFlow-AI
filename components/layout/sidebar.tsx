import Link from "next/link";
import { logout } from "@/actions/auth";

const nav = [
  ["แดชบอร์ด", "/dashboard"],
  ["สินค้า", "/products"],
  ["โปรเจกต์", "/projects"],
  ["คิวเผยแพร่", "/posting-queue"],
  ["Analytics", "/analytics"],
  ["ตั้งค่า", "/settings"],
  ["AI Logs", "/settings/ai-logs"]
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 bg-slate-950 p-6 text-white lg:block">
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 p-4">
        <p className="text-xs uppercase tracking-wide text-white/70">Shopee Affiliate</p>
        <h1 className="text-xl font-bold">AI Product Review Video Bot</h1>
      </div>
      <nav className="space-y-2">
        {nav.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
            {label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="absolute bottom-6 left-6 right-6">
        <button className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm">ออกจากระบบ</button>
      </form>
    </aside>
  );
}
