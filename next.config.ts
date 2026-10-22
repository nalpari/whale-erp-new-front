import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // 점포 대표 이미지(5MB)를 서버 액션으로 받는다. 기본 한도(1MB)로는 모자라, 5MB 에 multipart 경계 · 머리말 여유 1MB 를 더해 6MB 로 둔다.
      // 이 한도는 모든 서버 액션에 걸린다. 서버 액션은 공개 엔드포인트라 로그인 판정은 api 가 한다(세션 토큰이 없으면 401) — 외부 키를 쓰는 주소 액션만 따로 토큰을 확인한다.
      bodySizeLimit: "6mb",
    },
    // proxy(src/proxy.ts)가 요청 본문을 버퍼에 담는 한도(기본 10MB). 넘으면 본문이 잘린 채 넘어간다. 라우트 핸들러로 한 번에 받는 것 중 가장 큰
    // 공지사항 첨부(/platform-notices/save, 5개 × 10MB)에 multipart 여유 1MB 를 더한다 — 종이 계약 날인본(/contracts/paper, 2 × 10MB)도 이 안이다.
    // 서버 액션 한도(위 6MB)와는 따로다. 이 한도는 모든 경로에 걸리므로 proxy 가 content-length 로 경로마다 다시 막는다(lib/paper-request.ts 의 bodyLimitOf).
    proxyClientMaxBodySize: "51mb",
  },
  // 사내 와이파이(172.30.1.x)에서 개발 서버를 열어 볼 수 있게 한다. 없으면 HMR 연결이 막혀 화면이 클릭되지 않는다.
  allowedDevOrigins: ["172.30.1.*"],
};

export default nextConfig;
