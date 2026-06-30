import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Queue() {
  const {supabase,user}=await getPageContext();
  const {data:rows,error}=await supabase.from('posting_queue').select('*,review_projects!posting_queue_project_owner_fkey(id,title,products!review_projects_product_owner_fkey(title))').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error) throw new Error(`โหลด Publishing Queue ไม่สำเร็จ: ${error.message}`);
  return <AppShell><h1 className="text-3xl font-bold">Publishing Queue</h1>{!rows?.length?<Card className="mt-6 text-center"><p className="font-bold">ยังไม่มีรายการในคิวเผยแพร่</p><p className="mt-2 text-slate-500">โปรเจกต์ต้องผ่าน Compliance PASS, Human Approval, Affiliate disclosure และ AI label</p></Card>:<div className="mt-6 space-y-4">{rows.map(row=><Card key={row.id}><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-bold">{row.review_projects?.title??'โปรเจกต์'}</p><p className="text-sm text-slate-500">สินค้า: {row.review_projects?.products?.title??'-'}</p></div><div className="flex items-center gap-3"><Badge tone={row.status==='failed'?'red':row.status==='published'?'green':'purple'}>{row.status}</Badge><Link className="text-sm font-bold text-orange" href={`/projects/${row.project_id}`}>ดูโปรเจกต์</Link></div></div></Card>)}</div>}</AppShell>;
}
