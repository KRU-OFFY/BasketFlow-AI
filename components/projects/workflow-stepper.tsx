import { Badge } from "@/components/ui/badge";

const steps = ["Import", "Brief", "Script", "Compliance", "Media", "Approval", "Queue", "Analytics", "Logs"];

export function WorkflowStepper({ current = 0 }: { current?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <Badge key={step} tone={index <= current ? "purple" : "slate"}>{index + 1}. {step}</Badge>
      ))}
    </div>
  );
}
