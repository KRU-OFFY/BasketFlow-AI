import { listAiLogs } from "@/lib/data";

export async function GET() {
  const logs = await listAiLogs();
  const header = ["id", "task_type", "prompt_version", "ai_provider", "ai_model", "status", "latency_ms", "created_at"];
  const rows = logs.map((log) => header.map((key) => JSON.stringify(String(log[key as keyof typeof log] ?? ""))).join(","));
  return new Response([header.join(","), ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=ai-logs.csv"
    }
  });
}
