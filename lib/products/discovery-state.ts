import type { ProductCandidate } from './providers/types.ts';

export type ProductDiscoveryState={ok:boolean;message:string;candidates:ProductCandidate[]};
export const INITIAL_PRODUCT_DISCOVERY_STATE:ProductDiscoveryState={ok:false,message:'',candidates:[]};
