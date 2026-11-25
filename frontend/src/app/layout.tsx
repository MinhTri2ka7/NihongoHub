import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'NihongoHub — Tiếng Nhật, từ những điều nhỏ', template: '%s | NihongoHub' },
  description: 'Bắt đầu hành trình học tiếng Nhật theo nhịp của bạn với NihongoHub.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body><a className="skip-link" href="#main-content">Đến nội dung chính</a><AuthProvider>{children}</AuthProvider></body></html>;
}
