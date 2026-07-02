create index if not exists ai_briefs_project_owner_idx
  on public.ai_briefs(project_id, user_id);

create index if not exists ai_logs_project_owner_idx
  on public.ai_logs(project_id, user_id);

create index if not exists analytics_events_project_id_idx
  on public.analytics_events(project_id);

create index if not exists approvals_project_owner_idx
  on public.approvals(project_id, user_id);

create index if not exists compliance_checks_project_owner_idx
  on public.compliance_checks(project_id, user_id);

create index if not exists media_assets_project_owner_idx
  on public.media_assets(project_id, user_id);

create index if not exists posting_queue_project_owner_idx
  on public.posting_queue(project_id, user_id);

create index if not exists review_projects_product_owner_idx
  on public.review_projects(product_id, user_id);

create index if not exists scripts_project_owner_idx
  on public.scripts(project_id, user_id);
