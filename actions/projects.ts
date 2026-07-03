'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOwnedProduct, requireOwnedProject } from '@/lib/supabase/ownership';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';
import { claimWorkflowRequest, failWorkflowRequest, readRequestId } from '@/lib/actions/workflow-request';

export async function createProjectFromProduct(productId:string, title?:string, requestId=crypto.randomUUID()) {
  const { user, product } = await requireOwnedProduct(productId);
  const projectTitle = title?.trim() || `รีวิว ${product.title}`;
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,actionType:'create_project'});
  if(!claimed) return;
  const { data, error } = await admin.rpc('record_review_project', {
    p_request_id:requestId,p_user_id:user.id,p_product_id:product.id,p_title:projectTitle,
  });
  if (error || !data) {
    await failWorkflowRequest(requestId);
    throw new Error('สร้างโปรเจกต์ไม่สำเร็จ กรุณาลองใหม่');
  }
  redirect(`/projects/${data}`);
}

export async function createProjectFromProductForm(productId:string, formData:FormData) {
  return createProjectFromProduct(productId, undefined, readRequestId(formData));
}

export async function archiveProject(projectId:string, requestId=crypto.randomUUID()) {
  const { user } = await requireOwnedProject(projectId);
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'archive_project'});
  if(!claimed) return;
  const { error }=await admin.rpc('archive_review_project',{
    p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,
  });
  if(error){
    await failWorkflowRequest(requestId);
    throw new Error('เก็บโปรเจกต์เข้าคลังไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
}

export async function archiveProjectFromForm(projectId:string,formData:FormData){
  return archiveProject(projectId,readRequestId(formData));
}

export async function moveToPublishingQueue(projectId:string, requestId=crypto.randomUUID()) {
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{ data:compliance, error:complianceError }, { data:approval, error:approvalError }] = await Promise.all([
    supabase.from('compliance_checks').select('status').eq('project_id',projectId).eq('user_id',user.id).eq('phase','final').is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('approvals').select('status').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  ]);
  if (complianceError || approvalError) throw new Error('ไม่สามารถตรวจสอบข้อมูล Safety Gate ได้');
  const allowed = canMoveToReadyToPublish({
    complianceStatus:compliance?.status,
    approvalStatus:approval?.status,
    hasAffiliateDisclosure:project.has_affiliate_disclosure,
    hasAiContentLabel:project.has_ai_content_label,
  });
  if (!allowed) throw new Error('โปรเจกต์ยังไม่ผ่าน Safety Gate: ต้อง PASS, approved และมี disclosure/AI label ครบ');
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'queue_project'});
  if(!claimed) return;
  const { error } = await admin.rpc('queue_project',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId});
  if (error) {
    await failWorkflowRequest(requestId);
    throw new Error('เพิ่มคิวเผยแพร่ไม่สำเร็จ กรุณาตรวจ Safety Gate แล้วลองใหม่');
  }
  revalidatePath('/posting-queue');
  revalidatePath(`/projects/${projectId}`);
}

export async function moveToPublishingQueueFromForm(projectId:string, formData:FormData) {
  return moveToPublishingQueue(projectId, readRequestId(formData));
}
