import Link from 'next/link';
import { runComplianceStateAction } from '@/actions/ai';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWorkflowNav } from '@/components/projects/project-workflow-nav';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}

export default async function Compliance({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{phase?:string}>}) {
  const {id}=await params;
  const selectedPhase=(await searchParams).phase==='final'?'final':'preliminary';
  const {supabase,user,project}=await getOwnedProjectPage(id);
  const [scriptResult,preliminaryResult,finalResult,mediaResult]=await Promise.all([
    supabase.from('scripts').select('id').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).eq('phase','preliminary').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('media_assets').select('id',{count:'exact',head:true}).eq('project_id',id).eq('user_id',user.id).eq('media_revision',project.media_revision),
  ]);
  const loadError=scriptResult.error || preliminaryResult.error || finalResult.error || mediaResult.error;
  if(loadError) throw new Error('โหลด Compliance ไม่สำเร็จ');
  const mediaReady=(mediaResult.count??0)>0 && project.has_ai_content_label;
  const action=runComplianceStateAction.bind(null,id);
  const checks=[
    {phase:'preliminary',title:'Preliminary Check',description:'ตรวจข้อความและคำกล่าวอ้างหลังสร้างสคริปต์',check:preliminaryResult.data},
    {phase:'final',title:'Final Safety Check',description:'ตรวจเวอร์ชันปัจจุบันหลัง Media และ AI Content Label',check:finalResult.data},
  ] as const;

  return <AppShell><ProjectWorkflowNav current={selectedPhase} projectId={id}/>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">ศูนย์ตรวจความปลอดภัย</h1><p className="mt-2 text-slate-500">ต้องผ่านการตรวจความปลอดภัยขั้นสุดท้าย จึงจะอนุมัติและเข้าคิวเผยแพร่ได้</p></div>
      <div className="flex flex-wrap gap-3">
        {checks.map(({phase,title,check})=><WorkflowActionForm action={action} confirmMessage={check?`รัน ${title} ใหม่หรือไม่? ผลเดิมและ Approval ที่เกี่ยวข้องจะหมดอายุ`:''} disabled={!scriptResult.data || (phase==='final' && !mediaReady)} hiddenFields={{phase}} initialRequestId={crypto.randomUUID()} key={phase} label={phase==='preliminary'?'ตรวจเบื้องต้น':'ตรวจขั้นสุดท้าย'} pendingLabel="กำลังตรวจความปลอดภัย…"/>)}
      </div>
    </div>
    {selectedPhase==='final' && !mediaReady?<Card className="mt-6 border-amber-200 bg-amber-50 text-sm text-amber-900">การตรวจขั้นสุดท้ายจะเปิดเมื่อสร้าง Media อย่างน้อยหนึ่งรายการและเปิด AI Content Label แล้ว</Card>:null}
    {!scriptResult.data?<Card className="mt-6 text-center">กรุณาสร้างสคริปต์ก่อน</Card>:<div className="mt-6 space-y-5">
      {checks.map(({phase,title,description,check})=>{
        const tone=check?.status==='PASS'?'green':check?.status==='BLOCK'?'red':'orange';
        return <Card className={check?.status==='BLOCK'?'border-red-300 bg-red-50':''} key={phase}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{check?<Badge tone={tone}>{check.status}</Badge>:<Badge tone="orange">ยังไม่ตรวจ</Badge>}</div>
          {!check?<p className="mt-5 text-slate-500">ยังไม่มีผลตรวจรอบนี้</p>:<div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><p>คะแนนความเสี่ยง: {check.risk_score}</p><h3 className="mt-4 font-bold">ประเด็นที่พบ</h3><ul className="mt-2 list-disc pl-5">{list(check.issues).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">คำต้องห้าม</h3><p>{list(check.prohibited_words).join(', ')||'ไม่พบ'}</p>{check.status==='BLOCK'?<p className="mt-4 font-bold text-red-700">BLOCK: ไม่สามารถส่งไปคิวเผยแพร่ได้</p>:null}</div>
            <div><h3 className="font-bold">ข้อกำหนดที่ยังไม่ครบ</h3><ul className="mt-2 list-disc pl-5">{list(check.missing_requirements).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">แนวทางแก้ไข</h3><ul className="mt-2 list-disc pl-5">{list(check.suggested_fixes).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">ข้อความปรับแก้ที่ปลอดภัย</h3><p className="mt-2 leading-7">{check.safe_rewrite}</p></div>
          </div>}
        </Card>;
      })}
    </div>}
    {selectedPhase==='preliminary' && preliminaryResult.data?.status==='PASS'?<div className="mt-6 flex justify-end"><Link className="btn" href={`/projects/${id}/media`}>ไป Media Studio</Link></div>:null}
    {selectedPhase==='final' && finalResult.data?.status==='PASS'?<div className="mt-6 flex justify-end"><Link className="btn" href={`/projects/${id}/approval`}>ไป Human Approval</Link></div>:null}
  </AppShell>;
}
