import Link from 'next/link';
import { generateBriefStateAction } from '@/actions/ai';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}
export default async function Brief({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user,product}=await getOwnedProjectPage(id);
  const {data:brief,error}=await supabase.from('ai_briefs').select('*').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error) throw new Error('โหลด AI Brief ไม่สำเร็จ กรุณาลองใหม่');
  const action=generateBriefStateAction.bind(null,id);
  return <AppShell><ProjectWorkflowNav current="brief" projectId={id}/><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">AI Brief Studio</h1><p className="mt-2 text-slate-500">{product.title} · Mock AI mode</p></div><WorkflowActionForm action={action} confirmMessage={brief?'สร้าง Brief เวอร์ชันใหม่หรือไม่? Script และผลตรวจเดิมจะหมดอายุ':''} initialRequestId={crypto.randomUUID()} label={brief?'สร้าง Brief ใหม่':'สร้าง AI Brief'} pendingLabel="กำลังวิเคราะห์สินค้า…"/></div>{!brief?<Card className="mt-6 text-center"><p className="font-bold">ยังไม่มี AI Brief</p><p className="mt-2 text-slate-500">กดสร้าง AI Brief เพื่อเริ่มวิเคราะห์สินค้า</p></Card>:<><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card><Badge tone={brief.risk_level==='low'?'green':'orange'}>ความเสี่ยง: {brief.risk_level}</Badge><h2 className="mt-4 text-xl font-bold">สรุปสินค้า</h2><p className="mt-2">{brief.product_summary}</p><h3 className="mt-4 font-bold">กลุ่มเป้าหมาย</h3><p>{brief.target_audience}</p><h3 className="mt-4 font-bold">จุดขายหลัก</h3><p>{brief.usp}</p></Card><Card><h2 className="font-bold">มุมคอนเทนต์</h2><ul className="mt-3 list-disc pl-5">{list(brief.content_angles).map(x=><li key={x}>{x}</li>)}</ul><h2 className="mt-5 font-bold">ไอเดีย Hook</h2><ul className="mt-3 list-disc pl-5">{list(brief.hook_ideas).map(x=><li key={x}>{x}</li>)}</ul><h2 className="mt-5 font-bold">หมายเหตุสำหรับ Creator</h2><p>{brief.creator_note}</p></Card></div><div className="mt-6 flex justify-end"><Link className="btn" href={`/projects/${id}/script`}>ไป Script Studio</Link></div></>}</AppShell>;
}
