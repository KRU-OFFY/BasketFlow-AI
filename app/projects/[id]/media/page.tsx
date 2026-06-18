import { createMediaAsset, updateAiContentLabel } from "@/actions/media";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";
import { THAI_AI_CONTENT_LABEL } from "@/lib/ai/compliance-checker";

const assets = ["voiceover", "ai_avatar", "subtitle", "video_preview"];

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><PageHeader title="Media Studio" description="ระบบ placeholder สำหรับ voiceover, avatar, subtitle และ preview" /><WorkflowStepper current={5} /><Card className="mt-6"><form action={updateAiContentLabel} className="mb-6 rounded-xl bg-purple-50 p-4"><input type="hidden" name="project_id" value={id} /><label className="flex items-center gap-2"><input type="checkbox" name="has_ai_content_label" defaultChecked /> เปิด AI Content Label</label><p className="mt-2 text-sm text-purple-800">{THAI_AI_CONTENT_LABEL}</p><Button className="mt-3 bg-purple-600 hover:bg-purple-700">บันทึก label</Button></form><div className="grid gap-4 md:grid-cols-4">{assets.map((asset) => <form action={createMediaAsset} key={asset} className="rounded-xl border p-4"><input type="hidden" name="project_id" value={id} /><input type="hidden" name="asset_type" value={asset} /><h3 className="font-bold">{asset}</h3><p className="my-3 text-sm text-slate-500">Mock metadata / storage-ready</p><Button>สร้าง mock</Button></form>)}</div></Card></AppShell>;
}
