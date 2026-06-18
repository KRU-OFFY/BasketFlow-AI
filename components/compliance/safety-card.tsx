import { Card } from "@/components/ui/card";

export function SafetyCard() {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <h2 className="font-bold text-orange-900">Safety reminder</h2>
      <p className="mt-2 text-sm text-orange-800">หลีกเลี่ยงคำกล่าวอ้างเกินจริง เช่น หายขาด เห็นผลทันที ปลอดภัย 100% และต้องใส่ Affiliate disclosure เสมอ</p>
    </Card>
  );
}
