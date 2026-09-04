'use client';
// 비중 조정 마감 카운트다운 (일요일 21:00 KST)
// ★ 마감 압박만 주지 않는다 — "미조정 시 기존 비중 유지"를 같은 화면·같은 크기로 함께 표시 (SPEC §3-5)
import { useEffect, useState } from 'react';

function remainText(deadlineMs: number, nowMs: number): string {
  const diff = deadlineMs - nowMs;
  if (diff <= 0) return '이번 주 마감됨';
  const totalMin = Math.floor(diff / 60_000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `마감까지 ${d}일 ${h}시간`;
  if (h > 0) return `마감까지 ${h}시간 ${m}분`;
  return `마감까지 ${m}분`;
}

export function DeadlineCountdown({ deadlineIso }: { deadlineIso: string }) {
  const deadlineMs = new Date(deadlineIso).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
      <p className="text-sm font-medium">
        {remainText(deadlineMs, now)} <span className="text-muted-foreground">(일요일 21:00 KST)</span>
      </p>
      <p className="text-sm font-medium text-up">
        조정하지 않으면 기존 편성이 그대로 유지됩니다.
      </p>
    </div>
  );
}
