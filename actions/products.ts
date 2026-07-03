'use server';
import { redirect } from 'next/navigation';
import { detectProductRisk, looksLikeShopeeLink } from '@/lib/validators/product';
import { requireUser } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';

export type ProductActionState = { error?:string; fields?:Record<string,string> };

export async function createProduct(formData: FormData): Promise<ProductActionState> {
  const fields = Object.fromEntries(['title','category','affiliate_link','image_url','price','commission_rate'].map((key) => [key, String(formData.get(key) ?? '').trim()]));
  if (!fields.title) return { error:'กรุณากรอกชื่อสินค้า', fields };
  if (!looksLikeShopeeLink(fields.affiliate_link)) return { error:'ลิงก์ Affiliate ต้องเป็น URL ของ Shopee ที่รองรับเท่านั้น', fields };
  const price = fields.price ? Number(fields.price) : null;
  const commissionRate = fields.commission_rate ? Number(fields.commission_rate) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error:'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป', fields };
  if (commissionRate !== null && (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) return { error:'Commission rate ต้องอยู่ระหว่าง 0–100', fields };

  const { user } = await requireUser();
  const admin = createAdminSupabase();
  const { data, error } = await admin.from('products').insert({
    user_id:user.id,
    title:fields.title,
    category:fields.category || null,
    affiliate_link:fields.affiliate_link,
    source:'manual',
    affiliate_validation_status:'validated',
    image_url:fields.image_url || null,
    price,
    commission_rate:commissionRate,
    risk_flags:detectProductRisk(fields.title, fields.category),
  }).select('id').single();
  if (error || !data?.id) return { error:'บันทึกสินค้าไม่สำเร็จ กรุณาลองใหม่', fields };
  redirect(`/products/${data.id}`);
}

export async function createProductAction(_:ProductActionState, formData:FormData) {
  return createProduct(formData);
}
