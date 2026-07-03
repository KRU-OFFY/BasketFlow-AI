export type ProductSearchInput={query:string;limit?:number};
export type ProductCandidate={
  externalId:string;
  title:string;
  category:string;
  productUrl:string;
  affiliateUrl:string;
  source:'mock'|'shopee_api';
};
export type ProductImportResult={candidate:ProductCandidate;validated:boolean};

export interface ProductSourceProvider {
  search(query:ProductSearchInput):Promise<ProductCandidate[]>;
  import(url:string):Promise<ProductImportResult>;
}
