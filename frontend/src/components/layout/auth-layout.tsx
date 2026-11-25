import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from './brand';

export function LearningVisual() {
  return <div className="learning-visual" aria-hidden="true"><div className="visual-grid" /><div className="visual-orbit" /><div className="kana-shadow" /><div className="kana-card"><span className="kana-card-label" lang="ja">ひらがな</span><span className="kana-letter" lang="ja">あ</span><span className="kana-sound">a<span className="sound-bars"><i /><i /><i /><i /><i /></span></span></div><div className="kana-mini" lang="ja">い<span>i</span></div><div className="kana-mini kana-mini-second" lang="ja">う<span>u</span></div><div className="visual-stamp">日</div></div>;
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-page"><header className="site-header"><Brand /><Link className="quiet-link" href="/">Trang chủ</Link></header><main id="main-content" className="auth-main"><aside className="auth-story"><span className="section-label" lang="ja">日本語</span><h1>Học một chút.<br /><span>Tiến xa hơn.</span></h1><LearningVisual /><div className="story-signature"><span>Nihongo, mỗi ngày.</span><span lang="ja">一歩ずつ。</span></div></aside><section className="auth-panel">{children}</section></main><footer className="site-footer"><span>© 2026 NihongoHub</span><span lang="ja">こんにちは。</span></footer></div>;
}
