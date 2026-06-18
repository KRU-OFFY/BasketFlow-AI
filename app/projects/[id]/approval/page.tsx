import { approveProject, moveToPublishingQueue, rejectProject } from "@/actions/approvals";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { WorkflowStepper } from "@/components/projects/workflow-stepper";

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><PageHeader title="Human Approval Gate" description="ต้องผ่าน Compliance + Approval + Disclosure + AI label ก่อนเข้าคิว" /><WorkflowStepper current={6} /><div className="mt-6 grid gap-6 md:grid-cols-3"><Card><h2 className="font-bold">Approve</h2><form action={approveProject} className="mt-4"><input type="hidden" name="project_id" value={id} /><Button>อนุมัติ</Button></form></Card><Card><h2 className="font-bold">Reject</h2><form action={rejectProject} className="mt-4 space-y-3"><input type="hidden" name="project_id" value={id} /><Textarea name="note" placeholder="เหตุผล" /><Button className="bg-red-600 hover:bg-red-700">ปฏิเสธ</Button></form></Card><Card><h2 className="font-bold">Move to Queue</h2><p className="my-3 text-sm text-slate-500">ปุ่มนี้ตรวจ safety gate และไม่อนุญาต bypass</p><form action={moveToPublishingQueue}><input type="hidden" name="project_id" value={id} /><Button className="bg-purple-600 hover:bg-purple-700">ส่งเข้าคิวเผยแพร่</Button></form></Card></div></AppShell>;
}
