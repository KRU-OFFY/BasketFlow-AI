import { AppShell } from '@/components/layout/app-shell'; import { Card, Badge } from '@/components/ui/card';
export default function Queue(){return <AppShell><h1 className="text-3xl font-bold">Publishing Queue</h1><Card className="mt-6"><Badge tone="green">Safety gated</Badge><p className="mt-4">แสดงเฉพาะโปรเจกต์ที่ผ่าน PASS, approved, disclosure และ AI label แล้วเท่านั้น</p></Card></AppShell>}
