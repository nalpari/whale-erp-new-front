import { redirect } from "next/navigation";

// 이 포털의 첫 화면은 품목 목록이다. 목록이 세션을 확인하고 필요하면 로그인으로 보낸다.
export default function Home() {
  redirect("/items");
}
