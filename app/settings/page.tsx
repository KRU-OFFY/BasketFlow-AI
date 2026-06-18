import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  return <AppShell><PageHeader title="Settings" description="ข้อมูลผู้ใช้และนโยบาย AI" /><div className="grid gap-6 md:grid-cols-2"><Card><h2 className="font-bold">บัญชี</h2><p className="mt-2 text-sm">User ID: {user?.id ?? "demo-user"}</p><p className="text-sm">Email: {user?.email ?? "demo@example.com"}</p><p className="text-sm">Full name: {String(user?.user_metadata?.full_name ?? "Demo Creator")}</p><p className="text-sm">Role: creator</p></Card><Card className="bg-orange-50"><h2 className="font-bold text-orange-900">Compliance policy reminder</h2><p className="mt-2 text-sm text-orange-800">ต้องเปิดเผย Affiliate link, ติดป้ายกำกับ AI เมื่อใช้เสียง/ภาพ AI และห้ามกล่าวอ้างเกินจริง</p><p className="mt-4 text-sm">AI settings: provider mock เป็นค่าเริ่มต้น</p></Card></div></AppShell>;
}
