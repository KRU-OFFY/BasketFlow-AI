"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function createMediaAsset(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const assetType = String(formData.get("asset_type") || "video_preview");
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    await supabase.from("media_assets").insert({ project_id: projectId, user_id: user?.id, asset_type: assetType, provider: "mock", metadata: { generated: true } });
    await supabase.from("review_projects").update({ status: "media_generated" }).eq("id", projectId);
  }
  redirect(`/projects/${projectId}/media`);
}

export async function updateAiContentLabel(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const enabled = formData.get("has_ai_content_label") === "on";
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.from("review_projects").update({ has_ai_content_label: enabled }).eq("id", projectId);
  }
  redirect(`/projects/${projectId}/media`);
}
