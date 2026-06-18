import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listProducts } from "@/lib/data";

export default async function ProductsPage() {
  const products = await listProducts();
  return <AppShell><PageHeader title="สินค้า" description="นำเข้าและจัดการสินค้า Shopee Affiliate" action={<Link className="rounded-xl bg-orange-500 px-4 py-2 text-white" href="/products/new">เพิ่มสินค้า</Link>} />{products.length ? <div className="grid gap-4 md:grid-cols-2">{products.map((p) => <Link key={p.id} href={`/products/${p.id}`}><Card><div className="flex justify-between gap-4"><div><h2 className="font-bold">{p.title}</h2><p className="text-sm text-slate-500">{p.category}</p><p className="mt-2 text-sm">฿{p.price ?? "-"} · คอมมิชชัน {p.commission_rate ?? 0}%</p></div>{p.risk_flags?.length ? <Badge tone="orange">risk</Badge> : <Badge tone="green">safe</Badge>}</div></Card></Link>)}</div> : <EmptyState title="ยังไม่มีสินค้า" href="/products/new" action="นำเข้าสินค้าแรก" />}</AppShell>;
}
