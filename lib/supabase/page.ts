import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from './server';

export async function getPageContext() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect('/login');
  return { supabase, user:data.user };
}

export async function getOwnedProjectPage(projectId:string) {
  const { supabase, user } = await getPageContext();
  const { data:project, error } = await supabase.from('review_projects').select('*').eq('id',projectId).eq('user_id',user.id).is('archived_at',null).single();
  if (error || !project) notFound();
  const { data:product, error:productError } = await supabase.from('products').select('*').eq('id',project.product_id).eq('user_id',user.id).single();
  if (productError || !product) notFound();
  return { supabase, user, project, product };
}
