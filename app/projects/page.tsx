import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listProjects } from "@/lib/data";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return <AppShell><PageHeader title="Review Projects" description="ติดตามโปรเจกต์ตั้งแต่ brief ถึง publishing queue" />{projects.length ? <div className="space-y-3">{projects.map((p) => <Link href={`/projects/${p.id}`} key={p.id}><Card className="flex items-center justify-between"><div><h2 className="font-bold">{p.title}</h2><p className="text-sm text-slate-500">Product: {p.product_id}</p></div><Badge tone={p.status === "blocked" ? "red" : "purple"}>{p.status}</Badge></Card></Link>)}</div> : <EmptyState title="ยังไม่มีโปรเจกต์" href="/products" action="เลือกสินค้าเพื่อสร้างโปรเจกต์" />}</AppShell>;
}
