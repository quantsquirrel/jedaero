import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ★ 서버 함수를 DB 옆에 둔다. Neon이 ap-southeast-1(싱가포르)인데 함수가 iad1(버지니아)이면
  //   화면 한 장을 그릴 때마다 쿼리가 태평양을 왕복한다 (실측 페이지당 0.6~1.2s).
  //   심사자도 한국에 있으므로 sin1이 양쪽 모두에 가깝다. 리전은 vercel.json이 정한다.
  // /principles/image 가 fs로 읽는 폰트를 서버 번들에 포함시킨다.
  // 빠지면 배포 환경에서만 ENOENT가 나고 로컬에서는 재현되지 않는다.
  outputFileTracingIncludes: {
    '/principles/image': ['./assets/fonts/*.ttf'],
  },
};

export default nextConfig;
