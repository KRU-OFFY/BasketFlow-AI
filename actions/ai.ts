'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { generateProductBrief } from '@/lib/ai/brief-generator';
import { generateReviewScript } from '@/lib/ai/script-generator';
import { checkCompliance } from '@/lib/ai/compliance-checker';
import { PROMPT_VERSIONS } from '@/lib/ai/prompt-versions';
import { logAiEvent } from '@/lib/ai/logger';
import { createAdminSupabase } from '@/lib/supabase/admin';

const durations = [15,30,60,90] as const;
export type ScriptDuration = typeof durations[number];

function aiMetadata() {
  const openai = process.env.AI_PROVIDER === 'openai' && Boolean(process.env.OPENAI_API_KEY);
  return { provider:openai ? 'openai' : 'mock', model:openai ? (process.env.OPENAI_MODEL ?? 'gpt-4.1-mini') : 'mock-v1' };
}

async function loadProductForProject(supabase:Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabase>>, project:{product_id:string}, userId:string) {
  const { data:product, error } = await supabase.from('products').select('*').eq('id',project.product_id).eq('user_id',userId).single();
  if (error || !product) throw new Error('ไม่พบสินค้าที่สัมพันธ์กับโปรเจกต์');
  return product;
}

export async function generateBriefAction(projectId:string) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const product = await loadProductForProject(supabase, project, user.id);
  const result = await generateProductBrief({title:product.title,category:product.category ?? undefined,risk_flags:product.risk_flags ?? []});
  const meta = aiMetadata();

  const admin = createAdminSupabase();
  const { error } = await admin.rpc('complete_generate_brief', {
    p_user_id:user.id,
    p_project_id:projectId,
    p_request_id:requestId,
    p_output:result.output,
    p_prompt_version:PROMPT_VERSIONS.productAnalyzer,
    p_ai_provider:meta.provider,
    p_ai_model:meta.model,
  });
  if (error) throw new Error(`บันทึก AI Brief ไม่สำเร็จ: ${error.message}`);
  await logAiEvent({user_id:user.id,project_id:projectId,task_type:'generate_brief',prompt_version:PROMPT_VERSIONS.productAnalyzer,ai_provider:meta.provider,ai_model:meta.model,input_payload:{product_id:product.id,title:product.title,request_id:requestId},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  revalidatePath(`/projects/${projectId}/brief`);
}

export async function generateScriptAction(projectId:string, duration:ScriptDuration) {
  if (!durations.includes(duration)) throw new Error('ระยะเวลาสคริปต์ไม่ถูกต้อง');
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{ data:brief, error:briefError }, product] = await Promise.all([
    supabase.from('ai_briefs').select('*').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    loadProductForProject(supabase, project, user.id),
  ]);
  if (briefError || !brief) throw new Error('กรุณาสร้าง AI Brief ก่อนสร้างสคริปต์');

  const result = await generateReviewScript({title:product.title,duration,risk_flags:product.risk_flags ?? []});
  const meta = aiMetadata();
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('complete_generate_script', {
    p_user_id:user.id,
    p_project_id:projectId,
    p_request_id:requestId,
    p_duration_seconds:duration,
    p_output:result.output,
    p_prompt_version:PROMPT_VERSIONS.scriptGenerator,
    p_ai_provider:meta.provider,
    p_ai_model:meta.model,
  });
  if (error) throw new Error(`บันทึกสคริปต์ไม่สำเร็จ: ${error.message}`);
  await logAiEvent({user_id:user.id,project_id:projectId,task_type:'generate_script',prompt_version:PROMPT_VERSIONS.scriptGenerator,ai_provider:meta.provider,ai_model:meta.model,input_payload:{product_id:product.id,duration,brief_id:brief.id,request_id:requestId},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  revalidatePath(`/projects/${projectId}/script`);
}

export async function generateScriptFromForm(projectId:string, formData:FormData) {
  return generateScriptAction(projectId, Number(formData.get('duration')) as ScriptDuration);
}

export async function runComplianceAction(projectId:string) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{data:script,error:scriptError},{data:assets,error:assetsError},product] = await Promise.all([
    supabase.from('scripts').select('*').eq('project_id',projectId).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('media_assets').select('id,type').eq('project_id',projectId).eq('user_id',user.id),
    loadProductForProject(supabase,project,user.id),
  ]);
  if (scriptError || !script) throw new Error('กรุณาสร้างสคริปต์ก่อนตรวจ Compliance');
  if (assetsError) throw new Error(`โหลด Media Assets ไม่สำเร็จ: ${assetsError.message}`);

  const result = await checkCompliance({text:script.full_script ?? '',usesAiMedia:Boolean(assets?.length),hasAiContentLabel:project.has_ai_content_label,sensitiveProduct:Boolean(product.risk_flags?.length)});
  const meta = aiMetadata();
  const admin = createAdminSupabase();
  const { error } = await admin.rpc('complete_compliance_check', {
    p_user_id:user.id,
    p_project_id:projectId,
    p_request_id:requestId,
    p_output:result.output,
    p_prompt_version:PROMPT_VERSIONS.complianceChecker,
    p_ai_provider:meta.provider,
    p_ai_model:meta.model,
  });
  if (error) throw new Error(`บันทึก Compliance ไม่สำเร็จ: ${error.message}`);
  await logAiEvent({user_id:user.id,project_id:projectId,task_type:'compliance_check',prompt_version:PROMPT_VERSIONS.complianceChecker,ai_provider:meta.provider,ai_model:meta.model,input_payload:{script_id:script.id,uses_ai_media:Boolean(assets?.length),request_id:requestId},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  revalidatePath(`/projects/${projectId}/compliance`);
}
