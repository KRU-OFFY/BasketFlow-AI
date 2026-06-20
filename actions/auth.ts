'use server';
import { redirect } from 'next/navigation'; import { createServerSupabase } from '@/lib/supabase/server';
export async function login(formData: FormData) { const supabase=await createServerSupabase(); const email=String(formData.get('email')); const password=String(formData.get('password')); await supabase.auth.signInWithPassword({email,password}); redirect('/dashboard'); }
export async function signup(formData: FormData) { const supabase=await createServerSupabase(); const email=String(formData.get('email')); const password=String(formData.get('password')); await supabase.auth.signUp({email,password,options:{data:{full_name:formData.get('full_name')}}}); redirect('/dashboard'); }
export async function logout() { await (await createServerSupabase()).auth.signOut(); redirect('/login'); }
