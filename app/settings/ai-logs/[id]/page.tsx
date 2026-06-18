import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getAiLog } from "@/lib/data";

export default async function AiLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const log = await getAiLog(id);
  if (!log) notFound();
  return <AppShell><PageHeader title="AI Log Detail" description={log.id} /><Card><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(log, null, 2)}</pre></Card></AppShell>;
}
