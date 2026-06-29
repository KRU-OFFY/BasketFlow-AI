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
  let failure:string|undefined;
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    failure = error?.message;
  } catch (error) {
    failure = error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ';
  }
  if (failure) loginError(failure);
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!fullName || !email || password.length < 8) loginError('กรุณากรอกข้อมูลให้ครบ และใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร');
  let failure:string|undefined;
  let hasSession=false;
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:fullName } } });
    failure = error?.message;
    hasSession = Boolean(data.session);
  } catch (error) {
    failure = error instanceof Error ? error.message : 'สมัครใช้งานไม่สำเร็จ';
  }
  if (failure) loginError(failure);
  if (!hasSession) loginError('สมัครสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`ออกจากระบบไม่สำเร็จ: ${error.message}`);
  redirect('/login');
}
