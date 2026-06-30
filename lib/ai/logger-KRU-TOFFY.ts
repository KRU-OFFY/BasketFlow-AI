import { createServerSupabase } from '@/lib/supabase/server';
export type AiLogInput = { user_id:string; project_id:string; task_type:string; prompt_version:string; ai_provider:string; ai_model:string; input_payload:unknown; output_payload:unknown; error_message?:string|null; latency_ms:number; status:'success'|'fallback'|'error' };
export async function logAiEvent(input: AiLogInput) {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from('ai_logs').insert(input);
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
