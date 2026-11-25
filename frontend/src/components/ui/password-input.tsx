'use client';

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" className="password-toggle" aria-controls={props.id} aria-pressed={visible} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)}>{visible ? 'Ẩn' : 'Hiện'}</button></div>;
}
