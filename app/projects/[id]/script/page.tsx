import Link from 'next/link';
import { generateScriptStateAction } from '@/actions/ai';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}
export default async function Script({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user}=await getOwnedProjectPage(id);
  const [{data:brief,error:briefError},{data:script,error:scriptError}]=await Promise.all([supabase.from('ai_briefs').select('id').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),supabase.from('scripts').select('*').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle()]);
  if(briefError || scriptError) throw new Error('โหลดสคริปต์ไม่สำเร็จ กรุณาลองใหม่');
  const action=generateScriptStateAction.bind(null,id);
  return <AppShell><ProjectWorkflowNav current="script" projectId={id}/><h1 className="text-3xl font-bold">Hook & Script Studio</h1><div className="mt-6 grid gap-4 lg:grid-cols-[.7fr_1.3fr]"><Card><WorkflowActionForm action={action} buttonClassName="btn mt-4" confirmMessage={script?'สร้างสคริปต์เวอร์ชันใหม่หรือไม่? Media, Final Compliance และ Approval เดิมจะหมดอายุ':''} disabled={!brief} initialRequestId={crypto.randomUUID()} label={script?'สร้างสคริปต์ใหม่':'สร้างสคริปต์'} pendingLabel="กำลังสร้างสคริปต์…"><label className="label" htmlFor="duration">ความยาวคลิป</label><select className="input mt-1" defaultValue="30" id="duration" name="duration">{[15,30,60,90].map(x=><option key={x} value={x}>{x} วินาที</option>)}</select></WorkflowActionForm>{!brief?<p className="mt-3 text-sm text-orange-700">กรุณาสร้าง AI Brief ก่อน</p>:null}</Card><Card>{!script?<p className="text-center font-bold">ยังไม่มีสคริปต์</p>:<><div className="flex flex-wrap gap-2"><Badge tone="green">มี Affiliate Disclosure</Badge><Badge tone="purple">{script.duration_seconds} วินาที</Badge></div><h2 className="mt-4 font-bold">Hook ที่เลือก</h2><p>{script.selected_hook??script.hook}</p>{list(script.hook_candidates).length?<><h3 className="mt-4 font-bold">Hook candidates</h3><ul className="mt-2 list-disc pl-5">{list(script.hook_candidates).map(x=><li key={x}>{x}</li>)}</ul></>:null}<h2 className="mt-4 font-bold">สคริปต์เต็ม</h2><p className="mt-2 whitespace-pre-wrap leading-7">{script.full_script}</p><h3 className="mt-5 font-bold">บรรทัดคำบรรยาย</h3><ol className="mt-3 list-decimal pl-5">{list(script.subtitle_lines).map((line,index)=><li key={`${line}-${index}`}>{line}</li>)}</ol></>}</Card></div>{script?<div className="mt-6 flex justify-end"><Link className="btn" href={`/projects/${id}/compliance?phase=preliminary`}>ไปตรวจ Preliminary Compliance</Link></div>:null}</AppShell>;
}
