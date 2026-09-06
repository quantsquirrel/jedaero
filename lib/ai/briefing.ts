// AI-4: 주간 브리핑 (SPEC §4)
// - 입력은 lib/market-week.ts가 규칙 기반으로 계산한 숫자다. LLM은 숫자를 만들지 않는다.
// - 출력은 사실 요약 + "스스로 던져볼 질문 3개". 전망·추천·목표가는 출력 검증에서 폐기된다 (C10).
// - 뉴스 본문을 넣지 않는다. 시드 가격은 합성 데이터이며 실제 시세·실제 기사와 무관하다.
import type { MarketWeek } from '../market-week';
import { completeJson, hasLlmKey } from './complete';
import { verifyNumbersFrom } from './number-guard';
import { verifyFactualOutput } from './output-guard';

const r1 = (x: number) => Number((x * 100).toFixed(1));

export type Briefing = {
  summary: string; // 2~3문장 사실 요약
  questions: [string, string, string]; // 스스로 던져볼 질문 3개
};

export type WeekdayBriefing = {
  summary: string;
  questions: [string]; // 평일은 질문 1개. 주말용 손익 문장을 평일에 열지 않는다.
};

/** 기여도 내림차순. week.moves 는 «등락률» 순이라 이 순서와 어긋난다 — 그 어긋남이 재료다. */
function byImpact(week: MarketWeek) {
  return [...week.moves].sort((a, b) => b.contributionPct - a.contributionPct);
}

/** 내 손익을 절대값으로 가장 크게 움직인 전선. 오른 쪽일 수도, 내린 쪽일 수도 있다. */
function biggestMover(week: MarketWeek) {
  return week.moves.reduce((a, b) =>
    Math.abs(b.contributionPct) > Math.abs(a.contributionPct) ? b : a,
  );
}

/** 주말 LLM 입력. 내 비중과 가중 등락까지 준다 — 주말은 손익을 보는 날이다. */
export function briefingInput(week: MarketWeek) {
  const impact = byImpact(week);
  const top = impact[0];
  const bottom = impact[impact.length - 1];
  return {
    ...weekdayBriefingInput(week),
    내비중퍼센트: Object.fromEntries(week.moves.map((m) => [m.name, m.myWeight])),
    내비중가중등락퍼센트: r1(week.weightedPct),
    // ★ 여기부터가 «화면의 등락표에 없는» 재료다. 표는 전선이 얼마나 움직였는지만 보여주고,
    //   그 움직임이 내 돈을 얼마나 움직였는지는 말하지 않는다. 그 값이 등락률 × 내 비중이고,
    //   이 훈련이 가르치려는 것이 정확히 그 차이다 — 가장 크게 움직인 전선과 내 손익을 가장
    //   크게 움직인 전선은 대개 다르다 (5% 비중의 +2.3%보다 30% 비중의 −2.2%가 크다).
    //   규칙(market-week.ts)이 이미 계산해 둔 값을 넘기기만 한다. LLM 은 곱하지 않는다.
    전선별_내손익기여_퍼센트포인트: Object.fromEntries(
      week.moves.map((m) => [m.name, r1(m.contributionPct)]),
    ),
    내손익을_가장_밀어올린전선: { 이름: top.name, 기여_퍼센트포인트: r1(top.contributionPct) },
    내손익을_가장_끌어내린전선: {
      이름: bottom.name,
      기여_퍼센트포인트: r1(bottom.contributionPct),
    },
    // ★ 아래 둘은 «한 쌍»이다. 모델이 "가장 많이 움직인 전선"을 스스로 고르게 두면 부호 기준
    //   (밀어올린 쪽)과 절대값 기준이 갈려 ②와 ③이 서로 모순되는 문장이 나온다. 규칙이 하나로
    //   정해서 넘긴다 — 폴백(briefingFallback)도 같은 값을 쓰므로 두 경로가 같은 말을 한다.
    내손익을_가장_크게_움직인전선: {
      이름: biggestMover(week).name,
      기여_퍼센트포인트: r1(biggestMover(week).contributionPct),
      내비중퍼센트: biggestMover(week).myWeight,
    },
    등락1위와_기여1위가_갈렸나: week.best.name !== biggestMover(week).name,
  };
}

