import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { AiLogStatus } from "@/lib/types/domain";

export async function logAiTask(input: {
  task_type: string;
  prompt_version: string;
  ai_provider: string;
  ai_model: string;
  input_payload: unknown;
  output_payload?: unknown;
  error_message?: string | null;
  latency_ms?: number | null;
  status: AiLogStatus;
}) {
  if (!hasSupabaseEnv()) return;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  await supabase.from("ai_logs").insert({ ...input, user_id: user?.id });
}
