import type { ButtonHTMLAttributes } from 'react';

export function Button({ className = '', pending, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return <button className={`button ${className}`} disabled={disabled || pending} aria-busy={pending || undefined} {...props}>{pending ? <><span className="spinner" aria-hidden="true" />Đang xử lý…</> : children}</button>;
}
