import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { getPageContext } from '@/lib/supabase/page';

export default async function Settings(){const {user}=await getPageContext();return <AppShell><h1 className="text-3xl font-bold">ตั้งค่า</h1><Card className="mt-6"><p><b>User ID:</b> {user.id}</p><p><b>Email:</b> {user.email}</p><p><b>ชื่อ:</b> {String(user.user_metadata?.full_name??'-')}</p><h2 className="mt-6 font-bold">AI Settings</h2><p>ระบบใช้ Mock AI เป็นค่าเริ่มต้น และจะใช้ OpenAI เมื่อกำหนด AI_PROVIDER/openAI key ฝั่งเซิร์ฟเวอร์เท่านั้น</p><h2 className="mt-6 font-bold text-orange-700">Compliance Reminder</h2><p>ห้ามกล่าวอ้างผลลัพธ์เกินจริง และต้องมี Affiliate disclosure กับ AI Content Label ก่อนเผยแพร่</p></Card></AppShell>;}
