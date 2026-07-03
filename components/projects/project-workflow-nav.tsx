import Link from 'next/link';
import { getOwnedProjectPage } from '@/lib/supabase/page';

export type WorkflowStep='overview'|'brief'|'script'|'preliminary'|'media'|'final'|'approval'|'queue';

export async function ProjectWorkflowNav({projectId,current}:{projectId:string;current:WorkflowStep}){
  const {supabase,user,project}=await getOwnedProjectPage(projectId);
  const [briefResult,scriptResult,preliminaryResult,finalResult,mediaResult,approvalResult,queueResult]=await Promise.all([
    supabase.from('ai_briefs').select('id').eq('project_id',projectId).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('scripts').select('id').eq('project_id',projectId).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('id,status').eq('project_id',projectId).eq('user_id',user.id).eq('phase','preliminary').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('id,status,script_id,media_revision').eq('project_id',projectId).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('media_assets').select('id',{count:'exact',head:true}).eq('project_id',projectId).eq('user_id',user.id).eq('media_revision',project.media_revision),
    supabase.from('approvals').select('id,status,script_id,compliance_check_id,media_revision').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('posting_queue').select('id,status').eq('project_id',projectId).eq('user_id',user.id).in('status',['ready','scheduled']).limit(1).maybeSingle(),
  ]);
  const error=[briefResult.error,scriptResult.error,preliminaryResult.error,finalResult.error,mediaResult.error,approvalResult.error,queueResult.error].find(Boolean);
  if(error)throw new Error('โหลดสถานะ Workflow ไม่สำเร็จ');
  const script=scriptResult.data;
  const finalCheck=finalResult.data;
  const approval=approvalResult.data;
  const mediaReady=(mediaResult.count??0)>0 && project.has_ai_content_label;
  const finalReady=finalCheck?.status==='PASS' && finalCheck.script_id===script?.id && finalCheck.media_revision===project.media_revision;
  const approvalReady=approval?.status==='approved' && approval.script_id===script?.id && approval.compliance_check_id===finalCheck?.id && approval.media_revision===project.media_revision;
  const steps=[
    {id:'overview',label:'สินค้า',href:`/projects/${projectId}`,done:true,locked:false,reason:''},
    {id:'brief',label:'AI Brief',href:`/projects/${projectId}/brief`,done:Boolean(briefResult.data),locked:false,reason:''},
    {id:'script',label:'Hook / Script',href:`/projects/${projectId}/script`,done:Boolean(script),locked:!briefResult.data,reason:'ต้องสร้าง AI Brief ก่อน'},
    {id:'preliminary',label:'ตรวจเบื้องต้น',href:`/projects/${projectId}/compliance?phase=preliminary`,done:Boolean(preliminaryResult.data),locked:!script,reason:'ต้องสร้างสคริปต์ก่อน'},
    {id:'media',label:'Media / AI Label',href:`/projects/${projectId}/media`,done:mediaReady,locked:preliminaryResult.data?.status!=='PASS',reason:'Preliminary Check ต้อง PASS ก่อน'},
    {id:'final',label:'ตรวจขั้นสุดท้าย',href:`/projects/${projectId}/compliance?phase=final`,done:finalReady,locked:!mediaReady,reason:'ต้องมี Media และเปิด AI Content Label ก่อน'},
    {id:'approval',label:'อนุมัติ',href:`/projects/${projectId}/approval`,done:approvalReady,locked:!finalReady,reason:'Final Safety Check ต้อง PASS ก่อน'},
    {id:'queue',label:'คิวเผยแพร่',href:'/posting-queue',done:Boolean(queueResult.data),locked:!approvalReady,reason:'ต้องอนุมัติเวอร์ชันปัจจุบันก่อน'},
  ] as const;
  return <section aria-label="ขั้นตอนโปรเจกต์" className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm"><Link className="font-semibold text-purple hover:underline" href="/projects">โปรเจกต์</Link><span aria-hidden="true">/</span><Link className="font-semibold text-navy hover:underline" href={`/projects/${projectId}`}>{project.title}</Link></div>
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-8">
      {steps.map((step,index)=>{
        const active=step.id===current;
        const classes=`block h-full rounded-2xl border p-3 text-sm transition ${active?'border-orange bg-orange/10 text-navy':step.done?'border-emerald-200 bg-emerald-50 text-emerald-900':step.locked?'border-slate-100 bg-slate-50 text-slate-400':'border-slate-200 bg-white text-navy hover:border-purple'}`;
        const content=<><span className="block text-xs font-bold">ขั้น {index+1}</span><span className="mt-1 block font-semibold">{step.label}</span>{step.locked?<span className="mt-1 block text-[11px] leading-4">{step.reason}</span>:null}</>;
        return <li key={step.id}>{step.locked?<div aria-disabled="true" className={classes}>{content}</div>:<Link aria-current={active?'step':undefined} className={classes} href={step.href}>{content}</Link>}</li>;
      })}
    </ol>
  </section>;
}
