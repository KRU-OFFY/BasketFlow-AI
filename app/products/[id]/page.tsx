import { createProjectFromProduct } from '@/actions/projects';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProduct } from '@/lib/mock-data';

export default function ProductDetail({ params }: { params: { id: string } }) {
  async function create() {
    'use server';
    await createProjectFromProduct(params.id, `รีวิว ${mockProduct.title}`);
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">รายละเอียดสินค้า</h1>
      <Card className="mt-6 max-w-3xl">
        <Badge tone="green">Imported</Badge>
        <h2 className="mt-4 text-2xl font-bold">{mockProduct.title}</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="font-bold">Product ID</dt><dd>{params.id}</dd></div>
          <div><dt className="font-bold">Category</dt><dd>{mockProduct.category}</dd></div>
          <div><dt className="font-bold">Price</dt><dd>฿{mockProduct.price}</dd></div>
          <div><dt className="font-bold">Commission</dt><dd>{mockProduct.commission_rate}%</dd></div>
        </dl>
        <form action={create} className="mt-6">
          <button className="btn">สร้าง Review Project</button>
        </form>
      </Card>
    </AppShell>
  );
}
