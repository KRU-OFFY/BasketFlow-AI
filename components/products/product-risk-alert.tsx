import { Card } from "@/components/ui/card";

export function ProductRiskAlert({ flags }: { flags?: string[] }) {
  if (!flags?.length) return null;
  return (
    <Card className="border-orange-200 bg-orange-50 text-sm text-orange-900">
      ตรวจพบคำ/หมวดหมู่ที่มีความเสี่ยงสูง: {flags.join(", ")} กรุณาใช้ถ้อยคำรีวิวที่ไม่กล่าวอ้างเกินจริง
    </Card>
  );
}
