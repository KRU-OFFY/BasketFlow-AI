'use server';

import { requireUser } from '@/lib/supabase/server';
import { getProductSourceProvider, type ProductProviderName } from '@/lib/products/providers';
import type { ProductDiscoveryState } from '@/lib/products/discovery-state';

export async function searchProductCandidatesAction(_state:ProductDiscoveryState,formData:FormData):Promise<ProductDiscoveryState>{
  await requireUser();
  const query=String(formData.get('query')??'').trim();
  const source=formData.get('source')==='shopee_api'?'shopee_api':'mock' as ProductProviderName;
  if(query.length<2)return {ok:false,message:'กรุณากรอกคำค้นอย่างน้อย 2 ตัวอักษร',candidates:[]};
  try{
    const candidates=await getProductSourceProvider(source).search({query,limit:3});
    return {ok:true,message:candidates.length?`พบสินค้า ${candidates.length} รายการ`:'ไม่พบสินค้า',candidates};
  }catch{return {ok:false,message:'แหล่งข้อมูลนี้ยังไม่พร้อมใช้งาน กรุณาใช้ Mock AI หรือ Manual Import',candidates:[]};}
}
