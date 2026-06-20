import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import { mockProject } from '@/lib/mock-data';
import { canMoveToReadyToPublish } from '@/lib/validators/publishing';

export default function Approval() {
  const safeToPublish = canMoveToReadyToPublish({
    complianceStatus: mockProject.compliance_status,
    approvalStatus: 'approved',
    hasAffiliateDisclosure: mockProject.has_affiliate_disclosure,
    hasAiContentLabel: mockProject.has_ai_content_label,
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Human Approval Gate</h1>
      <Card className="mt-6 max-w-3xl">
        <Badge tone={safeToPublish ? 'green' : 'orange'}>{safeToPublish ? 'พร้อมเข้าคิวหลังอนุมัติ' : 'รอการอนุมัติ'}</Badge>
        <ul className="mt-5 space-y-3 text-sm text-slate-700">
          <li>Compliance status = PASS</li>
          <li>Approval status = approved</li>
          <li>Affiliate disclosure = true</li>
          <li>AI content label = true</li>
        </ul>
        <div className="mt-6 flex gap-3">
          <button className="btn">Approve</button>
          <button className="btn btn-secondary">Reject</button>
        </div>
      </Card>
    </AppShell>
  );
}
