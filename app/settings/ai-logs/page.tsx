import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAiLogs } from "@/lib/data";

export default async function AiLogsPage() {
  const logs = await listAiLogs();
  return <AppShell><PageHeader title="AI Logs" description="บันทึก prompt version, provider, model และผลลัพธ์" action={<Link className="rounded-xl bg-purple-600 px-4 py-2 text-white" href="/settings/ai-logs/export">Export CSV</Link>} /><div className="space-y-3">{logs.map((log) => <Link href={`/settings/ai-logs/${log.id}`} key={log.id}><Card className="flex items-center justify-between"><div><h2 className="font-bold">{log.task_type}</h2><p className="text-sm text-slate-500">{log.prompt_version} · {log.ai_provider}/{log.ai_model}</p></div><Badge tone={log.status === "success" ? "green" : "orange"}>{log.status}</Badge></Card></Link>)}</div></AppShell>;
}
