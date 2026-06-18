import { createProduct } from "@/actions/products";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
  return <AppShell><PageHeader title="Import Shopee Product" description="กรอกข้อมูลสินค้าและลิงก์ Affiliate" /><Card><form action={createProduct} className="grid gap-4 md:grid-cols-2"><Input name="title" placeholder="ชื่อสินค้า *" required /><Input name="category" placeholder="หมวดหมู่" /><Input name="shopee_affiliate_link" placeholder="Shopee Affiliate link *" required /><Input name="product_image_url" placeholder="Product image URL" /><Input name="price" type="number" step="0.01" placeholder="ราคา" /><Input name="commission_rate" type="number" step="0.01" placeholder="Commission rate %" /><div className="md:col-span-2"><Button>บันทึกสินค้า</Button></div></form></Card></AppShell>;
}
