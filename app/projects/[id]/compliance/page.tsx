import { runCompliance } from "@/actions/compliance";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";
import { SafetyCard } from "@/components/compliance/safety-card";
import { THAI_AFFILIATE_DISCLOSURE } from "@/lib/ai/script-generator";

export default async function CompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><PageHeader title="Compliance Center" description="Rule-based checker ก่อนต่อ OpenAI" /><WorkflowStepper current={4} /><div className="mt-6 grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><form action={runCompliance} className="space-y-4"><input type="hidden" name="project_id" value={id} /><Textarea name="script" defaultValue={`สคริปต์รีวิวสินค้า\n${THAI_AFFILIATE_DISCLOSURE}`} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="has_ai_content_label" defaultChecked /> มี AI content label</label><Button>Run Compliance Check</Button></form></Card><SafetyCard /></div></AppShell>;
}
