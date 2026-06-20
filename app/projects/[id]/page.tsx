import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { WorkflowStepper } from '@/components/projects/stepper';
import { mockProject } from '@/lib/mock-data';

const workflowLinks = [
  ['brief', 'AI Brief Studio', 'สร้าง Product Brief และ Content Angles'],
  ['script', 'Script Studio', 'สร้างสคริปต์พร้อม Affiliate Disclosure'],
  ['compliance', 'Compliance Center', 'ตรวจคำเคลมเสี่ยงและข้อกำหนดที่ขาด'],
  ['media', 'Media Studio', 'จัดการ placeholder สำหรับ voice/avatar/subtitle'],
  ['approval', 'Approval Gate', 'อนุมัติด้วยมนุษย์ก่อนเผยแพร่'],
];

export default function Project({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{mockProject.title}</h1>
          <p className="mt-2 text-slate-500">Project ID: {params.id}</p>
        </div>
        <Badge tone="purple">{mockProject.status}</Badge>
      </div>
      <div className="mt-5"><WorkflowStepper current={mockProject.status} /></div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workflowLinks.map(([slug, title, description]) => (
          <Link href={`/projects/${params.id}/${slug}`} key={slug}>
            <Card className="h-full hover:border-orange">
              <h2 className="font-bold">{title}</h2>
              <p className="mt-2 text-sm text-slate-500">{description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
