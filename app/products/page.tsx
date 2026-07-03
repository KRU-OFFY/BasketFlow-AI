import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';
import { ProductSourceSelector } from '@/components/products/product-source-selector';

export default async function Products() {
  const { supabase, user } = await getPageContext();
  const { data:products, error } = await supabase.from('products').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
  if (error) throw new Error('โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่');
  const shopeeEnabled=process.env.SHOPEE_OPEN_API_ENABLED==='true' && Boolean(process.env.SHOPEE_OPEN_API_PARTNER_ID && process.env.SHOPEE_OPEN_API_KEY);
  return <AppShell>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">สินค้า</h1><p className="mt-2 text-slate-500">สินค้า Shopee Affiliate ของคุณ</p></div><Link className="btn" href="/products/new">นำเข้าสินค้า</Link></div>
    <div className="mt-6"><ProductSourceSelector shopeeEnabled={shopeeEnabled}/></div>
    {!products?.length ? <Card className="mt-6 text-center"><p className="font-bold">ยังไม่มีสินค้า</p><Link className="mt-4 inline-block text-orange" href="/products/new">นำเข้าสินค้าแรก</Link></Card> :
      <div className="mt-6 space-y-4">{products.map((product) => <Card key={product.id}><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-bold">{product.title}</p><p className="mt-1 text-sm text-slate-500">{product.category || 'ไม่ระบุหมวดหมู่'} · {product.price==null?'ไม่ระบุราคา':`฿${product.price}`} · Commission {product.commission_rate ?? 0}%</p></div><div className="flex items-center gap-3"><Badge tone={product.risk_flags?.length?'orange':'green'}>{product.risk_flags?.length?'ต้องตรวจเพิ่ม':'ความเสี่ยงต่ำ'}</Badge><Link className="btn" href={`/products/${product.id}`}>ดูรายละเอียด</Link></div></div></Card>)}</div>}
  </AppShell>;
}
