import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Analytics() {
  const {supabase,user}=await getPageContext();
  const projectCount=(field?:string,value?:string)=>{let q=supabase.from('review_projects').select('*',{count:'exact',head:true}).eq('user_id',user.id).is('archived_at',null);if(field&&value)q=q.eq(field,value);return q;};
  const complianceCount=(status:string)=>supabase.from('compliance_checks').select('id,review_projects!inner(archived_at)',{count:'exact',head:true}).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).is('review_projects.archived_at',null).eq('status',status);
  const results=await Promise.all([projectCount(),projectCount('approval_status','approved'),projectCount('status','ready_to_publish'),projectCount('status','blocked'),complianceCount('PASS'),complianceCount('WARNING'),complianceCount('BLOCK')]);
  const error=results.map(x=>x.error).find(Boolean);if(error)throw new Error('โหลด Analytics ไม่สำเร็จ กรุณาลองใหม่');
  const labels=['โปรเจกต์ทั้งหมด','อนุมัติแล้ว','พร้อมเผยแพร่','ถูกบล็อก','Compliance PASS','Compliance WARNING','Compliance BLOCK'];
  return <AppShell><h1 className="text-3xl font-bold">Analytics</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{labels.map((label,index)=><Card key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{results[index].count??0}</p></Card>)}</div><Card className="mt-6"><h2 className="font-bold">Affiliate Metrics</h2><p className="mt-2 text-slate-500">พื้นที่สำหรับ clicks, orders และ commission ในเวอร์ชันถัดไป</p></Card></AppShell>;
}
