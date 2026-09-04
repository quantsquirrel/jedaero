import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '제대로 (JEDAERO)',
  description: '전역할 때 받게 될 2,000만원을, 복무 중에 미리 굴려보는 모의투자 훈련',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

// 다크모드 기본 (생활관 소등 후 사용 고려).
// ★ 폭 제한은 여기서 하지 않는다 — 랜딩은 전폭, 앱 화면만 (app)/layout.tsx 에서 모바일 폭으로 가둔다.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
