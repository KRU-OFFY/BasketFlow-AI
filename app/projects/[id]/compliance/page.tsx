import { runComplianceFromForm } from '@/actions/ai';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}

export default async function Compliance({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {supabase,user}=await getOwnedProjectPage(id);
  const [scriptResult,preliminaryResult,finalResult]=await Promise.all([
    supabase.from('scripts').select('id').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).eq('phase','preliminary').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  ]);
  const loadError=scriptResult.error || preliminaryResult.error || finalResult.error;
  if(loadError) throw new Error('โหลด Compliance ไม่สำเร็จ');
  const action=runComplianceFromForm.bind(null,id);
  const checks=[
    {phase:'preliminary',title:'Preliminary Check',description:'ตรวจข้อความและคำกล่าวอ้างหลังสร้างสคริปต์',check:preliminaryResult.data},
    {phase:'final',title:'Final Safety Check',description:'ตรวจเวอร์ชันปัจจุบันหลัง Media และ AI Content Label',check:finalResult.data},
  ] as const;

  return <AppShell>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Compliance Center</h1><p className="mt-2 text-slate-500">ต้องผ่าน Final Safety Check จึงจะอนุมัติและเข้าคิวเผยแพร่ได้</p></div>
      <div className="flex flex-wrap gap-3">
        {checks.map(({phase,title})=><form action={action} key={phase}>
          <input name="request_id" type="hidden" value={crypto.randomUUID()}/>
          <input name="phase" type="hidden" value={phase}/>
          <button className="btn" disabled={!scriptResult.data}>{phase==='preliminary'?'ตรวจเบื้องต้น':'ตรวจขั้นสุดท้าย'}</button>
          <span className="sr-only">{title}</span>
        </form>)}
      </div>
    </div>
    {!scriptResult.data?<Card className="mt-6 text-center">กรุณาสร้างสคริปต์ก่อน</Card>:<div className="mt-6 space-y-5">
      {checks.map(({phase,title,description,check})=>{
        const tone=check?.status==='PASS'?'green':check?.status==='BLOCK'?'red':'orange';
        return <Card className={check?.status==='BLOCK'?'border-red-300 bg-red-50':''} key={phase}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{check?<Badge tone={tone}>{check.status}</Badge>:<Badge tone="orange">ยังไม่ตรวจ</Badge>}</div>
          {!check?<p className="mt-5 text-slate-500">ยังไม่มีผลตรวจรอบนี้</p>:<div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><p>Risk score: {check.risk_score}</p><h3 className="mt-4 font-bold">Issues</h3><ul className="mt-2 list-disc pl-5">{list(check.issues).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">Prohibited Words</h3><p>{list(check.prohibited_words).join(', ')||'ไม่พบ'}</p>{check.status==='BLOCK'?<p className="mt-4 font-bold text-red-700">BLOCK: ไม่สามารถส่งไป Publishing Queue ได้</p>:null}</div>
            <div><h3 className="font-bold">Missing Requirements</h3><ul className="mt-2 list-disc pl-5">{list(check.missing_requirements).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">Suggested Fixes</h3><ul className="mt-2 list-disc pl-5">{list(check.suggested_fixes).map(x=><li key={x}>{x}</li>)}</ul><h3 className="mt-4 font-bold">Safe Rewrite</h3><p className="mt-2 leading-7">{check.safe_rewrite}</p></div>
          </div>}
        </Card>;
      })}
    </div>}
  </AppShell>;
}
