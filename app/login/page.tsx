import { login, signup } from '@/actions/auth';
import { BasketPilotLogo, BASKETPILOT_TAGLINE } from '@/components/brand/basketpilot-logo';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#FF6B4A_0,#302B7A_42%,#0B1026_100%)] p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-white/20 md:grid md:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-navy p-10 text-white md:flex">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple/40 blur-3xl" />
          <div className="relative z-10">
            <BasketPilotLogo inverted showTagline />
            <div className="mt-16 max-w-md">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-mango">AI Affiliate Content Factory</p>
              <h1 className="mt-4 text-5xl font-black leading-tight">
                ปั้นคลิปรีวิวให้พร้อมปักตะกร้าอย่างเป็นระบบ
              </h1>
              <p className="mt-5 text-lg text-white/70">{BASKETPILOT_TAGLINE}</p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 text-sm">
            {['วิเคราะห์สินค้า', 'สร้างสคริปต์', 'ตรวจ Safety Gate'].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold ring-1 ring-white/10">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="mb-8 md:hidden">
            <BasketPilotLogo showTagline />
          </div>
          <Card className="border-0 shadow-none">
            <h2 className="text-2xl font-black text-navy">เข้าสู่ระบบ BasketPilot AI</h2>
            <p className="mt-2 text-slate-600">เริ่มจัดการงานรีวิวสินค้า Shopee Affiliate ด้วย AI workflow ที่ปลอดภัย</p>

            <form action={login} className="mt-8 space-y-3">
              <input className="input" name="email" type="email" placeholder="อีเมล" />
              <input className="input" name="password" type="password" placeholder="รหัสผ่าน" />
              <button className="btn w-full">Login</button>
            </form>

            <form action={signup} className="mt-8 space-y-3 border-t pt-8">
              <p className="text-sm font-bold text-slate-500">สมัครใช้งานใหม่</p>
              <input className="input" name="full_name" placeholder="ชื่อ-นามสกุล" />
              <input className="input" name="email" type="email" placeholder="อีเมลสมัครใหม่" />
              <input className="input" name="password" type="password" placeholder="รหัสผ่าน" />
              <button className="btn btn-secondary w-full">Signup</button>
            </form>
          </Card>
        </section>
      </div>
    </main>
  );
}
