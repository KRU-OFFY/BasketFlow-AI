import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Projects() {
  const { supabase, user } = await getPageContext();
  const { data:projects, error } = await supabase.from('review_projects').select('*,products!review_projects_product_owner_fkey(title)').eq('user_id',user.id).is('archived_at',null).order('created_at',{ascending:false});
  if (error) throw new Error('โหลดโปรเจกต์ไม่สำเร็จ กรุณาลองใหม่');
  return <AppShell><h1 className="text-3xl font-bold">Review Projects</h1>{!projects?.length?<Card className="mt-6 text-center"><p className="font-bold">ยังไม่มีโปรเจกต์</p><Link className="mt-4 inline-block text-orange" href="/products">เลือกสินค้ามาสร้างโปรเจกต์</Link></Card>:<div className="mt-6 space-y-4">{projects.map((project)=><Card key={project.id}><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-bold">{project.title}</p><p className="mt-1 text-sm text-slate-500">สินค้า: {project.products?.title??'-'} · สถานะ: {project.status}</p></div><div className="flex items-center gap-3"><Badge tone={project.compliance_status==='PASS'?'green':project.compliance_status==='BLOCK'?'red':'orange'}>{project.compliance_status??'ยังไม่ตรวจ'}</Badge><Link className="btn" href={`/projects/${project.id}`}>เปิด Workflow</Link></div></div></Card>)}</div>}</AppShell>;
}
