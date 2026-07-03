create index if not exists approvals_compliance_check_id_idx
  on public.approvals(compliance_check_id);
create index if not exists approvals_script_id_idx
  on public.approvals(script_id);
create index if not exists compliance_checks_script_id_idx
  on public.compliance_checks(script_id);
create index if not exists posting_queue_approval_id_idx
  on public.posting_queue(approval_id);
create index if not exists posting_queue_compliance_check_id_idx
  on public.posting_queue(compliance_check_id);
create index if not exists posting_queue_script_id_idx
  on public.posting_queue(script_id);
create index if not exists workflow_action_requests_project_owner_idx
  on public.workflow_action_requests(project_id, user_id);
