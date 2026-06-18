import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SafetyCard } from "@/components/compliance/safety-card";
import { listProducts, listProjects } from "@/lib/data";

export default async function DashboardPage() {
  const [products, projects] = await Promise.all([listProducts(), listProjects()]);
  const pendingApproval = projects.filter((p) => p.status === "pending_approval" || p.approval_status === "pending").length;
  const ready = projects.filter((p) => p.status === "ready_to_publish").length;
  const blocked = projects.filter((p) => p.status === "blocked").length;
  const stats = [
    ["สินค้าทั้งหมด", products.length],
    ["โปรเจกต์ทั้งหมด", projects.length],
    ["รออนุมัติ", pendingApproval],
    ["พร้อมเผยแพร่", ready],
    ["ถูกบล็อก", blocked]
  ];
  return (
    <AppShell>
      <PageHeader title="Dashboard" description="ภาพรวม workflow สำหรับรีวิวสินค้า Shopee Affiliate" action={<Link className="rounded-xl bg-orange-500 px-4 py-2 text-white" href="/products/new">นำเข้าสินค้า</Link>} />
      <div className="grid gap-4 md:grid-cols-5">{stats.map(([label, value]) => <Card key={label} className="bg-white"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></Card>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><h2 className="mb-4 text-xl font-bold">Recent projects</h2><div className="space-y-3">{projects.map((p) => <Link href={`/projects/${p.id}`} key={p.id} className="flex items-center justify-between rounded-xl border p-3"><span>{p.title}</span><Badge tone={p.status === "blocked" ? "red" : "purple"}>{p.status}</Badge></Link>)}</div></Card>
        <SafetyCard />
      </div>
    </AppShell>
  );
}