/** 평일 LLM 입력 — 전선이 얼마나 움직였는지«만».
 *  ★ 내 비중을 아예 주지 않는다. 등락과 비중을 함께 주면 LLM이 곱해서 이번 주 내 손익을
 *  만들 수 있고, 그때 막는 것은 프롬프트 한 줄뿐이 된다. 줄 수 있는 재료를 빼는 쪽이
 *  「말하지 마라」고 적는 쪽보다 강하다 — 평일 화면의 주어는 내가 아니라 지형이다.
 *  (number-guard 는 그 위에 얹는 2차 방어선이지 1차가 아니다.) */
export function weekdayBriefingInput(week: MarketWeek) {
  return {
    구간: `${week.fromDate} ~ ${week.toDate} (영업일 ${week.tradingDays}일)`,
    축별등락퍼센트: Object.fromEntries(week.moves.map((m) => [m.name, r1(m.changePct)])),
    가장오른축: week.best.name,
    가장내린축: week.worst.name,
  };
}

const SYSTEM_PROMPT = `너는 병사의 모의 포트폴리오 주간 브리핑을 쓰는 도구다.
데이터는 교육용 합성 시세이며 실제 시장과 무관하다 — 실제 시장을 언급하지 마라.

규칙 (어기면 출력이 폐기된다):
- 자산군을 부르는 말은 «전선»이다. 문장에서 "축"이라고 쓰지 마라 — 이 서비스에서 "세 축"은
  제대로 지수의 배점(위험을 이긴 성과·분산의 힘·판단을 지킨 힘)을 가리키는 다른 말이다.
  입력 필드 이름에 "축"이 들어 있어도 문장에는 "전선"으로 옮긴다.
- 주어진 숫자만 쓴다. 숫자를 새로 만들거나 반올림 외의 가공을 하지 않는다.
- **여러 전선의 비중을 더하지 마라.** "미국 주식과 채권을 합쳐 45%" 같은 문장은 금지다.
  합계는 주어지지 않았고, 직접 더하면 틀린 값을 쓰게 된다. 전선은 하나씩 따로 말한다.
  전체를 말해야 하면 내비중가중등락퍼센트의 «값»만 쓰고, 문장에서는
  "이번 주 내 편성 기준 −0.9%"처럼 사람이 읽는 말로 옮긴다. 필드 이름을 그대로 적지 않는다.
- 전망·예측·추천·목표가·매수/매도 판단을 절대 하지 않는다.
  "오를", "하락할", "유망", "매수", "전망", "추천", "고려" 같은 말을 쓰지 마라.
- "공격적", "보수적" 같은 성향 라벨을 붙이지 않는다.
- "~하세요", "~해야", "권장" 같은 권유형 문장을 쓰지 않는다.
- summary: 아래 네 가지를 과거형 사실 문장으로 쓴다. 180자 이내.
  ① 가장 오른 전선과 가장 내린 전선을 등락률과 함께.
  ② **내 손익을 실제로 가장 많이 움직인 전선**. 어느 전선인지는 고르지 마라 —
     내손익을_가장_크게_움직인전선 이 답이다. 그 이름·내비중퍼센트·기여_퍼센트포인트를
     그대로 옮긴다. 기여는 규칙이 이미 «등락률 × 내 비중»으로 계산해 둔 값이다. 네가 곱하지 마라.
  ③ 등락1위와_기여1위가_갈렸나 가 true 면 "가장 크게 움직인 전선과 내 돈을 가장 크게
     움직인 전선이 달랐다"를, false 면 "같았다"를 사실로 적는다. 판정을 새로 하지 마라.
  ④ 내 편성 기준 전체 등락을 마지막에 한 번.
  ★ 표에 이미 있는 등락률만 되풀이하지 마라. 사용자는 그 표를 보면서 이 글을 읽는다.
    ②와 ③이 이 브리핑이 표에 더하는 전부다 — 빠뜨리면 쓸모가 없다.
- questions: 사용자가 주말에 스스로 던져볼 질문 3개. 각 40자 이내.
  ★ 최소 한 개는 «등락률과 손익 기여가 갈린 이유»를 스스로 짚게 하는 질문으로 한다.
  답을 주지 말고 질문만 한다. 질문도 특정 종목·전선을 사라/팔라는 방향으로 유도하지 않는다.
- 한국어 존댓말. 반드시 JSON만 출력한다.`;

