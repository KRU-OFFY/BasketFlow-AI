import { login, signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  void searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <Card className="w-full max-w-4xl border-white/10 bg-white/95">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-purple-700 p-8 text-white">
            <p className="text-sm uppercase tracking-wide text-white/70">AI Product Review Video Bot</p>
            <h1 className="mt-3 text-3xl font-bold">สร้างคลิปรีวิว Shopee Affiliate แบบปลอดภัย</h1>
            <p className="mt-4 text-white/80">นำเข้าสินค้า สร้าง brief/script ตรวจ compliance และส่งเข้าคิวเผยแพร่ผ่าน human approval</p>
          </div>
          <div className="space-y-6">
            <form action={login} className="space-y-3">
              <h2 className="text-xl font-bold">เข้าสู่ระบบ</h2>
              <Input name="email" type="email" placeholder="อีเมล" required />
              <Input name="password" type="password" placeholder="รหัสผ่าน" required />
              <Button className="w-full">Login</Button>
            </form>
            <form action={signup} className="space-y-3 border-t pt-6">
              <h2 className="text-xl font-bold">สมัครใช้งาน</h2>
              <Input name="full_name" placeholder="ชื่อ-นามสกุล" />
              <Input name="email" type="email" placeholder="อีเมล" required />
              <Input name="password" type="password" placeholder="รหัสผ่าน" required />
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Signup</Button>
            </form>
          </div>
        </div>
      </Card>
    </main>
  );
}
