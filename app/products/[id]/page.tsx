import { notFound } from "next/navigation";
import { createProjectFromProduct } from "@/actions/projects";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProduct } from "@/lib/data";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <AppShell><PageHeader title={product.title} description={product.shopee_affiliate_link} /><div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="font-bold">ข้อมูลสินค้า</h2><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-sm">{JSON.stringify(product, null, 2)}</pre></Card><Card><h2 className="font-bold">Create Review Project</h2><form action={createProjectFromProduct} className="mt-4 space-y-3"><input type="hidden" name="product_id" value={product.id} /><Input name="title" defaultValue={`รีวิว ${product.title}`} /><Button>สร้างโปรเจกต์รีวิว</Button></form></Card></div></AppShell>;
}
