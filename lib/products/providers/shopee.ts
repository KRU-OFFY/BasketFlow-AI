import 'server-only';
import type { ProductCandidate, ProductImportResult, ProductSearchInput, ProductSourceProvider } from './types.ts';

export class ShopeeOpenApiProvider implements ProductSourceProvider {
  private assertEnabled(){
    if(process.env.SHOPEE_OPEN_API_ENABLED!=='true' || !process.env.SHOPEE_OPEN_API_PARTNER_ID || !process.env.SHOPEE_OPEN_API_KEY){
      throw new Error('ยังไม่ได้เปิดใช้ Shopee Open Platform');
    }
  }
  async search(_input:ProductSearchInput):Promise<ProductCandidate[]>{this.assertEnabled();throw new Error('Shopee API adapter ยังรอ contract และสิทธิ์จากช่องทางทางการ');}
  async import(_url:string):Promise<ProductImportResult>{this.assertEnabled();throw new Error('Shopee API adapter ยังรอ contract และสิทธิ์จากช่องทางทางการ');}
}
