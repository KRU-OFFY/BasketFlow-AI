import type { ProductCandidate, ProductImportResult, ProductSearchInput, ProductSourceProvider } from './types.ts';

export class MockProductSourceProvider implements ProductSourceProvider {
  async search(input:ProductSearchInput):Promise<ProductCandidate[]> {
    const query=input.query.trim();
    if(!query)return [];
    const categories=['ของใช้ในบ้าน','อุปกรณ์ไลฟ์สไตล์','เครื่องใช้สำนักงาน'];
    return categories.slice(0,Math.min(input.limit??3,3)).map((category,index)=>({
      externalId:`mock-${index+1}`,
      title:`${query} รุ่นทดสอบ ${index+1}`,
      category,
      productUrl:`https://shopee.co.th/product/1000${index}/2000${index}`,
      affiliateUrl:`https://shopee.co.th/product/1000${index}/2000${index}`,
      source:'mock',
    }));
  }

  async import(url:string):Promise<ProductImportResult> {
    return {candidate:{externalId:'mock-import',title:'สินค้านำเข้าแบบ Mock',category:'ไม่ระบุ',productUrl:url,affiliateUrl:url,source:'mock'},validated:true};
  }
}
