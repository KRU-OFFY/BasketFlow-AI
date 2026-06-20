import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProject } from '@/lib/mock-data';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';

export default function Queue() {
  const canQueue = canMoveToReadyToPublish({
    complianceStatus: mockProject.compliance_status,
    approvalStatus: mockProject.approval_status,
    hasAffiliateDisclosure: mockProject.has_affiliate_disclosure,
    hasAiContentLabel: mockProject.has_ai_content_label,
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Publishing Queue</h1>
      <Card className="mt-6">
        <Badge tone={canQueue ? 'green' : 'orange'}>{canQueue ? 'Ready' : 'Safety Gate Locked'}</Badge>
        <p className="mt-4 text-slate-700">
          แสดงเฉพาะโปรเจกต์ที่ผ่าน PASS, approved, disclosure และ AI label แล้วเท่านั้น
        </p>
        {!canQueue && <p className="mt-3 text-sm text-orange-700">โปรเจกต์ตัวอย่างยังรอ Human Approval จึงยังไม่ถูกเพิ่มเข้าคิว</p>}
      </Card>
    </AppShell>
  );
}
