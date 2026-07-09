import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { WorkflowStepper } from '@/components/projects/stepper';
import { getOwnedProjectPage } from '@/lib/supabase/page';

const links=[['brief','AI Brief Studio','วิเคราะห์สินค้าและมุมคอนเทนต์'],['script','Script Studio','สร้างสคริปต์พร้อม Affiliate Disclosure'],['compliance','Compliance Center','ตรวจคำเคลมและข้อกำหนด'],['media','Media Studio','จัดการเสียง ภาพ และ AI Content Label'],['approval','Human Approval','ตรวจและอนุมัติก่อนเข้าคิว']];

export default async function Project({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {project,product}=await getOwnedProjectPage(id);

  return <AppShell>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="mt-2 text-slate-500">สินค้า: {product.title}</p>
      </div>
      <Badge tone="purple">{project.status}</Badge>
    </div>
    <div className="mt-5"><WorkflowStepper current={project.status}/></div>
    <Card className="mt-6">
      <div className="grid gap-3 text-sm md:grid-cols-4">
        <p>Compliance: <b>{project.compliance_status??'ยังไม่ตรวจ'}</b></p>
        <p>Approval: <b>{project.approval_status}</b></p>
        <p>Affiliate: <b>{project.has_affiliate_disclosure?'ครบ':'ยังไม่มี'}</b></p>
        <p>AI Label: <b>{project.has_ai_content_label?'เปิด':'ปิด'}</b></p>
      </div>
    </Card>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{links.map(([slug,title,description])=><Link href={`/projects/${id}/${slug}`} key={slug}>
      <Card className="h-full hover:border-orange"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></Card>
    </Link>)}</div>
  </AppShell>;
}
