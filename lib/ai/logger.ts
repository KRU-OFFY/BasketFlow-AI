import { createAdminSupabase } from '@/lib/supabase/admin';
import { redactSensitiveText } from '@/lib/observability/redact';
import { sanitizeAiPayload } from '@/lib/ai/sanitize';
export type AiLogInput = { user_id:string; project_id:string; request_id?:string|null; task_type:string; prompt_version:string; ai_provider:string; ai_model:string; input_payload:unknown; output_payload:unknown; error_message?:string|null; latency_ms:number; status:'success'|'fallback'|'error' };
export async function logAiEvent(input: AiLogInput) {
  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from('ai_logs').insert({
      ...input,
      input_payload:sanitizeAiPayload(input.input_payload),
      output_payload:sanitizeAiPayload(input.output_payload),
      error_message:input.error_message?redactSensitiveText(input.error_message):null,
    });
    if (error) {
      console.error('AI log insert failed:', error.message);
      return { ok:false as const, error:error.message };
    }
    return { ok:true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI logging error';
    console.error('AI logging failed:', message);
    return { ok:false as const, error:message };
  }
}
