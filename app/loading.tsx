import { BasketFlowLogo } from '@/components/brand/basketflow-logo';

export default function Loading(){
  return <main aria-busy="true" aria-live="polite" className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><BasketFlowLogo showTagline/><div className="mx-auto mt-6 h-2 w-48 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan via-purple to-pink"/></div><p className="mt-4 font-semibold text-slate-600">กำลังโหลด BasketFlow AI…</p></div></main>;
}
