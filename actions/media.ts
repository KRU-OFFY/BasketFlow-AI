'use server';
import { createServerSupabase } from '@/lib/supabase/server';
export async function createMediaAsset(projectId:string, type:string) { await (await createServerSupabase()).from('media_assets').insert({project_id:projectId,type,provider:'mock',metadata:{status:'placeholder'}}); }
export async function updateAiContentLabel(projectId:string, enabled:boolean) { await (await createServerSupabase()).from('review_projects').update({has_ai_content_label:enabled}).eq('id',projectId); }
