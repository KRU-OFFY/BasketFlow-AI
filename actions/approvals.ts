'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { claimWorkflowRequest, failWorkflowRequest, readRequestId } from '@/lib/actions/workflow-request';
import { actionFailure, actionSuccess, type ActionState } from '@/lib/actions/state';

export async function approveProject(projectId:string, requestId=crypto.randomUUID()) {
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const { data:check, error:checkError } = await supabase.from('compliance_checks').select('status').eq('project_id',projectId).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (checkError || check?.status !== 'PASS' || project.compliance_status !== 'PASS') {
    throw new Error('อนุมัติไม่ได้: โปรเจกต์ต้องมีผล Compliance ปัจจุบันและผลล่าสุดเป็น PASS');
  }
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'approve_project'});
  if(!claimed) return;
  const { error } = await admin.rpc('record_project_approval',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_status:'approved',p_notes:null});
  if (error) {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึกการอนุมัติไม่สำเร็จ กรุณาตรวจผล Compliance แล้วลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProject(projectId:string, reason?:string, requestId=crypto.randomUUID()) {
  const { user } = await requireOwnedProject(projectId);
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'reject_project'});
  if(!claimed) return;
  const { error } = await admin.rpc('record_project_approval',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_status:'rejected',p_notes:reason?.trim() || null});
  if (error) {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึกการปฏิเสธไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/approval`);
}

export async function rejectProjectFromForm(projectId:string, formData:FormData) {
  return rejectProject(projectId, String(formData.get('reason') ?? ''), readRequestId(formData));
}

export async function approveProjectFromForm(projectId:string, formData:FormData) {
  return approveProject(projectId, readRequestId(formData));
}

export async function approveProjectStateAction(projectId:string,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  try{await approveProject(projectId,requestId);return actionSuccess('อนุมัติเวอร์ชันปัจจุบันสำเร็จ',requestId);}
  catch(error){return actionFailure(error,requestId);}
}

export async function rejectProjectStateAction(projectId:string,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  try{await rejectProject(projectId,String(formData.get('reason')??''),requestId);return actionSuccess('ปฏิเสธโปรเจกต์แล้ว',requestId);}
  catch(error){return actionFailure(error,requestId);}
}
