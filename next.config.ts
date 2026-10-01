import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // 사내 와이파이(172.30.1.x)에서 개발 서버를 열어 볼 수 있게 한다. 없으면 HMR 연결이 막혀 화면이 클릭되지 않는다.
  allowedDevOrigins: ["172.30.1.*"],
};

export default nextConfig;
