'use server';
import { createServerSupabase } from '@/lib/supabase/server';
export async function approveProject(projectId:string) { await (await createServerSupabase()).from('approvals').insert({project_id:projectId,status:'approved'}); await (await createServerSupabase()).from('review_projects').update({approval_status:'approved',status:'approved'}).eq('id',projectId); }
export async function rejectProject(projectId:string, reason:string) { await (await createServerSupabase()).from('approvals').insert({project_id:projectId,status:'rejected',notes:reason}); await (await createServerSupabase()).from('review_projects').update({approval_status:'rejected',status:'rejected'}).eq('id',projectId); }
