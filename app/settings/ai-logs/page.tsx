import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockAiLogs } from '@/lib/mock-data';

export default function AiLogs() {
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Logs</h1>
        <Link className="btn" href="/settings/ai-logs/export">Export CSV</Link>
      </div>
      <div className="mt-6 space-y-4">
        {mockAiLogs.map((log) => (
          <Card key={log.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold">{log.task_type}</p>
                <p className="mt-1 text-sm text-slate-500">{log.prompt_version} · {log.ai_provider}/{log.ai_model} · {log.latency_ms}ms</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={log.status === 'success' ? 'green' : 'orange'}>{log.status}</Badge>
                <Link className="text-sm font-bold text-orange" href={`/settings/ai-logs/${log.id}`}>ดูรายละเอียด</Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
