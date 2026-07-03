export type PublishableProject = { complianceStatus?: string | null; approvalStatus?: string | null; hasAffiliateDisclosure?: boolean; hasAiContentLabel?: boolean };
export function canMoveToReadyToPublish(project: PublishableProject): boolean {
  return project.complianceStatus === 'PASS' && project.approvalStatus === 'approved' && project.hasAffiliateDisclosure === true && project.hasAiContentLabel === true;
}

export type VersionBoundPublishableProject = PublishableProject & {
  compliancePhase?: string | null;
  archivedAt?: string | null;
  pendingRequestCount?: number;
  currentScriptId?: string | null;
  complianceId?: string | null;
  complianceScriptId?: string | null;
  currentMediaRevision?: number | null;
  complianceMediaRevision?: number | null;
  approvalScriptId?: string | null;
  approvalComplianceId?: string | null;
  approvalMediaRevision?: number | null;
};

export function canMoveVersionToReadyToPublish(project:VersionBoundPublishableProject):boolean {
  return canMoveToReadyToPublish(project)
    && project.compliancePhase === 'final'
    && !project.archivedAt
    && project.pendingRequestCount === 0
    && Boolean(project.currentScriptId)
    && Boolean(project.complianceId)
    && project.complianceScriptId === project.currentScriptId
    && project.approvalScriptId === project.currentScriptId
    && project.approvalComplianceId === project.complianceId
    && project.complianceMediaRevision === project.currentMediaRevision
    && project.approvalMediaRevision === project.currentMediaRevision;
}
