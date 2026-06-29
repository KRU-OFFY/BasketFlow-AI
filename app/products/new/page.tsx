import { AppShell } from '@/components/layout/app-shell';
import { ProductImportForm } from '@/components/products/product-import-form';
import { Card } from '@/components/ui/card';

export default function NewProduct() {
  return <AppShell><h1 className="text-3xl font-bold">นำเข้าสินค้า Shopee</h1><Card className="mt-6 max-w-2xl"><ProductImportForm /></Card></AppShell>;
}
