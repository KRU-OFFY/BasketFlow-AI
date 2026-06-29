export type ProjectStatus = 'draft'|'product_imported'|'brief_generated'|'script_generated'|'compliance_checked'|'warning'|'blocked'|'media_generated'|'pending_approval'|'approved'|'ready_to_publish'|'published'|'rejected';
export type ComplianceStatus = 'PASS'|'WARNING'|'BLOCK';
export type ApprovalStatus = 'pending'|'approved'|'rejected';
export type QueueStatus = 'ready'|'scheduled'|'published'|'failed'|'cancelled';
export type Product = { id:string; user_id:string; title:string; category:string; affiliate_link:string; image_url?:string|null; price?:number|null; commission_rate?:number|null; risk_flags:string[]; created_at:string; updated_at:string };
export type ReviewProject = { id:string; user_id:string; product_id:string; title:string; status:ProjectStatus; compliance_status?:ComplianceStatus|null; approval_status?:ApprovalStatus|null; has_affiliate_disclosure:boolean; has_ai_content_label:boolean; created_at:string; updated_at:string };
export type AiLogStatus = 'success'|'fallback'|'error';
export type AiLog = { id:string; user_id:string; project_id?:string|null; task_type:string; prompt_version:string; ai_provider:string; ai_model:string; input_payload:unknown; output_payload:unknown; error_message?:string|null; latency_ms:number; status:AiLogStatus; created_at:string };
