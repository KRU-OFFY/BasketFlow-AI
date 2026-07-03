'use client';
import { useActionState } from 'react';
import { createProductAction, type ProductActionState } from '@/actions/products';

const initialState:ProductActionState = {};
const fields = [
  ['title','ชื่อสินค้า*','text'],['category','หมวดหมู่','text'],['affiliate_link','Shopee Affiliate link*','url'],
  ['product_url','ลิงก์หน้าสินค้า Shopee','url'],['image_url','Product image URL','url'],['price','ราคา','number'],['commission_rate','Commission rate','number'],
] as const;

export function ProductImportForm({initialFields={}}:{initialFields?:Record<string,string>}) {
  const [state, action, pending] = useActionState(createProductAction, initialState);
  return <form action={action} className="space-y-4">
    {state.error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{state.error}</p> : null}
    {fields.map(([name,label,type]) => <label className="block" key={name}>
      <span className="label">{label}</span>
      <input className="input mt-1" defaultValue={state.fields?.[name]??initialFields[name]} name={name} type={type} required={name==='title'||name==='affiliate_link'} step={type==='number'?'0.01':undefined}/>
    </label>)}
    <p className="text-sm text-orange-700">รองรับเฉพาะลิงก์ Shopee ที่กำหนด และตรวจจับหมวดหมู่เสี่ยงก่อนเริ่มโปรเจกต์</p>
    <button className="btn" disabled={pending}>{pending?'กำลังบันทึก…':'บันทึกสินค้า'}</button>
  </form>;
}
