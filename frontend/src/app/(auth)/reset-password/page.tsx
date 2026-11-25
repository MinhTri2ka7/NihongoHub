import type { Metadata } from 'next';
import { AuthForm } from '@/features/auth/components/auth-form';
export const metadata: Metadata = { title: 'Đặt lại mật khẩu' };
export default function Page() { return <AuthForm mode="reset" />; }
