import { THAI_AFFILIATE_DISCLOSURE } from '@/lib/ai/script-generator';
import { THAI_AI_CONTENT_LABEL, ruleBasedCompliance } from '@/lib/ai/compliance-checker';
import type { AiLog, Product, ReviewProject } from '@/lib/types/domain';

export const mockProduct: Product = {
  id: 'demo-product-001',
  user_id: 'mock-user',
  title: 'โคมไฟตั้งโต๊ะ LED สำหรับถ่ายคอนเทนต์',
  category: 'อุปกรณ์ไลฟ์ / Creator Gear',
  affiliate_link: 'https://shopee.co.th/demo-affiliate',
  image_url: null,
  price: 399,
  commission_rate: 6,
  risk_flags: [],
  created_at: new Date('2026-06-20T00:00:00.000Z').toISOString(),
  updated_at: new Date('2026-06-20T00:00:00.000Z').toISOString(),
};

export const mockProject: ReviewProject = {
  id: 'demo-project-001',
  user_id: 'mock-user',
  product_id: mockProduct.id,
  title: `รีวิว ${mockProduct.title}`,
  status: 'pending_approval',
  compliance_status: 'PASS',
  approval_status: 'pending',
  has_affiliate_disclosure: true,
  has_ai_content_label: true,
  media_revision: 0,
  created_at: new Date('2026-06-20T01:00:00.000Z').toISOString(),
  updated_at: new Date('2026-06-20T01:30:00.000Z').toISOString(),
};

export const mockScriptText = `ก่อนซื้อ ${mockProduct.title} มาดูจุดเด่นและข้อควรรู้กันแบบตรงไปตรงมา เหมาะสำหรับครีเอเตอร์ที่ต้องการแสงเสริมบนโต๊ะทำงาน ${THAI_AFFILIATE_DISCLOSURE} ${THAI_AI_CONTENT_LABEL}`;

export const mockCompliance = ruleBasedCompliance({ text: mockScriptText, usesAiMedia: true });

export const mockAiLogs: AiLog[] = [
  {
    id: 'log-brief-001',
    user_id: 'mock-user',
    task_type: 'product_brief',
    prompt_version: 'product-analyzer-v1.0.0',
    ai_provider: 'mock',
    ai_model: 'mock-local',
    input_payload: { product_id: mockProduct.id, title: mockProduct.title },
    output_payload: { risk_level: 'low', content_angles: ['รีวิวตั้งโต๊ะ', 'ก่อนซื้อ'] },
    latency_ms: 18,
    status: 'success',
    created_at: new Date('2026-06-20T01:05:00.000Z').toISOString(),
  },
  {
    id: 'log-compliance-001',
    user_id: 'mock-user',
    task_type: 'compliance_check',
    prompt_version: 'compliance-checker-v1.0.0',
    ai_provider: 'mock',
    ai_model: 'rule-based-local',
    input_payload: { text: mockScriptText },
    output_payload: mockCompliance,
    latency_ms: 7,
    status: 'success',
    created_at: new Date('2026-06-20T01:15:00.000Z').toISOString(),
  },
];

export function getMockAiLog(id: string) {
  return mockAiLogs.find((log) => log.id === id) ?? mockAiLogs[0];
}
