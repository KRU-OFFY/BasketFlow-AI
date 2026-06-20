import { callOpenAIJson } from './openai';
import { shouldUseOpenAI } from './config';
export async function callAiJson<T>(prompt: string, fallback: () => T): Promise<{ output:T; status:'success'|'fallback'; error?:string }> { if (!shouldUseOpenAI()) return { output:fallback(), status:'success' }; try { return { output: await callOpenAIJson<T>(prompt), status:'success' }; } catch (e) { return { output:fallback(), status:'fallback', error:e instanceof Error ? e.message : 'Unknown AI error' }; } }
