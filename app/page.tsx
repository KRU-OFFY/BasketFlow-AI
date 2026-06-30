import { redirect, unstable_rethrow } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';

export default async function Home() {
  try {
    const user = await getUser();
    redirect(user ? '/dashboard' : '/login');
  } catch (error) {
    unstable_rethrow(error);
    const message=error instanceof Error?error.message:'ระบบยังไม่ได้ตั้งค่า Supabase';
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
}
