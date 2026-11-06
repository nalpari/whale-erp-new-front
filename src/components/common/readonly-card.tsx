import type { ReactNode } from "react";
import { HelpTip } from "./help-tip";

// 고칠 수 없는 값 묶음 — 마이페이지 「계정 정보」에서 시작해 권한 그룹 상세(가맹마스터 계정 · 등록 · 최종수정)가 두 번째로 쓴다(2026-10-26, DESIGN.md
// Inputs 「고칠 수 없는 값」). 제목은 DetailTable 제목 줄과 같은 회색 바(42px) · 15px 600(FormGroup 제목과 같다, 2026-10-27 DetailTable 도 맞춤)이다.
// 안쪽 배치(FormRow · 구분선)는 부르는 쪽이 정한다. title 을 주지 않으면 제목 바 · 테두리 없이 값만 늘어놓는다 — 권한 그룹 상세
// (2026-10-26 사용자 지정: 제목 → 테두리 순으로 뺐다). 그때는 안쪽 여백도 없어 라벨이 위 입력칸 라벨과 같은 세로줄에 선다.
export function ReadonlyCard({ title, children }: { title?: ReactNode; children: ReactNode }) {
  if (title === undefined) return <div className="flex w-full flex-col gap-[18px]">{children}</div>;
  return (
    <div className="w-full">
      <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">{title}</h3>
      <div className="flex flex-col gap-[18px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[20px]">{children}</div>
    </div>
  );
}

// 입력칸 테두리 없이 라벨 위 · 값 아래로만 보이는 값 한 칸. 글자 크기 · 색은 DetailTable 의 라벨 · 값 토큰을 그대로 쓴다.
// bold 는 눈에 먼저 띄어야 하는 값에만 켠다. help 를 주면 라벨 옆에 도움말 아이콘(HelpTip)을 둔다 — 말줄임 글자 밖에 둬야 뜨는 상자가 잘리지 않는다.
// title 을 주면 값에 마우스를 올려 말줄임된 전체를 볼 수 있다.
export function ReadonlyValue({ label, value, bold, help, title }: { label: string; value: ReactNode; bold?: boolean; help?: string; title?: string }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[4px]">
      <span className="flex min-w-0 items-center gap-[4px]">
        <span className="truncate text-[14px] font-medium text-erp-label">{label}</span>
        {help && <HelpTip text={help} label={`${label} 도움말`} />}
      </span>
      <span title={title} className={`truncate text-[14px] text-erp-ink ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
