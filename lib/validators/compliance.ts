import { THAI_AFFILIATE_DISCLOSURE, THAI_LIMITATION_STATEMENT } from '../ai/constants.ts';

export const BLOCKED_WORDS = ['หายขาด','เห็นผลทันที','ลดทันที','ขาวถาวร','ปลอดภัย 100%','รวยเร็ว','ไม่ต้องลงทุน','การันตีผลลัพธ์','ดีที่สุดในโลก','การันตี','รับประกัน','เห็นผล 100%','รักษาโรค','ลดน้ำหนักแน่นอน','ปลอดภัยแน่นอน','ไม่มีผลข้างเคียง','หมอแนะนำ'];
export type ComplianceInput = { text:string; usesAiMedia?:boolean; hasAiContentLabel?:boolean; sensitiveProduct?:boolean };

export function ruleBasedCompliance(input:ComplianceInput) {
  const prohibited_words = BLOCKED_WORDS.filter((word) => input.text.includes(word));
  const missing_requirements:string[] = [];
  if (!input.text.includes(THAI_AFFILIATE_DISCLOSURE)) missing_requirements.push('missing_affiliate_disclosure');
  if (input.usesAiMedia && !input.hasAiContentLabel) missing_requirements.push('missing_ai_content_label');
  if (input.sensitiveProduct && !input.text.includes(THAI_LIMITATION_STATEMENT)) missing_requirements.push('missing_limitation_statement');
  const status:'PASS'|'WARNING'|'BLOCK' = prohibited_words.length ? 'BLOCK' : missing_requirements.length ? 'WARNING' : 'PASS';
  const pattern = new RegExp(BLOCKED_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return {
    status,
    risk_score:prohibited_words.length ? 95 : missing_requirements.length ? 45 : 5,
    issues:[...prohibited_words.map((word)=>`พบคำกล่าวอ้างต้องห้าม: ${word}`), ...missing_requirements],
    prohibited_words,
    missing_requirements,
    suggested_fixes:['ลบคำกล่าวอ้างเกินจริง','เพิ่ม Affiliate disclosure, AI label หรือคำจำกัดความเสี่ยงให้ครบ'],
    safe_rewrite:input.text.replace(pattern,'ควรตรวจสอบข้อมูลและผลลัพธ์อาจแตกต่างกัน'),
  };
}
