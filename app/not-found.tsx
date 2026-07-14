import Link from 'next/link';
import { BasketFlowLogo } from '@/components/brand/basketflow-logo';

export default function NotFound(){
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><BasketFlowLogo showTagline/><p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-pink">404</p><h1 className="mt-2 text-2xl font-black text-navy">ไม่พบหน้าที่ต้องการ</h1><p className="mt-3 text-slate-600">ลิงก์อาจหมดอายุ หรือข้อมูลนี้ไม่อยู่ในบัญชีของคุณ</p><Link className="btn mt-6 inline-block" href="/dashboard">กลับแดชบอร์ด</Link></section></main>;
}
