import { runComplianceAction } from '@/actions/ai';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}
export default async function Compliance({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user}=await getOwnedProjectPage(id);
  const [{data:script,error:scriptError},{data:check,error:checkError}]=await Promise.all([supabase.from('scripts').select('id').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),supabase.from('compliance_checks').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle()]);
  if(scriptError || checkError) throw new Error(`โหลด Compliance ไม่สำเร็จ: ${scriptError?.message || checkError?.message}`);
  const action=runComplianceAction.bind(null,id); const tone=check?.status==='PASS'?'green':check?.status==='BLOCK'?'red':'orange';
  return <AppShell><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">Compliance Center</h1><form action={action}><button className="btn" disabled={!script}>Run Compliance</button></form></div>{!script?<Card className="mt-6 text-center">กรุณาสร้างสคริปต์ก่อน</Card>:!check?<Card className="mt-6 text-center">ยังไม่มีผลตรวจ Compliance</Card>:<div className="mt-6 grid gap-4 lg:grid-cols-2"><Card className={check.status==='BLOCK'?'border-red-300 bg-red-50':''}><Badge tone={tone}>{check.status}</Badge><p className="mt-4">Risk score: {check.risk_score}</p><h2 className="mt-4 font-bold">Issues</h2><ul className="mt-2 list-disc pl-5">{list(check.issues).map(x=><li key={x}>{x}</li>)}</ul><h2 className="mt-4 font-bold">Prohibited Words</h2><p>{list(check.prohibited_words).join(', ')||'ไม่พบ'}</p>{check.status==='BLOCK'?<p className="mt-4 font-bold text-red-700">BLOCK: ไม่สามารถส่งไป Publishing Queue ได้</p>:null}</Card><Card><h2 className="font-bold">Missing Requirements</h2><ul className="mt-2 list-disc pl-5">{list(check.missing_requirements).map(x=><li key={x}>{x}</li>)}</ul><h2 className="mt-4 font-bold">Suggested Fixes</h2><ul className="mt-2 list-disc pl-5">{list(check.suggested_fixes).map(x=><li key={x}>{x}</li>)}</ul><h2 className="mt-4 font-bold">Safe Rewrite</h2><p className="mt-2 leading-7">{check.safe_rewrite}</p></Card></div>}</AppShell>;
}
