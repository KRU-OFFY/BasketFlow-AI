'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';

export async function approveProject(projectId:string) {
  const { supabase, user } = await requireOwnedProject(projectId);
  const { data:check, error:checkError } = await supabase.from('compliance_checks').select('status').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (checkError || check?.status !== 'PASS') throw new Error('อนุมัติไม่ได้: โปรเจกต์ต้องมีผล Compliance ล่าสุดเป็น PASS');
  const { error } = await supabase.from('approvals').insert({user_id:user.id,project_id:projectId,status:'approved'});
  if (error) throw new Error(`บันทึกการอนุมัติไม่สำเร็จ: ${error.message}`);
  const { error:updateError } = await supabase.from('review_projects').update({approval_status:'approved',status:'approved'}).eq('id',projectId).eq('user_id',user.id);
  if (updateError) throw new Error(`อัปเดตสถานะอนุมัติไม่สำเร็จ: ${updateError.message}`);
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProject(projectId:string, reason?:string) {
  const { supabase, user } = await requireOwnedProject(projectId);
  const { error } = await supabase.from('approvals').insert({user_id:user.id,project_id:projectId,status:'rejected',notes:reason?.trim() || null});
  if (error) throw new Error(`บันทึกการปฏิเสธไม่สำเร็จ: ${error.message}`);
  const { error:updateError } = await supabase.from('review_projects').update({approval_status:'rejected',status:'rejected'}).eq('id',projectId).eq('user_id',user.id);
  if (updateError) throw new Error(`อัปเดตสถานะปฏิเสธไม่สำเร็จ: ${updateError.message}`);
  await supabase.from('posting_queue').delete().eq('project_id',projectId).eq('user_id',user.id).in('status',['ready','scheduled']);
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProjectFromForm(projectId:string, formData:FormData) {
  return rejectProject(projectId, String(formData.get('reason') ?? ''));
}
