'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_LINKS=[
  ['/dashboard','แดชบอร์ด'],['/products','สินค้า'],['/projects','โปรเจกต์'],
  ['/posting-queue','คิวเผยแพร่'],['/analytics','Analytics'],['/settings','ตั้งค่า'],
  ['/settings/ai-logs','AI Logs'],
] as const;

export function NavigationLinks({mobile=false}:{mobile?:boolean}){
  const pathname=usePathname();
  return <>{NAV_LINKS.map(([href,label])=>{
    const active=pathname===href || (href!=='/dashboard' && pathname.startsWith(`${href}/`));
    return <Link aria-current={active?'page':undefined} className={mobile?`whitespace-nowrap rounded-lg px-2 py-1 ${active?'bg-purple/10 text-purple':'text-navy'}`:`block rounded-xl px-4 py-3 transition ${active?'bg-white/15 text-white':'text-slate-200 hover:bg-white/10 hover:text-white'}`} href={href} key={href}>{label}</Link>;
  })}</>;
}
