import { generateScriptFromForm } from '@/actions/ai';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getOwnedProjectPage } from '@/lib/supabase/page';

function list(value:unknown):string[]{return Array.isArray(value)?value.map(String):[];}
export default async function Script({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const {supabase,user}=await getOwnedProjectPage(id);
  const [{data:brief,error:briefError},{data:script,error:scriptError}]=await Promise.all([supabase.from('ai_briefs').select('id').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),supabase.from('scripts').select('*').eq('project_id',id).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle()]);
  if(briefError || scriptError) throw new Error(`โหลดสคริปต์ไม่สำเร็จ: ${briefError?.message || scriptError?.message}`);
  const action=generateScriptFromForm.bind(null,id);
  return <AppShell><h1 className="text-3xl font-bold">Script Studio</h1><div className="mt-6 grid gap-4 lg:grid-cols-[.7fr_1.3fr]"><Card><form action={action}><input name="request_id" type="hidden" value={crypto.randomUUID()}/><label className="label" htmlFor="duration">Duration</label><select className="input mt-1" defaultValue="30" id="duration" name="duration">{[15,30,60,90].map(x=><option key={x} value={x}>{x} seconds</option>)}</select><button className="btn mt-4" disabled={!brief}>{script?'สร้างสคริปต์ใหม่':'Generate Script'}</button></form>{!brief?<p className="mt-3 text-sm text-orange-700">กรุณาสร้าง AI Brief ก่อน</p>:null}</Card><Card>{!script?<p className="text-center font-bold">ยังไม่มีสคริปต์</p>:<><div className="flex gap-2"><Badge tone="green">Affiliate Disclosure Included</Badge><Badge tone="purple">{script.duration_seconds}s</Badge></div><h2 className="mt-4 font-bold">Hook</h2><p>{script.hook}</p><h2 className="mt-4 font-bold">Full Script</h2><p className="mt-2 whitespace-pre-wrap leading-7">{script.full_script}</p><h3 className="mt-5 font-bold">Subtitle Lines</h3><ol className="mt-3 list-decimal pl-5">{list(script.subtitle_lines).map((line,index)=><li key={`${line}-${index}`}>{line}</li>)}</ol></>}</Card></div></AppShell>;
}
