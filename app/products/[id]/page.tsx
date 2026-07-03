import { notFound } from 'next/navigation';
import { createProjectStateAction } from '@/actions/projects';
import { WorkflowActionForm } from '@/components/actions/workflow-action-form';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function ProductDetail({params}:{params:Promise<{id:string}>}) {
  const { id } = await params;
  const { supabase, user } = await getPageContext();
  const { data:product, error } = await supabase.from('products').select('*').eq('id',id).eq('user_id',user.id).single();
  if (error || !product) notFound();
  const createAction = createProjectStateAction.bind(null,product.id);
  return <AppShell><h1 className="text-3xl font-bold">รายละเอียดสินค้า</h1><Card className="mt-6 max-w-3xl"><Badge tone={product.risk_flags?.length?'orange':'green'}>{product.risk_flags?.length?'ต้องตรวจเพิ่ม':'Imported'}</Badge><h2 className="mt-4 text-2xl font-bold">{product.title}</h2>
    {product.image_url ? <img alt={product.title} className="mt-4 max-h-72 rounded-2xl object-cover" src={product.image_url}/> : null}
    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2"><div><dt className="font-bold">หมวดหมู่</dt><dd>{product.category||'-'}</dd></div><div><dt className="font-bold">ราคา</dt><dd>{product.price==null?'-':`฿${product.price}`}</dd></div><div><dt className="font-bold">Commission</dt><dd>{product.commission_rate??0}%</dd></div><div><dt className="font-bold">แหล่งข้อมูล</dt><dd>{product.source??'manual'} · {product.affiliate_validation_status??'validated'}</dd></div><div><dt className="font-bold">Risk flags</dt><dd>{product.risk_flags?.join(', ')||'ไม่มี'}</dd></div>{product.product_url?<div className="md:col-span-2"><dt className="font-bold">ลิงก์สินค้า</dt><dd><a className="break-all text-purple underline" href={product.product_url} rel="noreferrer" target="_blank">{product.product_url}</a></dd></div>:null}<div className="md:col-span-2"><dt className="font-bold">Affiliate link</dt><dd><a className="break-all text-orange underline" href={product.affiliate_link} rel="noreferrer" target="_blank">{product.affiliate_link}</a></dd></div></dl>
    <div className="mt-6"><WorkflowActionForm action={createAction} initialRequestId={crypto.randomUUID()} label="สร้าง Review Project" pendingLabel="กำลังสร้างโปรเจกต์…"/></div></Card></AppShell>;
}
