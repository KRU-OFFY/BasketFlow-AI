import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function AiLogs() {
  const {supabase,user}=await getPageContext();
  const {data:logs,error}=await supabase.from('ai_logs').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(error)throw new Error(`โหลด AI Logs ไม่สำเร็จ: ${error.message}`);

  return <AppShell><div className="flex items-center justify-between"><h1 className="text-3xl font-bold">AI Logs</h1><Link className="btn" href="/settings/ai-logs/export">Export CSV</Link></div><div className="mt-6 space-y-4">{logs?.length?logs.map(log=><Card key={log.id}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-bold">{log.task_type}</p>
        <p className="mt-1 text-sm text-slate-500">{log.prompt_version} · {log.ai_provider}/{log.ai_model} · {log.latency_ms??0}ms · {new Date(log.created_at).toLocaleString('th-TH')}</p>
      </div>
      <div className="flex items-center gap-3"><Badge tone={log.status==='error'?'red':log.status==='success'?'green':'orange'}>{log.status}</Badge><Link className="text-sm font-bold text-orange" href={`/settings/ai-logs/${log.id}`}>ดูรายละเอียด</Link></div>
    </div>
  </Card>):<Card className="text-center">ยังไม่มี AI Logs</Card>}</div></AppShell>;
}
