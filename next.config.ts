import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /principles/image 가 fs로 읽는 폰트를 서버 번들에 포함시킨다.
  // 빠지면 배포 환경에서만 ENOENT가 나고 로컬에서는 재현되지 않는다.
  outputFileTracingIncludes: {
    '/principles/image': ['./assets/fonts/*.ttf'],
  },
};

export default nextConfig;
