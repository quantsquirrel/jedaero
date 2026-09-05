import { SourceChip } from '@/components/source-chip';

// 기록 흐름도 (SPEC §2-1) — 무엇을 남기고 무엇을 남기지 않는가.
// ★ 「사용자 정보 / 수익률 / 판단」을 한 덩어리로 저장하지 않는다는 것이 이 그림의 논점이다.
//   실선 = 남는다, 점선 = 남지 않는다. 신호색은 「요청 때 계산한다」 한 곳에만 쓴다.
// 데스크톱은 흐름도, 모바일(md 미만)은 같은 내용을 세 갈래로 세워 보여준다 —
// 1000px 도표를 390px 에 밀어 넣으면 글자가 5pt 가 되어 아무도 읽지 못한다.

const STORED: [string, string][] = [
  ['users', '별명·계급·군종·날짜·거리'],
  ['allocations', '주 1행 · UNIQUE(user_id, week_of)'],
  ['drafts', '평일 초안 — 체결 아닌 메모'],
  ['groups / members', '익명 초대코드'],
  ['tickers / prices', '더미 일별 종가 시드'],
  ['ai_calls', '호출 여부 · 한도 로그(운영)'],
];

const COMPUTED: [string, string][] = [
  ['수익률 · 평가액 · 보유수량', '비중 이력 × 종가'],
  ['제대로 지수 주간 점수', '계산 후 lazy upsert'],
];

const INPUTS = ['별명 · 계급 · 군종 · 날짜 · 거리 구간', '주말 편성 확정 — 판단', '평일 명령하달 초안', '그룹 소속 · 분석 동의'];

