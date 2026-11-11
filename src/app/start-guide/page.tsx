import { PageBar } from "@/components/common";
import { StartGuideScreen } from "./start-guide-screen";

// 시작 가이드(2026-11-11 사용자 지정). 헤더 [시작 가이드] 목록에서 단계를 누르면 이 화면의 그 단계로 온다.
// 왼쪽은 헤더 목록과 같은 단계 목록, 오른쪽은 고른 단계의 설명(이럴 때 필요해요 · 먼저 확인해 주세요 · 따라 할 순서 · 화면 예시 · [화면으로 가기]).
// 고른 갈래 · 단계는 주소(?track= · ?step=)에 둔다. 단계 갈래와 설명은 src/lib/start-guide.ts.
export default function StartGuidePage() {
  return (
    <>
      <PageBar title="시작 가이드" />
      <StartGuideScreen />
    </>
  );
}
