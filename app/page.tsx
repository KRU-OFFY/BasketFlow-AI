import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';

export default async function Home() {
  try {
    const user = await getUser();
    redirect(user ? '/dashboard' : '/login');
  } catch (error) {
    const message=error instanceof Error?error.message:'ระบบยังไม่ได้ตั้งค่า Supabase';
    if (message.includes('NEXT_REDIRECT')) throw error;
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
}