export function RecordFlow() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
            무엇을 남기고, 무엇을 남기지 않는가
          </h3>
          <p className="max-w-[62ch] break-keep text-sm leading-relaxed text-muted-foreground">
            사용자 정보와 판단과 수익률을 한 덩어리로 저장하지 않습니다. 판단은 남기고, 계산으로
            만들 수 있는 숫자는 저장하지 않으며, 회고 원문은 응답을 만든 뒤 버립니다.
          </p>
        </div>
        <SourceChip kind="rule" label="기능 명세 SPEC §2-1" className="shrink-0" />
      </div>

      {/* ── 데스크톱: 흐름도 ─────────────────────── */}
      <svg
        viewBox="0 0 1000 560"
        className="mt-8 hidden w-full md:block"
        role="img"
        aria-label="입력이 규칙·AI 경계를 지나 저장·요청 때 계산·폐기로 나뉘는 흐름도"
      >
        <g className="fill-faint text-[11px] font-semibold" style={{ letterSpacing: '2px' }}>
          <text x="0" y="14">입력</text>
          <text x="340" y="14">경계</text>
          <text x="610" y="14">남는 곳</text>
        </g>

        {/* 연결선 — 실선은 남는 길, 점선은 남지 않는 길 */}
        <g fill="none" strokeWidth="1.3" className="stroke-input">
          <path d="M270 69 C310 69 305 160 340 160" />
          <path d="M270 135 C305 135 310 160 340 160" />
          <path d="M270 195 C305 195 310 160 340 160" />
          <path d="M270 255 C305 255 310 160 340 160" />
          <path d="M270 339 L340 339" />
        </g>
        <path d="M530 160 C570 160 575 147 610 147" fill="none" strokeWidth="1.6" className="stroke-muted-foreground/50" />
        <path d="M530 160 C575 160 570 324 610 324" fill="none" strokeWidth="1.6" className="stroke-primary/55" />
        <g fill="none" strokeWidth="1.6" className="stroke-violet-500/50">
          <path d="M435 200 L435 306" />
          <path d="M530 339 C570 339 572 417 610 417" />
        </g>
        <path d="M270 498 L610 498" fill="none" strokeWidth="1.3" strokeDasharray="5 5" className="stroke-input" />

        <g className="fill-violet-300 text-[10px]">
          <text x="443" y="258">규칙이 만든</text>
          <text x="443" y="272">숫자만 전달</text>
        </g>

        {/* 입력 */}
        <g>
          <rect x="0" y="40" width="270" height="58" rx="12" className="fill-background stroke-border" />
          <text x="16" y="66" className="fill-foreground text-[13px] font-semibold">별명 · 계급 · 군종</text>
          <text x="16" y="85" className="fill-faint text-[11px]">입대일 · 전역예정일 · 거리 구간</text>

          <rect x="0" y="112" width="270" height="46" rx="12" className="fill-background stroke-border" />
          <text x="16" y="140" className="fill-foreground text-[13px] font-semibold">주말 편성 확정 — 판단</text>

          <rect x="0" y="172" width="270" height="46" rx="12" className="fill-background stroke-border" />
          <text x="16" y="200" className="fill-foreground text-[13px] font-semibold">평일 명령하달 초안</text>

          <rect x="0" y="232" width="270" height="46" rx="12" className="fill-background stroke-border" />
          <text x="16" y="260" className="fill-foreground text-[13px] font-semibold">그룹 소속 · 분석 동의</text>

          <rect x="0" y="316" width="270" height="46" rx="12" className="fill-background stroke-violet-500/30" />
          <text x="16" y="344" className="fill-foreground text-[13px] font-semibold">한 줄 회고</text>

          <rect x="0" y="472" width="270" height="52" rx="12" fill="none" strokeDasharray="5 5" className="stroke-input" />
          <text x="16" y="496" className="fill-muted-foreground text-[13px] font-semibold">실명 · 소속 부대 · 위치</text>
          <text x="16" y="513" className="fill-faint text-[11px]">애초에 받지 않는 것</text>
        </g>

        {/* 경계 */}
        <g>
          <rect x="340" y="120" width="190" height="80" rx="14" className="fill-secondary stroke-border" />
          <text x="360" y="152" className="fill-foreground text-[14px] font-bold">규칙</text>
          <text x="360" y="172" className="fill-muted-foreground text-[11px]">공개된 산식이 계산</text>
          <text x="360" y="188" className="fill-faint text-[11px]">코드와 화면이 같은 상수</text>

          <rect x="340" y="306" width="190" height="66" rx="14" className="fill-violet-500/10 stroke-violet-500/40" />
          <text x="360" y="334" className="fill-violet-300 text-[14px] font-bold">AI</text>
          <text x="360" y="354" className="fill-muted-foreground text-[11px]">읽고 질문 하나를 돌려줌</text>
        </g>

        {/* 남는 곳 */}
        <g>
          <rect x="610" y="40" width="390" height="214" rx="14" className="fill-background stroke-border" />
          <text x="630" y="68" className="fill-foreground text-[13px] font-bold">저장한다 — PostgreSQL (Neon)</text>
          {STORED.map(([table, note], i) => (
            <g key={table}>
              <text x="630" y={96 + i * 26} className="fill-muted-foreground text-[11.5px]">{table}</text>
              <text x="790" y={96 + i * 26} className="fill-faint text-[11.5px]">{note}</text>
            </g>
          ))}

          <rect x="610" y="272" width="390" height="104" rx="14" className="fill-primary/5 stroke-primary/40" />
          <text x="630" y="300" className="fill-primary text-[13px] font-bold">요청 때 계산한다 — 크론 없음</text>
          {COMPUTED.map(([what, how], i) => (
            <g key={what}>
              <text x="630" y={326 + i * 26} className="fill-muted-foreground text-[11.5px]">{what}</text>
              <text x="850" y={326 + i * 26} className="fill-faint text-[11.5px]">{how}</text>
            </g>
          ))}

          <rect x="610" y="392" width="390" height="56" rx="14" fill="none" strokeDasharray="5 5" className="stroke-violet-500/35" />
          <text x="630" y="418" className="fill-foreground text-[13px] font-bold">폐기한다</text>
          <text x="630" y="437" className="fill-faint text-[11.5px]">한 줄 회고 본문 — 응답을 만든 뒤 저장하지 않고 버림</text>

          <rect x="610" y="472" width="390" height="52" rx="14" fill="none" strokeDasharray="5 5" className="stroke-input" />
          <text x="630" y="496" className="fill-muted-foreground text-[13px] font-bold">입력란 자체가 없다</text>
          <text x="630" y="513" className="fill-faint text-[11.5px]">컬럼에도, 입력폼에도, 로그에도 없음</text>
        </g>
      </svg>

      {/* ── 모바일: 같은 내용을 세 갈래로 ─────────── */}
      <div className="mt-6 flex flex-col gap-3 md:hidden">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-bold">저장한다 — PostgreSQL (Neon)</p>
          <p className="mt-1 text-xs text-faint">{INPUTS.join(' · ')}</p>
          <div className="mt-3 flex flex-col gap-2">
            {STORED.map(([table, note]) => (
              <div key={table} className="flex flex-col">
                <span className="font-mono text-xs text-muted-foreground">{table}</span>
                <span className="break-keep text-xs leading-relaxed text-faint">{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-bold text-primary">요청 때 계산한다 — 크론 없음</p>
          <div className="mt-3 flex flex-col gap-2">
            {COMPUTED.map(([what, how]) => (
              <div key={what} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{what}</span>
                <span className="text-xs text-faint">{how}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-violet-500/35 p-4">
          <p className="text-sm font-bold">폐기한다</p>
          <p className="mt-1 break-keep text-xs leading-relaxed text-faint">
            한 줄 회고 본문 — AI가 응답을 만든 뒤 저장하지 않고 버립니다.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-input p-4">
          <p className="text-sm font-bold text-muted-foreground">입력란 자체가 없다</p>
          <p className="mt-1 break-keep text-xs leading-relaxed text-faint">
            실명 · 소속 부대 · 위치 — 컬럼에도, 입력폼에도, 로그에도 없습니다.
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:gap-8">
        <p className="flex-1 break-keep text-sm leading-relaxed text-muted-foreground">
          <b className="text-foreground">없는 것:</b> <span className="font-mono text-xs">holdings</span> 테이블과{' '}
          <span className="font-mono text-xs">cash_balance</span> 컬럼. 보유수량은 저장하지 않고 (비중
          이력 × 종가)로 요청 시점에 계산합니다. 현금은 예비대, 곧 미배치 포인트입니다.
        </p>
        <p className="flex-1 break-keep text-sm leading-relaxed text-muted-foreground">
          <b className="text-foreground">로그인이 없는 것과 DB가 없는 것은 다릅니다.</b> 익명 쿠키는{' '}
          <span className="font-mono text-xs">users.id</span>를 가리키는 포인터일 뿐이고, 편성·초안·그룹·지수는
          전부 DB에 있습니다. 뺀 것은 이메일 가입과 계정 복구입니다.
        </p>
      </div>
    </div>
  );
}