const WEEKDAY_SYSTEM_PROMPT = `너는 병사의 모의 포트폴리오 평일 지형 요약을 쓰는 도구다.
데이터는 교육용 합성 시세이며 실제 시장과 무관하다 — 실제 시장을 언급하지 마라.

규칙 (어기면 출력이 폐기된다):
- 주어진 숫자만 쓴다. 숫자를 새로 만들거나 반올림 외의 가공을 하지 않는다.
- 전망·예측·추천·목표가·매수/매도 판단을 절대 하지 않는다.
  "오를", "하락할", "유망", "매수", "전망", "추천", "고려" 같은 말을 쓰지 마라.
- "공격적", "보수적" 같은 성향 라벨을 붙이지 않는다.
- "~하세요", "~해야", "권장" 같은 권유형 문장을 쓰지 않는다.
- 내 손익·가중 등락·이번 주 수익률을 말하지 않는다. 전선이 얼마나 움직였는지만 과거형으로 적는다.
- summary: 무엇이 얼마나 움직였는지 사실 문장 2개. 90자 이내.
- questions: 스스로 던져볼 질문 1개. 40자 이내. 답을 주지 않는다.
  ★ 하나여도 «배열»이다: {"questions": ["..."]}. 문자열로 주면 폐기된다.
- 한국어 존댓말. 반드시 JSON만 출력한다.
- 출력 예: {"summary":"...","questions":["..."]}`;

/** 브리핑 생성. 실패·검증 위반 시 null → 호출부가 규칙 기반 요약으로 폴백한다. */
export async function generateBriefing(week: MarketWeek): Promise<Briefing | null> {
  if (!hasLlmKey()) return null;
  try {
    const input = briefingInput(week);
    const raw = await completeJson({
      system: SYSTEM_PROMPT,
      user: JSON.stringify(input),
      // 요약이 180자로 늘었다. 잘리면 JSON.parse 가 깨져 폴백으로 떨어지므로 여유를 둔다.
      maxTokens: 700,
      temperature: 0.3,
    });
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { summary?: unknown; questions?: unknown };
    if (typeof parsed.summary !== 'string') return null;
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) return null;
    // ★ 원소가 «문자열인지»까지 본다. [{q:"…"}] 같은 걸 그냥 통과시키면 아래 join 이
    //   "[object Object]" 가 되는데, 거기엔 숫자도 조언 어휘도 없어 두 가드를 다 통과한다.
    //   그러면 폴백이 아니라 <li>{q}</li> 에서 React 가 터진다 — 카드가 통째로 죽는다.
    if (!parsed.questions.every((q): q is string => typeof q === 'string')) return null;
    // 길이 3 과 원소 타입을 위에서 확인했으므로 여기서만 튜플로 좁힌다.
    const briefing: Briefing = {
      summary: parsed.summary,
      questions: parsed.questions as [string, string, string],
    };

    // 출력 검증 — summary와 질문 3개를 한 덩어리로 본다. 하나라도 걸리면 전부 폐기한다.
    const text = [briefing.summary, ...briefing.questions].join(' ');
    if (!verifyFactualOutput(text).ok) return null;
    // 숫자 검증 — 입력에 없던 수치를 지어냈으면 폐기한다
    if (!verifyNumbersFrom(text, input).ok) return null;
    return briefing;
  } catch {
    // 에러 상세를 사용자에게 흘리지 않는다 (스택트레이스 금지)
    return null;
  }
}

/** 규칙 기반 폴백 요약 — 키가 없어도, 429여도, 킬스위치가 내려가도 이 문장은 뜬다.
 *  생성형 AI가 아니므로 UI에서 고지 배지를 붙이지 않고 "규칙 기반"으로 구분 표기한다 (C9). */
