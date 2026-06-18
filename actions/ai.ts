"use server";

import { redirect } from "next/navigation";
import { getProduct, getProject } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { generateProductBrief } from "@/lib/ai/brief-generator";
import { generateReviewScript } from "@/lib/ai/script-generator";
import { logAiTask } from "@/lib/ai/logger";

export async function generateBrief(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const project = await getProject(projectId);
  const product = project ? await getProduct(project.product_id) : null;
  if (!project || !product) redirect(`/projects/${projectId}?error=not-found`);
  const started = Date.now();
  const brief = await generateProductBrief(product);
  await logAiTask({ task_type: "brief_generation", prompt_version: brief.prompt_version, ai_provider: brief.ai_provider, ai_model: brief.ai_model, input_payload: product, output_payload: brief, latency_ms: Date.now() - started, status: "success" });
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.from("ai_briefs").insert({ project_id: project.id, user_id: project.user_id, ...brief });
    await supabase.from("review_projects").update({ status: "brief_generated" }).eq("id", project.id);
  }
  redirect(`/projects/${projectId}/brief`);
}

export async function generateScript(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const duration = Number(formData.get("duration") || 30) as 15 | 30 | 60 | 90;
  const project = await getProject(projectId);
  if (!project) redirect(`/projects/${projectId}?error=not-found`);
  const started = Date.now();
  const script = await generateReviewScript({ title: project.title, duration });
  await logAiTask({ task_type: "script_generation", prompt_version: script.prompt_version, ai_provider: script.ai_provider, ai_model: script.ai_model, input_payload: { projectId, duration }, output_payload: script, latency_ms: Date.now() - started, status: "success" });
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.from("scripts").insert({ project_id: project.id, user_id: project.user_id, duration_seconds: duration, ...script });
    await supabase.from("review_projects").update({ status: "script_generated", has_affiliate_disclosure: true }).eq("id", project.id);
  }
  redirect(`/projects/${projectId}/script`);
}
