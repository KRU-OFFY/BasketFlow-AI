import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProduct } from '@/lib/mock-data';

export default function Products() {
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">สินค้า</h1>
          <p className="mt-2 text-slate-500">นำเข้าสินค้า Shopee Affiliate และตรวจจับหมวดหมู่เสี่ยงก่อนเริ่มโปรเจกต์</p>
        </div>
        <Link className="btn" href="/products/new">นำเข้าสินค้า</Link>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{mockProduct.title}</p>
            <p className="mt-1 text-sm text-slate-500">{mockProduct.category} · ฿{mockProduct.price} · Commission {mockProduct.commission_rate}%</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={mockProduct.risk_flags.length ? 'orange' : 'green'}>{mockProduct.risk_flags.length ? 'ต้องตรวจเพิ่ม' : 'ความเสี่ยงต่ำ'}</Badge>
            <Link className="btn" href={`/products/${mockProduct.id}`}>ดูรายละเอียด</Link>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