export function briefingFallback(week: MarketWeek): Briefing {
  const s = (x: number) => `${x >= 0 ? '+' : '−'}${r1(Math.abs(x))}%`;
  const pp = (x: number) => `${x >= 0 ? '+' : '−'}${r1(Math.abs(x))}%p`;
  // ★ LLM 경로와 «같은 사실»을 말한다. 폴백이 더 얕으면 키가 없는 날의 심사자는
  //   이 서비스가 표를 되풀이하기만 한다고 보게 된다. 재료는 규칙이 이미 갖고 있다.
  const mover = biggestMover(week);
  const 갈렸다 = week.best.name !== mover.name;
  return {
    summary:
      `${week.fromDate}부터 ${week.toDate}까지 영업일 ${week.tradingDays}일 구간입니다. ` +
      `가장 많이 오른 전선은 ${week.best.name} ${s(week.best.changePct)}, ` +
      `가장 많이 내린 전선은 ${week.worst.name} ${s(week.worst.changePct)}였습니다. ` +
      `내 손익을 가장 많이 움직인 전선은 ${mover.name}입니다. ` +
      `비중 ${mover.myWeight}%에 ${s(mover.changePct)}가 겹쳐 ${pp(mover.contributionPct)}였습니다. ` +
      (갈렸다
        ? '가장 크게 움직인 전선과 내 돈을 가장 크게 움직인 전선이 달랐습니다. '
        : '가장 크게 움직인 전선이 내 돈도 가장 크게 움직였습니다. ') +
      `내 비중으로 가중하면 ${s(week.weightedPct)}입니다.`,
    questions: [
      '내 손익을 가장 많이 움직인 전선의 비중은 얼마였나요?',
      '등락이 가장 컸던 전선과 손익 기여가 가장 컸던 전선은 왜 갈렸나요?',
      '이번 주에 아무것도 바꾸지 않는다면 그 이유는 무엇인가요?',
    ],
  };
}

export async function generateWeekdayBriefing(week: MarketWeek): Promise<WeekdayBriefing | null> {
  if (!hasLlmKey()) return null;
  try {
    const input = weekdayBriefingInput(week);
    const raw = await completeJson({
      system: WEEKDAY_SYSTEM_PROMPT,
      user: JSON.stringify(input),
      maxTokens: 280,
      temperature: 0.3,
    });
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { summary?: unknown; questions?: unknown };
    if (typeof parsed.summary !== 'string') return null;
    // ★ 「질문 1개」를 모델이 배열이 아니라 문자열로 돌려주는 일이 잦다 (실측 5/5).
    //   그건 «사실이 틀린 것»이 아니라 그릇 모양이 다른 것이라 폐기할 이유가 없다.
    //   가드는 내용을 보는 자리고, 여기는 모양을 맞추는 자리다 — 섞지 않는다.
    const questions =
      typeof parsed.questions === 'string' ? [parsed.questions] : parsed.questions;
    if (!Array.isArray(questions) || questions.length !== 1) return null;
    if (typeof questions[0] !== 'string') return null;
    const normalized: WeekdayBriefing = { summary: parsed.summary, questions: [questions[0]] };
    const text = [normalized.summary, ...normalized.questions].join(' ');
    if (!verifyFactualOutput(text).ok) return null;
    // 입력에 비중이 없으므로 손익은 애초에 계산될 수 없다. 남는 위험은 «지어낸 수치»뿐이고
    // 그건 allowed 목록이 잡는다. 가중 등락을 forbidden 으로 또 막으면, 그 값이 어느 전선
    // 등락과 우연히 같아지는 날(실측 9.4%)에 멀쩡한 문장까지 함께 폐기된다.
    if (!verifyNumbersFrom(text, input).ok) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function weekdayBriefingFallback(week: MarketWeek): WeekdayBriefing {
  const s = (x: number) => `${x >= 0 ? '+' : '−'}${r1(Math.abs(x))}%`;
  return {
    summary:
      `${week.fromDate}부터 ${week.toDate}까지 영업일 ${week.tradingDays}일 구간입니다. ` +
      `가장 많이 오른 전선은 ${week.best.name} ${s(week.best.changePct)}, ` +
      `가장 많이 내린 전선은 ${week.worst.name} ${s(week.worst.changePct)}였습니다.`,
    questions: ['가장 많이 움직인 전선에 내 포인트는 얼마나 있었나요?'],
  };
}
