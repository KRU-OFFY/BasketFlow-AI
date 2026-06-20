import Link from 'next/link';
const links=[['/dashboard','แดชบอร์ด'],['/products','สินค้า'],['/projects','โปรเจกต์'],['/posting-queue','คิวเผยแพร่'],['/analytics','Analytics'],['/settings','ตั้งค่า'],['/settings/ai-logs','AI Logs']];
export function Sidebar(){return <aside className="min-h-screen w-72 bg-navy p-6 text-white"><div className="mb-8 text-xl font-bold text-orange">AI Review Bot</div><nav className="space-y-2">{links.map(([href,label])=><Link className="block rounded-xl px-4 py-3 text-slate-200 hover:bg-white/10" href={href} key={href}>{label}</Link>)}</nav></aside>}
