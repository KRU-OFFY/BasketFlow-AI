import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockBrief } from '@/lib/ai/brief-generator';
import { mockProduct } from '@/lib/mock-data';

export default function Brief({ params }: { params: { id: string } }) {
  const brief = mockBrief(mockProduct);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">AI Brief Studio</h1>
      <p className="mt-2 text-slate-500">Project ID: {params.id} · mock analyzer พร้อมต่อ OpenAI ภายหลัง</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <Badge tone={brief.risk_level === 'low' ? 'green' : 'orange'}>Risk: {brief.risk_level}</Badge>
          <h2 className="mt-4 text-xl font-bold">Product Summary</h2>
          <p className="mt-2 text-slate-700">{brief.product_summary}</p>
          <h3 className="mt-4 font-bold">Target Audience</h3>
          <p className="text-slate-700">{brief.target_audience}</p>
        </Card>
        <Card>
          <h2 className="font-bold">Content Angles</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {brief.content_angles.map((angle) => <li key={angle}>{angle}</li>)}
          </ul>
          <h2 className="mt-5 font-bold">Hook Ideas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {brief.hook_ideas.map((hook) => <li key={hook}>{hook}</li>)}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
