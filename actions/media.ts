'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { claimWorkflowRequest, failWorkflowRequest, readRequestId } from '@/lib/actions/workflow-request';
import { actionFailure, actionSuccess, type ActionState } from '@/lib/actions/state';

const mediaTypes = ['voiceover','avatar','subtitle','video_preview','rendered_video'] as const;
export type MediaType = typeof mediaTypes[number];

export async function createMediaAsset(projectId:string, type:MediaType, requestId=crypto.randomUUID()) {
  if (!mediaTypes.includes(type)) throw new Error('ประเภท Media Asset ไม่ถูกต้อง');
  const { user } = await requireOwnedProject(projectId);
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'create_media'});
  if(!claimed) return;
  const { error } = await admin.rpc('record_media_asset',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_type:type});
  if (error) {
    await failWorkflowRequest(requestId);
    throw new Error('สร้าง Media Asset ไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabel(projectId:string, enabled:boolean) {
  const { user } = await requireOwnedProject(projectId);
  const requestId=crypto.randomUUID();
  const {admin}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'update_ai_label'});
  const { error } = await admin.rpc('set_project_ai_label',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_enabled:enabled});
  if (error) {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึก AI Content Label ไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/media`);
}

export async function updateAiContentLabelFromForm(projectId:string, formData:FormData) {
  return updateAiContentLabel(projectId, formData.get('enabled') === 'true');
}

export async function createMediaAssetFromForm(projectId:string, type:MediaType, formData:FormData) {
  return createMediaAsset(projectId, type, readRequestId(formData));
}

export async function createMediaAssetStateAction(projectId:string,type:MediaType,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  try{await createMediaAsset(projectId,type,requestId);return actionSuccess('สร้าง Media placeholder สำเร็จ',requestId);}
  catch(error){return actionFailure(error,requestId);}
}
