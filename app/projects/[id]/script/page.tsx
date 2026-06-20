import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockScript } from '@/lib/ai/script-generator';
import { mockProduct } from '@/lib/mock-data';

export default function Script() {
  const script = mockScript({ title: mockProduct.title, duration: 30 });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Script Studio</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[.7fr_1.3fr]">
        <Card>
          <label className="label" htmlFor="duration">Duration</label>
          <select className="input mt-1" id="duration" defaultValue="30">
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
            <option value="90">90 seconds</option>
          </select>
          <div className="mt-4 space-y-2 text-sm">
            <Badge tone="green">Affiliate Disclosure Included</Badge>
            <p className="text-slate-500">สคริปต์ mock จะใส่ disclosure ภาษาไทยโดยอัตโนมัติ</p>
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Full Script</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{script.full_script}</p>
          <h3 className="mt-5 font-bold">Subtitle Lines</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            {script.subtitle_lines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}
