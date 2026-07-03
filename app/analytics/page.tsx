import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Analytics() {
  const {supabase,user}=await getPageContext();
  const [projectsResult,checksResult]=await Promise.all([
    supabase.from('review_projects').select('id,status,approval_status').eq('user_id',user.id).is('archived_at',null),
    supabase.from('compliance_checks').select('project_id,status,created_at').eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}),
  ]);
  if(projectsResult.error||checksResult.error)throw new Error('โหลด Analytics ไม่สำเร็จ กรุณาลองใหม่');
  const projects=projectsResult.data??[];
  const activeIds=new Set(projects.map(project=>project.id));
  const latestChecks=new Map<string,string>();
  for(const check of checksResult.data??[])if(activeIds.has(check.project_id)&&!latestChecks.has(check.project_id))latestChecks.set(check.project_id,check.status);
  const results=[projects.length,projects.filter(project=>project.approval_status==='approved').length,projects.filter(project=>project.status==='ready_to_publish').length,projects.filter(project=>project.status==='blocked').length,[...latestChecks.values()].filter(status=>status==='PASS').length,[...latestChecks.values()].filter(status=>status==='WARNING').length,[...latestChecks.values()].filter(status=>status==='BLOCK').length];
  const labels=['โปรเจกต์ทั้งหมด','อนุมัติแล้ว','พร้อมเผยแพร่','ถูกบล็อก','Compliance PASS','Compliance WARNING','Compliance BLOCK'];
  return <AppShell><h1 className="text-3xl font-bold">Analytics</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{labels.map((label,index)=><Card key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{results[index]}</p></Card>)}</div><Card className="mt-6"><h2 className="font-bold">Affiliate Metrics</h2><p className="mt-2 text-slate-500">พื้นที่สำหรับ clicks, orders และ commission ในเวอร์ชันถัดไป</p></Card></AppShell>;
}
