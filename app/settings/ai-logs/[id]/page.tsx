import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getMockAiLog } from '@/lib/mock-data';

export default function AiLogDetail({ params }: { params: { id: string } }) {
  const log = getMockAiLog(params.id);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">AI Log Detail</h1>
      <Card className="mt-6">
        <Badge tone={log.status === 'success' ? 'green' : 'orange'}>{log.status}</Badge>
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="font-bold">Task</dt><dd>{log.task_type}</dd></div>
          <div><dt className="font-bold">Prompt Version</dt><dd>{log.prompt_version}</dd></div>
          <div><dt className="font-bold">Provider</dt><dd>{log.ai_provider}</dd></div>
          <div><dt className="font-bold">Latency</dt><dd>{log.latency_ms}ms</dd></div>
        </dl>
        <pre className="mt-5 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(log, null, 2)}</pre>
      </Card>
    </AppShell>
  );
}
