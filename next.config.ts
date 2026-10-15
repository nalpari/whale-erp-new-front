import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // 점포 대표 이미지(5MB)를 서버 액션으로 받는다. 기본 한도(1MB)로는 모자라, 5MB 에 multipart 경계 · 머리말 여유 1MB 를 더해 6MB 로 둔다.
      // 이 한도는 모든 서버 액션에 걸린다. TODO(로그인): 지금 서버 액션은 로그인 없이 부를 수 있으니, 로그인이 생기면 세션 확인을 함께 건다.
      bodySizeLimit: "6mb",
    },
    // proxy(src/proxy.ts)가 요청 본문을 버퍼에 담는 한도(기본 10MB). 넘으면 본문이 잘린 채 넘어간다. 종이 계약 날인본(근로계약서 · 임금계약서 각 10MB)을
    // 라우트 핸들러(/contracts/paper)로 한 번에 받으므로 20MB 에 multipart 여유 1MB 를 더한다. 서버 액션 한도(위 6MB)와는 따로다.
    proxyClientMaxBodySize: "21mb",
  },
  // 사내 와이파이(172.30.1.x)에서 개발 서버를 열어 볼 수 있게 한다. 없으면 HMR 연결이 막혀 화면이 클릭되지 않는다.
  allowedDevOrigins: ["172.30.1.*"],
};

export default nextConfig;
