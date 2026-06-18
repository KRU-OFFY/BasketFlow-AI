"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProject } from "@/lib/data";
import { canMoveToReadyToPublish } from "@/lib/validators/publishing";

export async function approveProject(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    await supabase.from("approvals").insert({ project_id: projectId, user_id: user?.id, status: "approved" });
    await supabase.from("review_projects").update({ status: "approved", approval_status: "approved" }).eq("id", projectId);
  }
  redirect(`/projects/${projectId}/approval`);
}

export async function rejectProject(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const note = String(formData.get("note") || "");
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    await supabase.from("approvals").insert({ project_id: projectId, user_id: user?.id, status: "rejected", note });
    await supabase.from("review_projects").update({ status: "rejected", approval_status: "rejected" }).eq("id", projectId);
  }
  redirect(`/projects/${projectId}/approval`);
}

export async function moveToPublishingQueue(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const project = await getProject(projectId);
  const safe = canMoveToReadyToPublish({
    complianceStatus: project?.compliance_status,
    approvalStatus: project?.approval_status,
    hasAffiliateDisclosure: project?.has_affiliate_disclosure,
    hasAiContentLabel: project?.has_ai_content_label
  });
  if (!safe) redirect(`/projects/${projectId}/approval?error=safety-gate`);
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    await supabase.from("posting_queue").insert({ project_id: projectId, user_id: user?.id, status: "ready" });
    await supabase.from("review_projects").update({ status: "ready_to_publish" }).eq("id", projectId);
  }
  redirect("/posting-queue");
}
