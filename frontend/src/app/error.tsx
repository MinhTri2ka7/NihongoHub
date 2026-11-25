'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main id="main-content" className="status-page"><p className="eyebrow">CÓ CHÚT GIÁN ĐOẠN</p><h1>Trang chưa thể hiển thị.</h1><p>Vui lòng thử lại sau một chút.</p><Button onClick={reset}>Thử lại</Button><Link href="/">Về trang chủ</Link></main>; }
