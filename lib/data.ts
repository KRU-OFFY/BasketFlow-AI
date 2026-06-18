import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { demoAiLogs, demoProducts, demoProjects } from "@/lib/demo-data";
import type { AiLog, Product, ReviewProject } from "@/lib/types/domain";

export async function listProducts(): Promise<Product[]> {
  noStore();
  if (!hasSupabaseEnv()) return demoProducts;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return (data as Product[] | null) ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await listProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function listProjects(): Promise<ReviewProject[]> {
  noStore();
  if (!hasSupabaseEnv()) return demoProjects;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("review_projects").select("*").order("created_at", { ascending: false });
  return (data as ReviewProject[] | null) ?? [];
}

export async function getProject(id: string): Promise<ReviewProject | null> {
  const projects = await listProjects();
  return projects.find((project) => project.id === id) ?? null;
}

export async function listAiLogs(): Promise<AiLog[]> {
  noStore();
  if (!hasSupabaseEnv()) return demoAiLogs;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("ai_logs").select("*").order("created_at", { ascending: false });
  return (data as AiLog[] | null) ?? [];
}

export async function getAiLog(id: string): Promise<AiLog | null> {
  const logs = await listAiLogs();
  return logs.find((log) => log.id === id) ?? null;
}
