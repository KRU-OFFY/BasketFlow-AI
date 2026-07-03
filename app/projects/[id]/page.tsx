import Link from 'next/link';
import { archiveProjectStateAction } from '@/actions/projects';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { WorkflowStepper } from '@/components/projects/stepper';
import { getOwnedProjectPage } from '@/lib/supabase/page';
import { projectStatusLabel } from '@/lib/workflow/status';

const links=[['brief','AI Brief Studio','วิเคราะห์สินค้าและมุมคอนเทนต์'],['script','Script Studio','สร้างสคริปต์พร้อม Affiliate Disclosure'],['compliance','Compliance Center','ตรวจคำเคลมและข้อกำหนด'],['media','Media Studio','จัดการเสียง ภาพ และ AI Content Label'],['approval','Human Approval','ตรวจและอนุมัติก่อนเข้าคิว']];
export default async function Project({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {project,product}=await getOwnedProjectPage(id);
  const archive=archiveProjectStateAction.bind(null,id);
  return <AppShell><ProjectWorkflowNav current="overview" projectId={id}/><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{project.title}</h1><p className="mt-2 text-slate-500">สินค้า: {product.title}</p></div><Badge tone="purple">{projectStatusLabel(project.status)}</Badge></div><div className="mt-5"><WorkflowStepper current={project.status}/></div><Card className="mt-6"><div className="grid gap-3 text-sm md:grid-cols-5"><p>Final Compliance: <b>{project.compliance_status??'ยังไม่ตรวจ'}</b></p><p>Approval: <b>{project.approval_status==='approved'?'อนุมัติแล้ว':project.approval_status==='rejected'?'ปฏิเสธ':'รอดำเนินการ'}</b></p><p>Affiliate: <b>{project.has_affiliate_disclosure?'ครบ':'ยังไม่มี'}</b></p><p>AI Label: <b>{project.has_ai_content_label?'เปิด':'ปิด'}</b></p><p>Media revision: <b>{project.media_revision}</b></p></div></Card><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{links.map(([slug,title,description])=><Link href={`/projects/${id}/${slug}`} key={slug}><Card className="h-full hover:border-orange"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></Card></Link>)}</div><div className="mt-8 border-t border-slate-200 pt-6"><WorkflowActionForm action={archive} buttonClassName="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50" confirmMessage="เก็บโปรเจกต์นี้เข้าคลังหรือไม่? ข้อมูลจะไม่ถูกลบและสามารถกู้คืนได้" initialRequestId={crypto.randomUUID()} label="เก็บโปรเจกต์เข้าคลัง" pendingLabel="กำลังเก็บเข้าคลัง…"/></div></AppShell>;
}
