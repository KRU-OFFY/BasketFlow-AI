'use server';
import { generateProductBrief } from '@/lib/ai/brief-generator'; import { generateReviewScript } from '@/lib/ai/script-generator'; import { checkCompliance } from '@/lib/ai/compliance-checker';
export async function generateBriefAction(product:{title:string; category?:string; risk_flags?:string[]}) { return generateProductBrief(product); }
export async function generateScriptAction(input:{title:string; duration:number}) { return generateReviewScript(input); }
export async function runComplianceAction(input:{text:string; usesAiMedia?:boolean}) { return checkCompliance(input); }
