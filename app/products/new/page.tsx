import { AppShell } from '@/components/layout/app-shell';
import { ProductImportForm } from '@/components/products/product-import-form';
import { Card } from '@/components/ui/card';

export default async function NewProduct({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const initialFields=Object.fromEntries(['title','category','affiliate_link','product_url','source'].map(key=>[key,typeof params[key]==='string'?params[key] as string:'']));
  return <AppShell><h1 className="text-3xl font-bold">นำเข้าสินค้า Shopee</h1><p className="mt-2 text-slate-500">ตรวจข้อมูลและลิงก์ Affiliate ก่อนบันทึกทุกครั้ง</p><Card className="mt-6 max-w-2xl"><ProductImportForm initialFields={initialFields}/></Card></AppShell>;
}
