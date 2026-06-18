import { generateBrief } from "@/actions/ai";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><PageHeader title="AI Product Brief Studio" description="Mock AI analyzer พร้อมต่อ OpenAI ในอนาคต" /><WorkflowStepper current={2} /><Card className="mt-6"><form action={generateBrief}><input type="hidden" name="project_id" value={id} /><Button>Generate AI Product Brief</Button></form><div className="mt-6 grid gap-4 md:grid-cols-2"><Card><h3 className="font-bold">Output fields</h3><ul className="mt-3 list-disc pl-5 text-sm text-slate-600"><li>product_summary</li><li>target_audience</li><li>pain_points</li><li>key_benefits</li><li>usp</li><li>content_angles</li><li>hook_ideas</li><li>risk_level</li><li>creator_note</li></ul></Card><Card className="bg-purple-50"><p className="text-sm text-purple-900">ค่าเริ่มต้นใช้ AI_PROVIDER=mock จึงไม่เรียก OpenAI จนกว่าจะตั้งค่า provider และ API key</p></Card></div></Card></AppShell>;
}
