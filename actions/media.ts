'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { createAdminSupabase } from '@/lib/supabase/admin';

const mediaTypes = ['voiceover','avatar','subtitle','video_preview','rendered_video'] as const;
export type MediaType = typeof mediaTypes[number];

export async function createMediaAsset(projectId:string, type:MediaType) {
  if (!mediaTypes.includes(type)) throw new Error('ประเภท Media Asset ไม่ถูกต้อง');
  const { user } = await requireOwnedProject(projectId);
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('create_media_asset_rpc', {
    p_user_id:user.id,
    p_project_id:projectId,
    p_type:type,
    p_metadata:{status:'placeholder'},
  });
  if (error) throw new Error(`สร้าง Media Asset ไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabel(projectId:string, enabled:boolean) {
  const { user } = await requireOwnedProject(projectId);
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('set_ai_content_label_rpc', {
    p_user_id:user.id,
    p_project_id:projectId,
    p_enabled:enabled,
  });
  if (error) throw new Error(`บันทึก AI Content Label ไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabelFromForm(projectId:string, formData:FormData) {
  return updateAiContentLabel(projectId, formData.get('enabled') === 'true');
}
