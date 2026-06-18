"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { runRuleBasedCompliance } from "@/lib/ai/compliance-checker";
import { logAiTask } from "@/lib/ai/logger";

export async function runCompliance(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const script = String(formData.get("script") || "");
  const hasAiContentLabel = formData.get("has_ai_content_label") === "on";
  const started = Date.now();
  const result = runRuleBasedCompliance({ script, usesAiVoiceOrAvatar: true, hasAiContentLabel });
  await logAiTask({ task_type: "compliance_check", prompt_version: result.prompt_version, ai_provider: result.ai_provider, ai_model: result.ai_model, input_payload: { projectId, script }, output_payload: result, latency_ms: Date.now() - started, status: "success" });
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    await supabase.from("compliance_checks").insert({ project_id: projectId, user_id: user?.id, ...result });
    await supabase.from("review_projects").update({ status: result.status === "BLOCK" ? "blocked" : "compliance_checked", compliance_status: result.status }).eq("id", projectId);
  }
  redirect(`/projects/${projectId}/compliance?status=${result.status}`);
}
