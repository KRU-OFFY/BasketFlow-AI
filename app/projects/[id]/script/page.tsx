import { generateScript } from "@/actions/ai";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";
import { THAI_AFFILIATE_DISCLOSURE } from "@/lib/ai/script-generator";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><PageHeader title="Script Studio" description="สร้างสคริปต์พร้อม Affiliate disclosure ภาษาไทย" /><WorkflowStepper current={3} /><Card className="mt-6"><form action={generateScript} className="space-y-4"><input type="hidden" name="project_id" value={id} /><select name="duration" className="rounded-xl border p-2"><option value="15">15 วินาที</option><option value="30">30 วินาที</option><option value="60">60 วินาที</option><option value="90">90 วินาที</option></select><Button>Generate Review Script</Button></form><Card className="mt-6 bg-orange-50"><h3 className="font-bold">Affiliate disclosure ที่บังคับใช้</h3><p className="mt-2 text-sm">{THAI_AFFILIATE_DISCLOSURE}</p></Card></Card></AppShell>;
}
