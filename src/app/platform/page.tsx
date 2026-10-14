import { PageBar } from "@/components/common";

// 플랫폼 홈. 목업이 없어 지금은 빈 틀이다 — 로그인 후 이동·로고·서비스 바로가기는 모두 /platform 을 가리킨다.
// 다른 화면으로 redirect 하지 않는다. 홈은 메뉴 권한 확인에서 늘 열리는 곳이라, 권한 없는 메뉴로 보내면 「이전 화면으로」가 되돌아오며 맴돈다.
export default function PlatformHome() {
  return (
    <>
      <PageBar title="홈" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex-1 rounded-[4px] border border-erp-panel-line bg-white p-[25px]" />
      </div>
    </>
  );
}
