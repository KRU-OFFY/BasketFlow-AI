import { callAiJson } from './call-ai-json';
import { complianceCheckerPrompt } from './prompts/compliance-checker';
import { ruleBasedCompliance, type ComplianceInput } from '../validators/compliance';

export { ruleBasedCompliance } from '../validators/compliance';
export { THAI_AI_CONTENT_LABEL, THAI_LIMITATION_STATEMENT } from './constants';

export async function checkCompliance(input:ComplianceInput) {
  return callAiJson(complianceCheckerPrompt(input), () => ruleBasedCompliance(input));
}
