import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { listProjects } from "@/lib/data";

export default async function AnalyticsPage() {
  const projects = await listProjects();
  const rows = [["total projects", projects.length], ["approved projects", projects.filter((p) => p.approval_status === "approved").length], ["ready to publish", projects.filter((p) => p.status === "ready_to_publish").length], ["blocked projects", projects.filter((p) => p.status === "blocked").length]];
  return <AppShell><PageHeader title="Analytics" description="ตัวชี้วัดพื้นฐานสำหรับ MVP" /><div className="grid gap-4 md:grid-cols-4">{rows.map(([label, value]) => <Card key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></Card>)}</div></AppShell>;
}
