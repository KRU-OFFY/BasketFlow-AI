'use client';

import { useEffect } from 'react';
import { BasketPilotLogo } from '@/components/brand/basketpilot-logo';

export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('BasketPilot route error',error);},[error]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm"><BasketPilotLogo showTagline/><h1 className="mt-8 text-2xl font-black text-navy">โหลดหน้านี้ไม่สำเร็จ</h1><p className="mt-3 text-slate-600">ข้อมูลของคุณยังไม่ถูกเปลี่ยนแปลง กรุณาลองอีกครั้ง หากยังพบปัญหาให้กลับไปที่แดชบอร์ด</p><div className="mt-6 flex flex-wrap gap-3"><button className="btn" onClick={reset}>ลองอีกครั้ง</button><a className="btn btn-secondary" href="/dashboard">กลับแดชบอร์ด</a></div></section></main>;
}
