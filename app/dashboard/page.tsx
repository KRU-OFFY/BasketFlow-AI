import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Dashboard() {
  const {supabase,user}=await getPageContext();
  const count=(table:string,filter?:[string,string])=>{
    let query=supabase.from(table).select('*',{count:'exact',head:true}).eq('user_id',user.id);
    if(filter)query=query.eq(filter[0],filter[1]);
    return query;
  };
  const [products,projects,pending,ready,blocked,recent]=await Promise.all([
    count('products'),
    count('review_projects'),
    count('review_projects',['approval_status','pending']),
    count('review_projects',['status','ready_to_publish']),
    count('review_projects',['status','blocked']),
    supabase.from('review_projects').select('id,title,status,compliance_status,approval_status').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5),
  ]);
  const firstError=[products.error,projects.error,pending.error,ready.error,blocked.error,recent.error].find(Boolean);
  if(firstError)throw new Error(`โหลด Dashboard ไม่สำเร็จ: ${firstError.message}`);
  const stats=[['สินค้าทั้งหมด',products.count??0],['โปรเจกต์',projects.count??0],['รออนุมัติ',pending.count??0],['พร้อมเผยแพร่',ready.count??0],['ถูกบล็อก',blocked.count??0]];

  return <AppShell>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-semibold text-orange">Mock AI Mode</p><h1 className="text-3xl font-bold">แดชบอร์ด</h1><p className="mt-2 text-slate-500">ภาพรวม workflow รีวิวสินค้าอย่างปลอดภัย</p></div>
      <Link className="btn" href="/products/new">นำเข้าสินค้าใหม่</Link>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-5">{stats.map(([label,value])=><Card key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></Card>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <Card><h2 className="font-bold">โปรเจกต์ล่าสุด</h2><div className="mt-4 space-y-3">{recent.data?.length?recent.data.map(project=><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4" key={project.id}><div><p className="font-semibold">{project.title}</p><p className="text-sm text-slate-500">Compliance: {project.compliance_status??'-'} · Approval: {project.approval_status}</p></div><Link className="text-sm font-bold text-orange" href={`/projects/${project.id}`}>เปิด</Link></div>):<p className="text-slate-500">ยังไม่มีโปรเจกต์</p>}</div></Card>
      <Card className="border-orange/40 bg-orange-50"><Badge tone="orange">Safety Gate</Badge><p className="mt-4 text-sm leading-6">เผยแพร่ได้เมื่อ Compliance PASS, approved, มี Affiliate disclosure และ AI Content Label ครบเท่านั้น</p></Card>
    </div>
  </AppShell>;
}
