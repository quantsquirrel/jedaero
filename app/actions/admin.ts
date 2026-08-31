'use server';
// 관리자 — 킬스위치 (S11). 에러 메시지는 일반화하고 상세를 노출하지 않는다.
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { settings } from '../../db/schema';
import { ADMIN_COOKIE, adminHash, isAdminAuthed } from '../../lib/admin';

export type AdminLoginState = { error?: string };

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const password = String(formData.get('password') ?? '');
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return { error: '인증에 실패했습니다.' };

  const store = await cookies();
  store.set(ADMIN_COOKIE, adminHash()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 3600,
    path: '/',
  });
  revalidatePath('/admin');
  return {};
}

export async function setAiEnabled(enabled: boolean): Promise<{ error?: string }> {
  if (!(await isAdminAuthed())) return { error: '권한이 없습니다.' };
  await db
    .insert(settings)
    .values({ key: 'ai_enabled', value: enabled ? 'true' : 'false' })
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });
  revalidatePath('/admin');
  return {};
}
