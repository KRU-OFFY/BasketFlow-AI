'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) loginError('กรุณากรอกอีเมลและรหัสผ่าน');
  let failed=false;
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) loginError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!fullName || !email || password.length < 8) loginError('กรุณากรอกข้อมูลให้ครบ และใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร');
  let failed=false;
  let hasSession=false;
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:fullName } } });
    failed = Boolean(error);
    hasSession = Boolean(data.session);
  } catch {
    failed = true;
  }
  if (failed) loginError('สมัครใช้งานไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่');
  if (!hasSession) loginError('สมัครสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่');
  redirect('/login');
}
