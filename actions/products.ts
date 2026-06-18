"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { validateProductInput } from "@/lib/validators/product";

export async function createProduct(formData: FormData) {
  const input = {
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || ""),
    shopee_affiliate_link: String(formData.get("shopee_affiliate_link") || ""),
    product_image_url: String(formData.get("product_image_url") || ""),
    price: Number(formData.get("price") || 0),
    commission_rate: Number(formData.get("commission_rate") || 0)
  };
  const validation = validateProductInput(input);
  if (validation.errors.length) {
    redirect(`/products/new?error=${encodeURIComponent(validation.errors.join(" | "))}`);
  }
  if (!hasSupabaseEnv()) redirect("/products/demo-product-1");
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, user_id: user?.id, risk_flags: validation.riskFlags })
    .select("id")
    .single();
  if (error) redirect(`/products/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/products/${data.id}`);
}
