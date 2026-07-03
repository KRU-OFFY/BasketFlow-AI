import Link from 'next/link';
import { createMediaAssetStateAction, type MediaType } from '@/actions/media';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { AiLabelToggle } from '@/components/projects/ai-label-toggle';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { THAI_AI_CONTENT_LABEL } from '@/lib/ai/constants';
import { getOwnedProjectPage } from '@/lib/supabase/page';

const types:MediaType[]=['voiceover','avatar','subtitle','video_preview','rendered_video'];
export default async function Media({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user,project}=await getOwnedProjectPage(id);
  const {data:assets,error}=await supabase.from('media_assets').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false});
  if(error) throw new Error('โหลด Media Assets ไม่สำเร็จ กรุณาลองใหม่');
  return <AppShell><ProjectWorkflowNav current="media" projectId={id}/><h1 className="text-3xl font-bold">Media Studio</h1><p className="mt-2 text-slate-500">สร้างสื่อจำลองและยืนยัน AI Content Label ก่อนตรวจขั้นสุดท้าย</p><div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">{types.map(type=>{const action=createMediaAssetStateAction.bind(null,id,type);return <Card key={type}><Badge tone="purple">Mock</Badge><h2 className="mt-4 font-bold">{type}</h2><WorkflowActionForm action={action} buttonClassName="btn mt-4 text-sm" confirmMessage={assets?.some(asset=>asset.type===type)?'สร้าง Media เวอร์ชันใหม่หรือไม่? Final Compliance และ Approval เดิมจะหมดอายุ':''} initialRequestId={crypto.randomUUID()} label="สร้าง Placeholder" pendingLabel="กำลังสร้าง…"/></Card>;})}</div><Card className="mt-6"><AiLabelToggle initial={project.has_ai_content_label} projectId={id}/><p className="mt-3 text-sm">{THAI_AI_CONTENT_LABEL}</p></Card><div className="mt-6 space-y-3">{assets?.map(asset=><Card key={asset.id}><div className="flex items-center justify-between"><b>{asset.type}</b><Badge tone="purple">{asset.provider}</Badge></div><p className="mt-2 text-xs text-slate-500">Media revision {asset.media_revision}</p><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(asset.metadata,null,2)}</pre></Card>)}</div>{assets?.length && project.has_ai_content_label?<div className="mt-6 flex justify-end"><Link className="btn" href={`/projects/${id}/compliance?phase=final`}>ไป Final Safety Check</Link></div>:null}</AppShell>;
}
