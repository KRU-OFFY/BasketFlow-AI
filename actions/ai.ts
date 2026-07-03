'use server';
import { revalidatePath } from 'next/cache';
import { requireOwnedProject } from '@/lib/supabase/ownership';
import { generateProductBrief } from '@/lib/ai/brief-generator';
import { generateReviewScript } from '@/lib/ai/script-generator';
import { checkCompliance } from '@/lib/ai/compliance-checker';
import { PROMPT_VERSIONS } from '@/lib/ai/prompt-versions';
import { logAiEvent } from '@/lib/ai/logger';
import { claimWorkflowRequest, failWorkflowRequest, readRequestId } from '@/lib/actions/workflow-request';
import { actionFailure, actionSuccess, type ActionState } from '@/lib/actions/state';

const durations = [15,30,60,90] as const;
export type ScriptDuration = typeof durations[number];
export type CompliancePhase = 'preliminary' | 'final';

function aiMetadata() {
  const openai = process.env.AI_PROVIDER === 'openai' && Boolean(process.env.OPENAI_API_KEY);
  return { provider:openai ? 'openai' : 'mock', model:openai ? (process.env.OPENAI_MODEL ?? 'gpt-4.1-mini') : 'mock-v1' };
}

async function loadProductForProject(supabase:Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabase>>, project:{product_id:string}, userId:string) {
  const { data:product, error } = await supabase.from('products').select('*').eq('id',project.product_id).eq('user_id',userId).single();
  if (error || !product) throw new Error('ไม่พบสินค้าที่สัมพันธ์กับโปรเจกต์');
  return product;
}

export async function generateBriefAction(projectId:string, requestId=crypto.randomUUID()) {
  const started = Date.now();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const product = await loadProductForProject(supabase, project, user.id);
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'generate_brief'});
  if(!claimed) return;
  try {
    const result = await generateProductBrief({title:product.title,category:product.category ?? undefined,risk_flags:product.risk_flags ?? []});
    const meta = aiMetadata();
    const payload={...result.output,prompt_version:PROMPT_VERSIONS.productAnalyzer,ai_provider:meta.provider,ai_model:meta.model};
    const { error } = await admin.rpc('record_ai_brief',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_payload:payload});
    if (error) throw new Error('record_failed');
    await logAiEvent({user_id:user.id,project_id:projectId,request_id:requestId,task_type:'generate_brief',prompt_version:PROMPT_VERSIONS.productAnalyzer,ai_provider:meta.provider,ai_model:meta.model,input_payload:{product_id:product.id,title:product.title},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  } catch {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึก AI Brief ไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/brief`);
}

export async function generateBriefFromForm(projectId:string, formData:FormData) {
  return generateBriefAction(projectId, readRequestId(formData));
}

export async function generateBriefStateAction(projectId:string,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  try{await generateBriefAction(projectId,requestId);return actionSuccess('สร้าง AI Brief สำเร็จ',requestId);}
  catch(error){return actionFailure(error,requestId);}
}

export async function generateScriptAction(projectId:string, duration:ScriptDuration, requestId=crypto.randomUUID()) {
  if (!durations.includes(duration)) throw new Error('ระยะเวลาสคริปต์ไม่ถูกต้อง');
  const started = Date.now();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{ data:brief, error:briefError }, product] = await Promise.all([
    supabase.from('ai_briefs').select('*').eq('project_id',projectId).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    loadProductForProject(supabase, project, user.id),
  ]);
  if (briefError || !brief) throw new Error('กรุณาสร้าง AI Brief ก่อนสร้างสคริปต์');
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType:'generate_script'});
  if(!claimed) return;
  try {
    const result = await generateReviewScript({title:product.title,duration,risk_flags:product.risk_flags ?? []});
    const meta = aiMetadata();
    const payload={duration_seconds:duration,...result.output,prompt_version:PROMPT_VERSIONS.scriptGenerator,ai_provider:meta.provider,ai_model:meta.model};
    const { error } = await admin.rpc('record_script',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_payload:payload});
    if (error) throw new Error('record_failed');
    await logAiEvent({user_id:user.id,project_id:projectId,request_id:requestId,task_type:'generate_script',prompt_version:PROMPT_VERSIONS.scriptGenerator,ai_provider:meta.provider,ai_model:meta.model,input_payload:{product_id:product.id,duration,brief_id:brief.id},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  } catch {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึกสคริปต์ไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/script`);
}

