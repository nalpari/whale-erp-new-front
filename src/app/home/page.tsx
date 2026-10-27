import { HomeScreen } from "./home-screen";

// 로그인 후 홈(3팀 화면). 업무 범위가 헤더(브라우저)에만 있어 화면이 클라이언트에서 부른다 — home-screen.tsx
export default function HomePage() {
  return <HomeScreen />;
}
