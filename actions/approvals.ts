'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { createAdminSupabase } from '@/lib/supabase/admin';

export async function approveProject(projectId:string) {
  const { supabase, user } = await requireOwnedProject(projectId);
  const { data:check, error:checkError } = await supabase.from('compliance_checks').select('status').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (checkError || check?.status !== 'PASS') throw new Error('อนุมัติไม่ได้: โปรเจกต์ต้องมีผล Compliance ล่าสุดเป็น PASS');

  const admin = createAdminSupabase();
  const { error } = await admin.rpc('approve_project_rpc', { p_user_id:user.id, p_project_id:projectId });
  if (error) throw new Error(`บันทึกการอนุมัติไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProject(projectId:string, reason?:string) {
  const { user } = await requireOwnedProject(projectId);
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('reject_project_rpc', { p_user_id:user.id, p_project_id:projectId, p_reason:reason?.trim() || null });
  if (error) throw new Error(`บันทึกการปฏิเสธไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProjectFromForm(projectId:string, formData:FormData) {
  return rejectProject(projectId, String(formData.get('reason') ?? ''));
}
