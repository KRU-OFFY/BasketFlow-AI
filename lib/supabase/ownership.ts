import { requireUser } from './server';

export async function requireOwnedProduct(productId: string) {
  const { supabase, user } = await requireUser();
  const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).eq('user_id', user.id).single();
  if (error || !product) throw new Error('ไม่พบสินค้า หรือคุณไม่มีสิทธิ์เข้าถึงสินค้านี้');
  return { supabase, user, product };
}

export async function requireOwnedProject(projectId: string) {
  const { supabase, user } = await requireUser();
  const { data: project, error } = await supabase.from('review_projects').select('*').eq('id', projectId).eq('user_id', user.id).is('archived_at', null).single();
  if (error || !project) throw new Error('ไม่พบโปรเจกต์ หรือคุณไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้');
  return { supabase, user, project };
}
