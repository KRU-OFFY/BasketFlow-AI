import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProject } from '@/lib/mock-data';

export default function Dashboard() {
  const stats = [
    ['สินค้าทั้งหมด', '1'],
    ['โปรเจกต์', '1'],
    ['รออนุมัติ', '1'],
    ['พร้อมเผยแพร่', '0'],
    ['ถูกบล็อก', '0'],
  ];

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange">Mock AI Mode</p>
          <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
          <p className="mt-2 text-slate-500">ภาพรวมโปรเจกต์รีวิวสินค้าแบบปลอดภัยสำหรับ Shopee Affiliate</p>
        </div>
        <Link className="btn" href="/products/new">นำเข้าสินค้าใหม่</Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">โปรเจกต์ล่าสุด</h2>
              <p className="mt-1 text-sm text-slate-500">ติดตามสถานะตั้งแต่ Product Import ถึง Publishing Queue</p>
            </div>
            <Badge tone="purple">{mockProject.status}</Badge>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold">{mockProject.title}</p>
            <p className="mt-1 text-sm text-slate-500">Compliance: {mockProject.compliance_status} · Approval: {mockProject.approval_status}</p>
            <Link className="mt-3 inline-block text-sm font-bold text-orange" href={`/projects/${mockProject.id}`}>เปิดโปรเจกต์</Link>
          </div>
        </Card>

        <Card className="border-orange/40 bg-orange-50">
          <Badge tone="orange">Safety Reminder</Badge>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            ก่อนเผยแพร่ทุกครั้ง ต้องผ่าน Compliance PASS, มี Affiliate disclosure,
            มี AI content label เมื่อใช้เสียงหรือภาพ AI และได้รับ Human Approval แล้วเท่านั้น
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
