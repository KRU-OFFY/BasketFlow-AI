import { redactSensitiveText } from '../observability/redact.ts';

const SENSITIVE_KEY=/(?:authorization|password|token|cookie|secret|api[_-]?key|service[_-]?role|supabase)/i;
const MAX_DEPTH=6;
const MAX_ARRAY_ITEMS=100;
const MAX_STRING_LENGTH=10_000;

export function sanitizeAiPayload(value:unknown,depth=0):unknown {
  if(depth>MAX_DEPTH) return '[TRUNCATED_DEPTH]';
  if(typeof value==='string') return redactSensitiveText(value.slice(0,MAX_STRING_LENGTH));
  if(value===null || typeof value==='number' || typeof value==='boolean') return value;
  if(Array.isArray(value)) return value.slice(0,MAX_ARRAY_ITEMS).map(item=>sanitizeAiPayload(item,depth+1));
  if(typeof value==='object'){
    return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[
      key,SENSITIVE_KEY.test(key)?'[REDACTED]':sanitizeAiPayload(item,depth+1),
    ]));
  }
  return String(value);
}
