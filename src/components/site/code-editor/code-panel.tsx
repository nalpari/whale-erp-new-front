import type { ReactNode } from "react";

// 공통코드 화면(플랫폼 공통코드 관리 · BP 공통코드 관리)의 두 카드(그룹 목록 · 상세 코드) 껍데기. 제목 줄 오른쪽에 버튼, 아래에 표를 둔다.
// 카드 안에서만 세로로 스크롤해 body 는 스크롤하지 않는다(DESIGN.md 한 화면 규칙).
export function CodePanel({
  title,
  sub,
  actions,
  wide,
  narrow,
  children,
}: {
  title: string;
  /** 제목 옆 회색 글자(건수 · 고른 그룹). */
  sub?: ReactNode;
  actions?: ReactNode;
  /** 왼쪽 그룹 목록은 750 고정(관리 주체 선택칸이 잘리지 않도록 2026-10-12 900 으로 넓혔다가, 상세 코드 칸의 코드명이 안 보여 그룹명 칸을 반으로 줄임 — 2026-10-26 사용자 지정), 오른쪽 상세 코드는 남는 폭. */
  wide?: boolean;
  /** 읽기만 하는 그룹 목록(BP 공통코드 — 입력칸이 없다)은 560 고정(데모 config/codes). */
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      // 표(DataTable scroll)는 남는 높이를 먹고 그 안에서만 스크롤한다 — 나머지(제목 · 띠 · 쪽 넘김)는 줄지 않는다(2026-10-26 사용자 지정)
      className={`flex flex-col gap-[12px] overflow-y-auto [scrollbar-gutter:stable] rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>:not([data-table-scroll])]:shrink-0 ${
        wide ? "min-w-0 flex-1" : narrow ? "w-[560px] shrink-0" : "w-[750px] shrink-0"
      }`}
    >
      {/* 제목 줄은 34px(버튼 높이) — 버튼이 없는 왼쪽 그룹 목록도 오른쪽 상세 코드와 같은 높이에 선다(2026-10-26 사용자 지정) */}
      <div className="flex min-h-[34px] items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
          {title}
          {sub && <span className="ml-[10px] text-[14px] font-normal text-erp-label">{sub}</span>}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

/**
 * 상세 코드 제목 옆 고른 그룹 — 「그룹코드 값 | 그룹명 값 | 관리주체 띠지」. 라벨은 회색, 값은 굵게, 관리주체는 라벨 없이 띠지만.
 * 권한별 메뉴설정 팝업 머리(role-menu-dialog)와 같은 모양이고 구분선도 상세 표 값 구분선(11px #d9d9d9)과 같다(2026-10-27 사용자 지정).
 * 플랫폼 · BP 공통코드 관리가 같이 쓴다.
 */
export function GroupHead({ groupCode, groupName, owner }: { groupCode: string; groupName: string; owner?: ReactNode }) {
  // 제목(「상세 코드」)과 같은 글자 기준선에 선다 — 가운데 맞춤이면 18px 제목 옆에서 위아래로 어긋나 보였다(2026-10-27 사용자 지정). 구분선만 가운데
  const bar = <span aria-hidden="true" className="h-[11px] w-px shrink-0 self-center bg-[#d9d9d9]" />;
  return (
    <span className="inline-flex items-baseline gap-[10px] align-baseline">
      <span className="inline-flex items-baseline gap-[6px]">
        <span className="text-erp-label">그룹코드</span>
        <b className="font-semibold text-erp-ink">{groupCode}</b>
      </span>
      {bar}
      <span className="inline-flex items-baseline gap-[6px]">
        <span className="text-erp-label">그룹명</span>
        <b className="font-semibold text-erp-ink">{groupName}</b>
      </span>
      {owner && (
        <>
          {bar}
          {owner}
        </>
      )}
    </span>
  );
}

/** 저장 · BP 적용 요청 자체가 닿지 않았을 때(연결 끊김 · 재배포로 action 을 못 찾음) 띠에 쓰는 문구. */
export const UNREACHABLE = "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
/** 저장 요청이 응답 없이 끊겼다 — 서버에서는 저장됐을 수 있어 목록을 다시 받고, 확인한 뒤 다시 저장하게 한다(다시 저장하면 등록이 409 일 수 있다). */
export const UNKNOWN_RESULT = "저장 결과를 확인하지 못했습니다. 목록을 다시 불러왔으니 저장됐는지 확인한 뒤 다시 저장해 주세요.";

// 실패 띠 — 표 위에 하나만 선다. 저장 실패면 입력값은 그대로 두었다는 것을 함께 말한다(목업 fail 상태).
export function SaveFailedBand({ message, detail = "입력한 값은 그대로 두었습니다." }: { message: string; detail?: string | null }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      <p className="font-medium">{message}</p>
      {detail && <p className="text-erp-ink">{detail}</p>}
    </div>
  );
}

// 칸 오류 문구 — 표 바로 아래, 입력 행 밑에 한 줄씩. 해당 칸은 aria-invalid 로 빨간 테두리가 된다.
// 같은 문구(새 행 둘이 같은 코드로 겹침 등)는 한 번만 보인다.
export function FieldErrors({ messages }: { messages: string[] }) {
  const unique = [...new Set(messages)];
  if (unique.length === 0) return null;
  return (
    <ul role="alert" className="flex flex-col gap-[6px] text-[13px] text-erp-off">
      {unique.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}

// 처리 결과 안내 — 표 위에 한 줄. 상태 색 없이 표 머리 바탕 · 선만 쓴다.
export function DoneNotice({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] text-erp-ink">
      {message}
    </p>
  );
}
