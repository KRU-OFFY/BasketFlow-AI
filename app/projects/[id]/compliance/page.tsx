import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockCompliance } from '@/lib/mock-data';
import { ruleBasedCompliance } from '@/lib/ai/compliance-checker';

export default function Compliance() {
  const safetyTest = ruleBasedCompliance({ text: 'สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%' });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Compliance Center</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <Badge tone="green">Current Script: {mockCompliance.status}</Badge>
          <p className="mt-4 text-sm text-slate-600">Risk score: {mockCompliance.risk_score}</p>
          <h2 className="mt-4 font-bold">Suggested Fixes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {mockCompliance.suggested_fixes.map((fix) => <li key={fix}>{fix}</li>)}
          </ul>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <Badge tone="red">Safety Test: {safetyTest.status}</Badge>
          <p className="mt-4 text-sm text-slate-700">Input: สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%</p>
          <p className="mt-3 text-sm font-semibold text-red-700">Blocked words: {safetyTest.prohibited_words.join(', ')}</p>
          <p className="mt-3 text-sm text-slate-700">Safe rewrite: {safetyTest.safe_rewrite}</p>
        </Card>
      </div>
    </AppShell>
  );
}
