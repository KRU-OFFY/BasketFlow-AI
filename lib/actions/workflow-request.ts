import 'server-only';

import { createAdminSupabase } from '@/lib/supabase/admin';

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WorkflowActionType =
  | 'create_project'
  | 'generate_brief'
  | 'generate_script'
  | 'run_preliminary_compliance'
  | 'run_final_compliance'
  | 'create_media'
  | 'update_ai_label'
  | 'approve_project'
  | 'reject_project'
  | 'archive_project'
  | 'queue_project';

export function readRequestId(formData?: FormData) {
  const requestId = String(formData?.get('request_id') ?? '').trim();
  return REQUEST_ID.test(requestId) ? requestId : crypto.randomUUID();
}

export async function claimWorkflowRequest(input: {
  requestId: string;
  userId: string;
  projectId?: string | null;
  actionType: WorkflowActionType;
}) {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc('claim_workflow_action', {
    p_request_id: input.requestId,
    p_user_id: input.userId,
    p_project_id: input.projectId ?? null,
    p_action_type: input.actionType,
  });
  if (error) throw new Error('ไม่สามารถเริ่มรายการได้ กรุณาลองใหม่');
  return { admin, claimed: data === 'claimed' };
}

export async function failWorkflowRequest(requestId: string) {
  try {
    const admin = createAdminSupabase();
    await admin
      .from('workflow_action_requests')
      .update({ status: 'failed' })
      .eq('id', requestId)
      .eq('status', 'pending');
  } catch {
    // The original workflow error remains the user-facing failure.
  }
}
