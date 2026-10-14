import { PageBar } from "@/components/common";

// 로그인 후 홈(3팀 화면). 내용은 홈 화면 작업에서 채운다 — 지금은 레이아웃 확인용 틀.
export default function HomePage() {
  return (
    <>
      <PageBar title="홈" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex-1 rounded-[4px] border border-erp-panel-line bg-white p-[25px]" />
      </div>
    </>
  );
}
