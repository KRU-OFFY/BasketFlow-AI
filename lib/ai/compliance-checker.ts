import { callAiJson } from './call-ai-json';
import { complianceCheckerPrompt } from './prompts/compliance-checker';
import { ruleBasedCompliance, type ComplianceInput } from '../validators/compliance';
import { complianceOutputSchema } from './schemas';

export { ruleBasedCompliance } from '../validators/compliance';
export { THAI_AI_CONTENT_LABEL, THAI_LIMITATION_STATEMENT } from './constants';

export async function checkCompliance(input:ComplianceInput) {
  const rules=ruleBasedCompliance(input);
  const result=await callAiJson(complianceCheckerPrompt(input),()=>rules,complianceOutputSchema);
  const severity={PASS:0,WARNING:1,BLOCK:2} as const;
  const status=severity[rules.status]>=severity[result.output.status]?rules.status:result.output.status;
  const unique=(...items:string[][])=>[...new Set(items.flat())];
  return {...result,output:{...result.output,status,risk_score:Math.max(rules.risk_score,result.output.risk_score),issues:unique(rules.issues,result.output.issues),prohibited_words:unique(rules.prohibited_words,result.output.prohibited_words),missing_requirements:unique(rules.missing_requirements,result.output.missing_requirements),suggested_fixes:unique(rules.suggested_fixes,result.output.suggested_fixes)}};
}
