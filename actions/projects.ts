'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOwnedProduct, requireOwnedProject } from '@/lib/supabase/ownership';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';
import { createAdminSupabase } from '@/lib/supabase/admin';

export async function createProjectFromProduct(productId:string, title?:string) {
  const { user, product } = await requireOwnedProduct(productId);
  const projectTitle = title?.trim() || `รีวิว ${product.title}`;
  const admin = createAdminSupabase();
  const { data:projectId, error } = await admin.rpc('create_review_project_rpc', {
    p_user_id:user.id,
    p_product_id:product.id,
    p_title:projectTitle,
  });

  if (error || !projectId) throw new Error(`สร้างโปรเจกต์ไม่สำเร็จ: ${error?.message ?? 'ไม่พบรหัสโปรเจกต์'}`);
  redirect(`/projects/${projectId}`);
}

export async function createProjectFromProductForm(productId:string) {
  return createProjectFromProduct(productId);
}

export async function moveToPublishingQueue(projectId:string) {
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{ data:compliance, error:complianceError }, { data:approval, error:approvalError }] = await Promise.all([
    supabase.from('compliance_checks').select('status').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
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
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('queue_project_rpc',{ p_user_id:user.id, p_project_id:projectId });
  if (error) throw new Error(`เพิ่มคิวเผยแพร่ไม่สำเร็จ: ${error.message}`);
  revalidatePath('/posting-queue');
  revalidatePath(`/projects/${projectId}`);
}
