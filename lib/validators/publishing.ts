export type PublishableProject = { complianceStatus?: string | null; approvalStatus?: string | null; hasAffiliateDisclosure?: boolean; hasAiContentLabel?: boolean };
export function canMoveToReadyToPublish(project: PublishableProject): boolean {
  return project.complianceStatus === 'PASS' && project.approvalStatus === 'approved' && project.hasAffiliateDisclosure === true && project.hasAiContentLabel === true;
}
