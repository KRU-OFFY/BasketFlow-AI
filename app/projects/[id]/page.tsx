import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";
import { getProject } from "@/lib/data";

const links = ["brief", "script", "compliance", "media", "approval"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <AppShell><PageHeader title={project.title} description="Workflow step-by-step" /><WorkflowStepper current={1} /><Card className="mt-6"><div className="flex items-center justify-between"><div><p>สถานะโปรเจกต์</p><Badge tone="purple">{project.status}</Badge></div><p className="text-sm text-slate-500">Compliance: {project.compliance_status ?? "ยังไม่ตรวจ"}</p></div><div className="mt-6 grid gap-3 md:grid-cols-5">{links.map((link) => <Link className="rounded-xl border p-4 text-center hover:bg-slate-50" key={link} href={`/projects/${id}/${link}`}>{link}</Link>)}</div></Card></AppShell>;
}