export async function generateScriptFromForm(projectId:string, formData:FormData) {
  return generateScriptAction(projectId, Number(formData.get('duration')) as ScriptDuration, readRequestId(formData));
}

export async function generateScriptStateAction(projectId:string,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  try{await generateScriptAction(projectId,Number(formData.get('duration')) as ScriptDuration,requestId);return actionSuccess('สร้างสคริปต์สำเร็จ',requestId);}
  catch(error){return actionFailure(error,requestId);}
}

export async function runComplianceAction(projectId:string, phase:CompliancePhase='preliminary', requestId=crypto.randomUUID()) {
  if (phase !== 'preliminary' && phase !== 'final') throw new Error('รอบการตรวจ Compliance ไม่ถูกต้อง');
  const started = Date.now();
  const { supabase, user, project } = await requireOwnedProject(projectId);
  const [{data:script,error:scriptError},{data:assets,error:assetsError},product] = await Promise.all([
    supabase.from('scripts').select('*').eq('project_id',projectId).eq('user_id',user.id).is('superseded_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('media_assets').select('id,type').eq('project_id',projectId).eq('user_id',user.id),
    loadProductForProject(supabase,project,user.id),
  ]);
  if (scriptError || !script) throw new Error('กรุณาสร้างสคริปต์ก่อนตรวจ Compliance');
  if (assetsError) throw new Error('โหลด Media Assets ไม่สำเร็จ กรุณาลองใหม่');
  const actionType=phase==='preliminary'?'run_preliminary_compliance':'run_final_compliance';
  const {admin,claimed}=await claimWorkflowRequest({requestId,userId:user.id,projectId,actionType});
  if(!claimed) return;
  try {
    const result = await checkCompliance({
      text:script.full_script ?? '',
      usesAiMedia:phase==='final' && Boolean(assets?.length),
      hasAiContentLabel:phase==='preliminary' || project.has_ai_content_label,
      sensitiveProduct:Boolean(product.risk_flags?.length),
    });
    const meta = aiMetadata();
    const payload={...result.output,prompt_version:PROMPT_VERSIONS.complianceChecker,ai_provider:meta.provider,ai_model:meta.model};
    const { error } = await admin.rpc('record_compliance_check',{p_request_id:requestId,p_user_id:user.id,p_project_id:projectId,p_phase:phase,p_payload:payload});
    if (error) throw new Error('record_failed');
    await logAiEvent({user_id:user.id,project_id:projectId,request_id:requestId,task_type:`compliance_check_${phase}`,prompt_version:PROMPT_VERSIONS.complianceChecker,ai_provider:meta.provider,ai_model:meta.model,input_payload:{script_id:script.id,phase,uses_ai_media:phase==='final' && Boolean(assets?.length)},output_payload:result.output,error_message:result.error ?? null,latency_ms:Date.now()-started,status:result.status});
  } catch {
    await failWorkflowRequest(requestId);
    throw new Error('บันทึก Compliance ไม่สำเร็จ กรุณาลองใหม่');
  }
  revalidatePath(`/projects/${projectId}/compliance`);
}

export async function runComplianceFromForm(projectId:string, formData:FormData) {
  const phase=formData.get('phase')==='final'?'final':'preliminary';
  return runComplianceAction(projectId, phase, readRequestId(formData));
}

export async function runComplianceStateAction(projectId:string,_state:ActionState,formData:FormData):Promise<ActionState>{
  const requestId=readRequestId(formData);
  const phase=formData.get('phase')==='final'?'final':'preliminary';
  try{await runComplianceAction(projectId,phase,requestId);return actionSuccess(phase==='final'?'ตรวจ Final Safety Check สำเร็จ':'ตรวจ Preliminary Check สำเร็จ',requestId);}
  catch(error){return actionFailure(error,requestId);}
}
