'use server';
import { revalidatePath } from 'next/cache';
import { clearPendingPublishingQueue, requireOwnedProject } from '@/lib/supabase/ownership';

const mediaTypes = ['voiceover','avatar','subtitle','video_preview','rendered_video'] as const;
export type MediaType = typeof mediaTypes[number];

export async function createMediaAsset(projectId:string, type:MediaType) {
  if (!mediaTypes.includes(type)) throw new Error('ประเภท Media Asset ไม่ถูกต้อง');
  const { supabase, user } = await requireOwnedProject(projectId);
  const { error } = await supabase.from('media_assets').insert({ user_id:user.id, project_id:projectId, type, provider:'mock', metadata:{status:'placeholder'} });
  if (error) throw new Error(`สร้าง Media Asset ไม่สำเร็จ: ${error.message}`);
  const { error:updateError } = await supabase.from('review_projects').update({status:'media_generated',compliance_status:null,approval_status:'pending'}).eq('id',projectId).eq('user_id',user.id);
  if (updateError) throw new Error(`อัปเดตสถานะโปรเจกต์ไม่สำเร็จ: ${updateError.message}`);
  await clearPendingPublishingQueue(supabase, user.id, projectId);
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabel(projectId:string, enabled:boolean) {
  const { supabase, user } = await requireOwnedProject(projectId);
  const { error } = await supabase.from('review_projects').update({has_ai_content_label:enabled}).eq('id',projectId).eq('user_id',user.id);
  if (error) throw new Error(`บันทึก AI Content Label ไม่สำเร็จ: ${error.message}`);
  if (!enabled) {
    const { error:resetError } = await supabase.from('review_projects').update({status:'warning',compliance_status:null,approval_status:'pending'}).eq('id',projectId).eq('user_id',user.id);
    if (resetError) throw new Error(`รีเซ็ต Safety Gate ไม่สำเร็จ: ${resetError.message}`);
    await clearPendingPublishingQueue(supabase, user.id, projectId);
  }
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabelFromForm(projectId:string, formData:FormData) {
  return updateAiContentLabel(projectId, formData.get('enabled') === 'true');
}
