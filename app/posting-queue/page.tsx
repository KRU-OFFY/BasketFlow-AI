import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listProjects } from "@/lib/data";
import { canMoveToReadyToPublish } from "@/lib/validators/publishing";

export default async function QueuePage() {
  const projects = (await listProjects()).filter((p) => canMoveToReadyToPublish({ complianceStatus: p.compliance_status, approvalStatus: p.approval_status, hasAffiliateDisclosure: p.has_affiliate_disclosure, hasAiContentLabel: p.has_ai_content_label }));
  return <AppShell><PageHeader title="Publishing Queue" description="แสดงเฉพาะโปรเจกต์ที่ผ่าน safety gate" /><div className="space-y-3">{projects.map((p) => <Card key={p.id} className="flex justify-between"><span>{p.title}</span><Badge tone="green">ready</Badge></Card>)}{!projects.length ? <Card>ยังไม่มีโปรเจกต์ที่พร้อมเผยแพร่</Card> : null}</div></AppShell>;
}
