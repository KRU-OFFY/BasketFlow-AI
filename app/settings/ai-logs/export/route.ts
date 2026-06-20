import { mockAiLogs } from '@/lib/mock-data';

export async function GET() {
  const header = 'id,task_type,prompt_version,ai_provider,ai_model,status,latency_ms,created_at';
  const rows = mockAiLogs.map((log) => [
    log.id,
    log.task_type,
    log.prompt_version,
    log.ai_provider,
    log.ai_model,
    log.status,
    log.latency_ms,
    log.created_at,
  ].join(','));

  return new Response([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ai-logs.csv"',
    },
  });
}
