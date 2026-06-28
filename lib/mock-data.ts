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

export type WeeklyProgressStatus = 'on_track' | 'at_risk' | 'blocked';

export type WeeklyProgressSource = 'slack' | 'spreadsheet';

export type WeeklyProgressRecord = {
  id: string;
  weekStartDate: string;
  team: string;
  project: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  status: WeeklyProgressStatus;
  owner: string;
  blockers: string[];
  source: WeeklyProgressSource;
  sourceLabel: string;
  sourceHref: string;
  updateText: string;
  highlights: string[];
  risks: string[];
  nextActions: string[];
  trend: number[];
};

export const reportingWeekStartDate = '2026-06-22';

export const weeklyProgressRecords: WeeklyProgressRecord[] = [
  {
    id: 'affiliate-launch-kit',
    weekStartDate: reportingWeekStartDate,
    team: 'Content Ops',
    project: 'Affiliate Launch Kit',
    metricName: 'approved assets',
    currentValue: 42,
    targetValue: 48,
    status: 'at_risk',
    owner: 'Mina',
    blockers: ['Final compliance review is still pending for three comparison clips.'],
    source: 'spreadsheet',
    sourceLabel: 'Weekly!A:H row 14',
    sourceHref: '/analytics',
    updateText: 'The sheet shows approvals moved from 38 to 42, but the Friday target remains 48.',
    highlights: ['Four new assets were approved this week.', 'The launch kit is 88% complete against target.'],
    risks: ['Approval throughput needs one more review block to avoid slipping the launch date.'],
    nextActions: ['Book a midweek compliance review slot for the remaining clips.'],
    trend: [24, 30, 34, 38, 42],
  },
  {
    id: 'creator-outreach-sprint',
    weekStartDate: reportingWeekStartDate,
    team: 'Partnerships',
    project: 'Creator Outreach Sprint',
    metricName: 'creator replies',
    currentValue: 31,
    targetValue: 30,
    status: 'on_track',
    owner: 'Jo',
    blockers: [],
    source: 'slack',
    sourceLabel: '#creator-updates thread',
    sourceHref: '/projects',
    updateText: 'Slack check-ins report higher-quality replies after the new creator brief template went live.',
    highlights: ['Reply target has been exceeded.', 'Two creators are ready for contract handoff.'],
    risks: ['Contract turnaround could become the next bottleneck if handoff is delayed.'],
    nextActions: ['Move the two warm creator leads into contract review.'],
    trend: [11, 17, 22, 26, 31],
  },
  {
    id: 'shopee-shorts-refresh',
    weekStartDate: reportingWeekStartDate,
    team: 'Publishing',
    project: 'Shopee Shorts Refresh',
    metricName: 'ready posts',
    currentValue: 12,
    targetValue: 20,
    status: 'blocked',
    owner: 'Arun',
    blockers: ['Product claims need source links before scripts can be approved.', 'Two videos need replacement product images.'],
    source: 'slack',
    sourceLabel: '#publishing-standup',
    sourceHref: '/posting-queue',
    updateText: 'Slack updates flagged missing claim sources and replacement images as the top publishing blockers.',
    highlights: ['The team has identified every blocked script and asset dependency.'],
    risks: ['Unsubstantiated claims could hold the publishing queue past this week.'],
    nextActions: ['Attach source links to product claims.', 'Request replacement product images from the media owner.'],
    trend: [4, 7, 8, 10, 12],
  },
];

export function getProgressPercent(currentValue: number, targetValue: number) {
  if (targetValue <= 0) return 0;
  return Math.min(Math.round((currentValue / targetValue) * 100), 100);
}

export function getWeeklyProgressSummary(records = weeklyProgressRecords) {
  const totalCurrentValue = records.reduce((sum, record) => sum + record.currentValue, 0);
  const totalTargetValue = records.reduce((sum, record) => sum + record.targetValue, 0);
  const blockerCount = records.reduce((sum, record) => sum + record.blockers.length, 0);
  const onTrackCount = records.filter((record) => record.status === 'on_track').length;
  const slackRecordCount = records.filter((record) => record.source === 'slack').length;
  const spreadsheetRecordCount = records.filter((record) => record.source === 'spreadsheet').length;

  return {
    totalCurrentValue,
    totalTargetValue,
    blockerCount,
    onTrackCount,
    slackRecordCount,
    spreadsheetRecordCount,
    targetProgressPercent: getProgressPercent(totalCurrentValue, totalTargetValue),
  };
}
