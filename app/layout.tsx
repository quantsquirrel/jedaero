import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '제대로 (JEDAERO)',
  description: '전역할 때 실제로 받게 될 2,020만원을, 복무 중에 미리 굴려보는 모의투자 훈련',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

// 다크모드 기본 (생활관 소등 후 사용 고려). 모바일 우선 — 데스크톱에서는 모바일 폭 중앙 정렬
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <div className="mx-auto min-h-dvh w-full max-w-md border-x border-border/40">{children}</div>
      </body>
    </html>
  );
}
