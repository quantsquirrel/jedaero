import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: '제대로 (JEDAERO)',
  description: '전역할 때 받게 될 2,000만원을, 복무 중에 미리 굴려보는 모의투자 훈련',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c', // --background 의 sRGB 값
  width: 'device-width',
  initialScale: 1,
};

// 글꼴은 빌드 시점에 내려받아 우리 도메인에서 서빙한다 (next/font).
// 런타임에 fonts.googleapis.com 을 부르지 않는다 — 심사 기간에 외부 장애가 화면을 흔들지 않게.
const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-kr',
  display: 'swap',
});

// 금액·비율·포인트 등 모든 수치는 모노로 — 자릿수가 흔들리면 비교가 어렵다
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

// 다크모드 기본 (생활관 소등 후 사용 고려).
// ★ 폭 제한은 여기서 하지 않는다 — 랜딩은 전폭, 앱 화면만 (app)/layout.tsx 에서 모바일 폭으로 가둔다.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`dark ${plexSansKr.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
