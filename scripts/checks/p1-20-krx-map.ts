// P1-20: 6전선 내부코드 ↔ 한국 상장코드 맵. 화면 이름에 운용사 브랜드가 없어야 한다 (C10).
// ★ 네트워크 호출 없음. 정적 검증이므로 오프라인에서도 돈다.
import { KRX_MAP } from '../../db/seed/krx-map';
import { validateKrxMap } from '../../lib/krx/validate';

const problems = validateKrxMap();
for (const p of problems) console.log(p);
if (problems.length > 0) process.exit(1);
console.log(
  `맵 ${KRX_MAP.length}전선 내부코드↔상장코드·일반명 검증 통과 (${KRX_MAP.map((r) => r.screenName).join(' · ')})`,
);
