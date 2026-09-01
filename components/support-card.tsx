// AI-6 상담 연결 카드 — 서버 컴포넌트. 상태를 만들지 않으므로 클라이언트로 내리지 않는다.
// ★ 이 카드는 항상 보인다. 패턴이 감지됐을 때만 나타나면 카드가 뜨는 것 자체가 낙인이 된다.
//   감지되면 문구가 바뀔 뿐, 어떤 기능도 잠기지 않는다.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupportSignal } from '@/lib/support';
import { SUPPORT_CHANNELS } from '@/lib/support';

export function SupportCard({ signal }: { signal: SupportSignal }) {
  const elevated = signal.level === 'ELEVATED';
  return (
    <Card className={elevated ? 'border-sky-500/40' : undefined}>
      <CardHeader>
        <CardTitle className="text-base">
          도움받을 수 있는 곳{' '}
          <span className="text-[11px] font-normal text-muted-foreground">(규칙 기반 안내 · AI 아님)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {elevated ? (
          <div className="flex flex-col gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2">
            <p className="text-xs leading-relaxed text-sky-200">
              최근 면제 인정 요청에서 아래 패턴이 관찰됐습니다. 잘못된 것이 아니고, 아무것도
              제한되지 않습니다. 다만 혼자 감당하고 계신 일이 있다면 아래가 도움이 될 수 있어
              함께 둡니다.
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-xs leading-relaxed text-muted-foreground">
              {signal.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            아래 채널은 언제나 열려 있습니다. 이 서비스는 모의 훈련이지만, 실제로 돈 문제가
            생겼을 때 갈 곳을 알고 있는 것도 훈련의 일부입니다.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {SUPPORT_CHANNELS.map((c) => (
            <li key={c.contact} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <b className="text-sm">{c.name}</b>
                <span className="block text-xs text-muted-foreground">{c.note}</span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{c.contact}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-muted-foreground">
          이 안내는 기록을 차단하거나 계정을 제한하지 않습니다. 면제 인정도 그대로 유지됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
