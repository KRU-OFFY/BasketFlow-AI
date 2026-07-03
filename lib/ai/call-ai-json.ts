import { callOpenAIJson } from './openai.ts';
import { shouldUseOpenAI } from './config.ts';
import type { ZodType } from 'zod';
export async function callAiJson<T>(prompt:string,fallback:()=>T,schema?:ZodType<T>):Promise<{output:T;status:'success'|'fallback';error?:string}>{if(!shouldUseOpenAI())return{output:fallback(),status:'success'};try{const raw=await callOpenAIJson<unknown>(prompt);return{output:schema?schema.parse(raw):raw as T,status:'success'};}catch(e){return{output:fallback(),status:'fallback',error:e instanceof Error?e.message:'Unknown AI error'};}}
