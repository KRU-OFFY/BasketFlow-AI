import type { PublishingGateInput } from "@/lib/types/domain";

export function canMoveToReadyToPublish(project: PublishingGateInput) {
  return (
    project.complianceStatus === "PASS" &&
    project.approvalStatus === "approved" &&
    project.hasAffiliateDisclosure === true &&
    project.hasAiContentLabel === true
  );
}
