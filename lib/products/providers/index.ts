import 'server-only';
import { MockProductSourceProvider } from './mock';
import { ShopeeOpenApiProvider } from './shopee';
import type { ProductSourceProvider } from './types';

export type ProductProviderName='mock'|'shopee_api';
export function getProductSourceProvider(name:ProductProviderName):ProductSourceProvider {
  return name==='shopee_api'?new ShopeeOpenApiProvider():new MockProductSourceProvider();
}
