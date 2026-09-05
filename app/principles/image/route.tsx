// 나의 투자 원칙 — PNG 산출 (설계 문서 §8)
// ★ 클라이언트는 문장 id만 보낸다. 문장 텍스트는 서버가 세션에서 다시 계산한다.
//   사용자 입력이 렌더러에 닿지 않으므로 주입 경로가 없다.
// ★ 생성 결과를 저장하지 않는다. 파일·DB·로그 어디에도 쓰지 않는다 —
//   문안의 「서버에 보관하지 않습니다」가 정확한 서술이어야 한다.
// ★ 별명을 넣지 않는다 (C4).
// ★ Satori는 CSS 서브셋만 지원한다. oklch()·color-mix()를 쓰지 않고 hex로 적는다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { ImageResponse } from 'next/og';
import { db } from '../../../db';
import { allocations } from '../../../db/schema';
import { BENCHMARKS } from '../../../db/seed/benchmarks';
import { kstToday } from '../../../lib/day-type';
import { pricesUpTo } from '../../../lib/portfolio/prices';
import { buildPrincipleSentences, type PrincipleRow } from '../../../lib/principles/facts';
import { getSessionUser } from '../../../lib/session';
import { weekOf } from '../../../lib/week';
import type { Weights } from '../../../lib/constants';
import type { Details } from '../../../lib/portfolio/details';

export const runtime = 'nodejs';

// Satori는 가변 폰트 테이블을 못 읽는다. 정적 Regular만 쓴다.
const FONT = readFileSync(join(process.cwd(), 'assets/fonts/NotoSansKR-400.ttf'));

// ★ 토큰(app/globals.css)의 oklch를 sRGB로 옮긴 값이다. 눈대중으로 고르지 않는다 —
//   `node scripts/tokens-to-hex.mjs` 가 뽑아 준다. 토큰을 손보면 여기도 다시 뽑아 맞춘다.
//   이 PNG는 사용자가 밖으로 들고 나가는 유일한 산출물이라 브랜드 색이 정확해야 한다.
const BG = '#0a0a0c'; // background
const FG = '#f5f5f7'; // foreground
const MUTED = '#a4a4ac'; // muted-foreground
const LINE = '#252529'; // border
const ACCENT = '#feba08'; // primary

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response('세션이 없습니다.', { status: 401 });

  const requested = new URL(request.url).searchParams.get('lines') ?? '';
  const wanted = new Set(requested.split(',').filter(Boolean));

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));
  if (rows.length === 0) return new Response('편성 기록이 없습니다.', { status: 404 });

  const today = kstToday();
  const principleRows: PrincipleRow[] = rows.map((r) => ({
    weekOf: r.weekOf,
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Weights,
    details: (r.details as Details | null) ?? null,
  }));
  const { dates, series } = pricesUpTo(today);
  const all = buildPrincipleSentences({
    rows: principleRows,
    currentWeek: weekOf(new Date()),
    dates,
    series,
  });
  const picked = all.filter((s) => wanted.has(s.id));
  if (picked.length === 0) return new Response('문장을 하나 이상 선택해주세요.', { status: 400 });

  const nps = BENCHMARKS.find((b) => b.id === 'NPS');

  try {
    const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          color: FG,
          padding: '64px',
          fontFamily: 'NotoSansKR',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: 22, color: ACCENT }}>제대로</div>
          <div style={{ fontSize: 52 }}>나의 투자 원칙</div>
        </div>

        {/* ★ flexGrow + justifyContent:center — 문장 수가 셋이든 일곱이든 남는 공간을 이 블록이
            가져가고, 문장은 그 안에서 세로 가운데에 선다. 고정 높이 캔버스에 위로만 붙이면
            문장이 적을 때 아래로 400~800px가 검게 비어 산출물이 미완성으로 보인다. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
            gap: '20px',
            marginTop: '44px',
            borderTop: `2px solid ${LINE}`,
            paddingTop: '36px',
          }}
        >
          {picked.map((s) => (
            <div key={s.id} style={{ display: 'flex', fontSize: 27, lineHeight: 1.5 }}>
              {s.text}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: 'auto',
            borderTop: `2px solid ${LINE}`,
            paddingTop: '28px',
            fontSize: 18,
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex' }}>
            기준선은 국민연금 {nps?.asOf} 의결 기준입니다. 이 기록은 {today} 기준입니다.
          </div>
          <div style={{ display: 'flex' }}>
            교육용 모의 데이터입니다. 실제 거래는 일어나지 않습니다. 특정 상품이나 종목을 추천하지
            않습니다.
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [{ name: 'NotoSansKR', data: FONT, weight: 400, style: 'normal' }],
      headers: { 'Cache-Control': 'no-store' },
    },
    );
    const bytes = await image.arrayBuffer();
    return new Response(bytes, { headers: image.headers });
  } catch {
    return new Response('이미지를 만들지 못했습니다. 브라우저 인쇄로 저장해 주세요.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
