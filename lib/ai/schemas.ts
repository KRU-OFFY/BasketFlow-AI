import { z } from 'zod';

export const briefOutputSchema=z.object({
  product_summary:z.string().min(1),target_audience:z.string().min(1),pain_points:z.array(z.string()),
  key_benefits:z.array(z.string()),usp:z.string().min(1),content_angles:z.array(z.string()),
  hook_ideas:z.array(z.string()),risk_level:z.enum(['low','medium','high']),creator_note:z.string(),
});

export const scriptOutputSchema=z.object({
  hook:z.string().min(1),hook_candidates:z.array(z.string()).min(1),selected_hook:z.string().min(1),
  problem:z.string(),product_intro:z.string(),benefits:z.array(z.string()),use_case:z.string(),cta:z.string(),
  affiliate_disclosure:z.string().min(1),full_script:z.string().min(1),subtitle_lines:z.array(z.string()),
});

export const complianceOutputSchema=z.object({
  status:z.enum(['PASS','WARNING','BLOCK']),risk_score:z.number().int().min(0).max(100),
  issues:z.array(z.string()),prohibited_words:z.array(z.string()),missing_requirements:z.array(z.string()),
  suggested_fixes:z.array(z.string()),safe_rewrite:z.string(),
});
