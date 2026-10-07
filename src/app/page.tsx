import { redirect } from "next/navigation";

// 견본 품목 목록과 견본 로그인을 지운 뒤(2026-10-07) 1팀 관리자 로그인이 생기기 전까지는
// 공통 컴포넌트 디자인 견본을 첫 화면으로 둔다. 로그인이 생기면 그쪽으로 바꾼다.
export default function Home() {
  redirect("/design");
}
