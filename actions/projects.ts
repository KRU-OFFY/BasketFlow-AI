"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { ProjectStatus } from "@/lib/types/domain";

export async function createProjectFromProduct(formData: FormData) {
  const productId = String(formData.get("product_id") || "");
  const title = String(formData.get("title") || "โปรเจกต์รีวิวสินค้า");
  if (!hasSupabaseEnv()) redirect("/projects/demo-project-1");
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("review_projects")
    .insert({ user_id: user?.id, product_id: productId, title, status: "product_imported" satisfies ProjectStatus })
    .select("id")
    .single();
  if (error) redirect(`/products/${productId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/projects/${data.id}`);
}
