'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { INITIAL_PRODUCT_DISCOVERY_STATE, searchProductCandidatesAction } from '@/actions/product-discovery';

export function ProductSourceSelector({shopeeEnabled}:{shopeeEnabled:boolean}){
  const [state,action,pending]=useActionState(searchProductCandidatesAction,INITIAL_PRODUCT_DISCOVERY_STATE);
  return <section aria-labelledby="product-discovery-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold" id="product-discovery-title">Product Discovery</h2><p className="mt-1 text-sm text-slate-500">ค้นหาด้วย Mock AI หรือใช้ Manual Import โดยไม่ scraping ข้อมูลสินค้า</p>
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
      <label><span className="label">แหล่งข้อมูล</span><select className="input mt-1" name="source"><option value="mock">Mock AI</option><option disabled={!shopeeEnabled} value="shopee_api">Shopee Open API{shopeeEnabled?'':' (ยังไม่เปิด)'}</option></select></label>
      <label><span className="label">คำค้นสินค้า</span><input className="input mt-1" name="query" placeholder="เช่น แก้วเก็บอุณหภูมิ" required/></label>
      <button className="btn self-end" disabled={pending}>{pending?'กำลังค้นหา…':'ค้นหา'}</button>
    </form>
    {state.message?<p aria-live="polite" className={`mt-3 text-sm font-semibold ${state.ok?'text-emerald-700':'text-red-700'}`}>{state.message}</p>:null}
    {state.candidates.length?<div className="mt-4 grid gap-3 md:grid-cols-3">{state.candidates.map(candidate=>{const query=new URLSearchParams({title:candidate.title,category:candidate.category,affiliate_link:candidate.affiliateUrl,product_url:candidate.productUrl});return <article className="rounded-2xl border border-slate-200 p-4" key={candidate.externalId}><p className="font-bold">{candidate.title}</p><p className="mt-1 text-sm text-slate-500">{candidate.category} · {candidate.source}</p><Link className="mt-4 inline-block font-bold text-purple hover:underline" href={`/products/new?${query}`}>เลือกและตรวจข้อมูล</Link></article>;})}</div>:null}
  </section>;
}
