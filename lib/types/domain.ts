export type ProjectStatus =
  | "draft"
  | "product_imported"
  | "brief_generated"
  | "script_generated"
  | "compliance_checked"
  | "warning"
  | "blocked"
  | "media_generated"
  | "pending_approval"
  | "approved"
  | "ready_to_publish"
  | "published"
  | "rejected";

export type ComplianceStatus = "PASS" | "WARNING" | "BLOCK";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type QueueStatus = "ready" | "scheduled" | "published" | "failed" | "cancelled";
export type AiLogStatus = "success" | "fallback" | "error";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Product {
  id: string;
  user_id?: string;
  title: string;
  category: string | null;
  shopee_affiliate_link: string;
  product_image_url: string | null;
  price: number | null;
  commission_rate: number | null;
  risk_flags?: string[];
  created_at?: string;
}

export interface ReviewProject {
  id: string;
  user_id?: string;
  product_id: string;
  title: string;
  status: ProjectStatus;
  compliance_status?: ComplianceStatus | null;
  approval_status?: ApprovalStatus | null;
  has_affiliate_disclosure?: boolean;
  has_ai_content_label?: boolean;
  created_at?: string;
}

export interface AiBrief {
  product_summary: string;
  target_audience: string;
  pain_points: string[];
  key_benefits: string[];
  usp: string;
  content_angles: string[];
  hook_ideas: string[];
  risk_level: RiskLevel;
  creator_note: string;
  prompt_version: string;
  ai_provider: string;
  ai_model: string;
}

export interface ReviewScript {
  hook: string;
  problem: string;
  product_intro: string;
  benefits: string;
  use_case: string;
  cta: string;
  affiliate_disclosure: string;
  full_script: string;
  subtitle_lines: string[];
  prompt_version: string;
  ai_provider: string;
  ai_model: string;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  risk_score: number;
  issues: string[];
  prohibited_words: string[];
  missing_requirements: string[];
  suggested_fixes: string[];
  safe_rewrite: string;
  prompt_version: string;
  ai_provider: string;
  ai_model: string;
}

export interface PublishingGateInput {
  complianceStatus?: ComplianceStatus | null;
  approvalStatus?: ApprovalStatus | null;
  hasAffiliateDisclosure?: boolean | null;
  hasAiContentLabel?: boolean | null;
}

export interface AiLog {
  id: string;
  task_type: string;
  prompt_version: string;
  ai_provider: string;
  ai_model: string;
  input_payload: unknown;
  output_payload: unknown;
  error_message: string | null;
  latency_ms: number | null;
  status: AiLogStatus;
  created_at: string;
}
