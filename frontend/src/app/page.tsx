import Link from 'next/link';
import { Brand } from '@/components/layout/brand';
import { LearningVisual } from '@/components/layout/auth-layout';

export default function Home() {
  return <div className="home-page"><header className="site-header"><Brand /><nav className="home-nav" aria-label="Điều hướng"><Link href="/login">Đăng nhập</Link><Link href="/register" className="button button-small">Bắt đầu học</Link></nav></header><main id="main-content"><section className="home-hero"><div className="home-hero-copy"><span className="section-label">日本語 / NIHONGO</span><h1>Tiếng Nhật.<br /><em>Thêm một <br />thế giới.</em></h1><p>Bắt đầu nhỏ. Học theo nhịp của bạn.</p><div className="hero-actions"><Link className="button" href="/register">Bắt đầu học</Link><Link className="text-link" href="/login">Đăng nhập</Link></div></div><div className="home-art"><LearningVisual /></div></section><section className="learning-strip" aria-label="Hành trình học"><div><span lang="ja">あ</span><h2>Từ căn bản.</h2></div><div><span lang="ja">言</span><h2>Đến tự tin.</h2></div><div><span lang="ja">日</span><h2>Mỗi ngày.</h2></div></section></main><footer className="site-footer"><span>© 2026 NihongoHub</span><span lang="ja">こんにちは。</span></footer></div>;
}
