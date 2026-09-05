'use client';
// 루트 레이아웃까지 실패했을 때의 최종 방어선. <html>/<body>를 직접 그려야 한다.
// globals.css 가 로드되지 않았을 수 있으므로 인라인 스타일만 쓴다. 스택트레이스는 내지 않는다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#0a0a0c',
          color: '#f5f5f7',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <main style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 12, letterSpacing: '0.18em', color: 'rgba(251,191,36,0.8)', margin: 0 }}>
              화면을 불러오지 못했습니다
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '10px 0 0' }}>잠시 연결이 끊겼습니다</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#a4a4ac', margin: '12px 0 0', wordBreak: 'keep-all' }}>
              교육용 모의 훈련 서비스입니다. 실제 거래·주문·결제는 일어나지 않으며, 지금 오류로
              잃는 것은 없습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 48,
              borderRadius: 12,
              border: 0,
              background: '#feba08',
              color: '#120c04',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          <a
            href="/demo"
            style={{
              height: 48,
              borderRadius: 12,
              border: '1px solid #2f2f33',
              color: '#f5f5f7',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            데모로 다시 들어가기
          </a>
          <p style={{ fontSize: 11, color: '#717178', margin: 0 }}>
            {error.digest ? `참조 코드 ${error.digest}` : '잠시 뒤 다시 열어 주세요.'}
          </p>
        </main>
      </body>
    </html>
  );
}
