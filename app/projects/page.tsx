import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProject } from '@/lib/mock-data';

export default function Projects() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Review Projects</h1>
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold">{mockProject.title}</p>
            <p className="mt-1 text-sm text-slate-500">สถานะปัจจุบัน: {mockProject.status}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="green">{mockProject.compliance_status}</Badge>
            <Badge tone="orange">{mockProject.approval_status}</Badge>
            <Link className="btn" href={`/projects/${mockProject.id}`}>เปิด Workflow</Link>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
