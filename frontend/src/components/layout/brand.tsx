import Link from 'next/link';

export function Brand() {
  return <Link href="/" className="brand" aria-label="NihongoHub - Trang chủ"><span className="brand-symbol" lang="ja">日</span><span>nihongo<span className="brand-accent">hub</span></span></Link>;
}
