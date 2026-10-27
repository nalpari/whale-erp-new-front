import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { HeadValues } from "@/components/site/head-values";

// 공통코드 화면(플랫폼 공통코드 관리 · BP 공통코드 관리)의 두 카드(그룹 목록 · 상세 코드) 껍데기. 제목 줄 오른쪽에 버튼, 아래에 표를 둔다.
// 카드 안에서만 세로로 스크롤해 body 는 스크롤하지 않는다(DESIGN.md 한 화면 규칙).
export function CodePanel({
  id,
  title,
  sub,
  actions,
  wide,
  narrow,
  children,
}: {
  /** 저장을 막은 첫 칸을 찾을 범위(focusFirstInvalid). */
  id?: string;
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
      id={id}
      // 표(DataTable scroll)는 남는 높이를 먹고 그 안에서만 스크롤한다 — 나머지(제목 · 띠 · 오류 줄)는 줄지 않는다(2026-10-26 사용자 지정)
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
  return (
    <HeadValues
      items={[{ label: "그룹코드", value: groupCode }, { label: "그룹명", value: groupName }, ...(owner ? [{ value: owner }] : [])]}
    />
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

/**
 * 칸 오류 문구 — 그 입력칸 바로 아래에 둔다. 칸은 aria-invalid 로 빨간 테두리가 되고, 문구가 있는 줄만 높아진다.
 * 전엔 표 아래에 모아 보여 어느 칸 오류인지 알기 어려웠다(2026-10-27 사용자 지정).
 * 문구는 늘 한 줄이다 — 줄을 바꾸면 같은 줄의 칸끼리 높이가 달라 입력칸이 들쑥날쑥했다(사용자가 찾음). 넘치면 말줄임하고 마우스를 올리면 전체를 보인다.
 * 같은 줄의 다른 칸에만 오류가 있으면 reserve 로 문구 한 줄만큼 빈 자리를 둬 입력칸 높이를 맞춘다.
 */
export function CellError({ message, reserve, children }: { message?: string; reserve?: boolean; children: ReactNode }) {
  const id = useId();
  if (!message && !reserve) return children;
  // 화면 낭독기가 칸에 닿을 때 이유도 읽게 문구를 칸의 설명(aria-describedby)으로 잇는다 — 전엔 표 아래 role=alert 목록이 읽어 줬다(리뷰로 찾음)
  const field = message && isValidElement<{ "aria-describedby"?: string }>(children) ? cloneElement(children, { "aria-describedby": id }) : children;
  return (
    <span className="flex flex-col gap-[4px] py-[6px]">
      {field}
      <span id={message ? id : undefined} title={message} aria-hidden={message ? undefined : true} className="truncate text-left text-[12px] leading-[1.4] text-erp-off">
        {message ?? " "}
      </span>
    </span>
  );
}

/**
 * 고친 칸(fields)의 오류만 새 검사 결과(found)로 바꾼다 — 맞으면 지우고, 아직 틀리면 새 문구로. 넘기지 않은 칸의 오류는 그대로 둔다.
 * 넘긴 칸의 서버 오류(409)는 화면 검사가 다시 알 수 없어 지워진다 — 다시 저장해야 확인된다.
 * 칠 때마다 새 오류를 띄우지 않도록, 이미 오류가 있던 칸만 부르는 쪽이 넘긴다.
 */
export function recheck(errors: Record<string, string>, found: Record<string, string>, fields: string[]): Record<string, string> {
  const next = { ...errors };
  for (const f of fields) {
    if (found[f]) next[f] = found[f];
    else delete next[f];
  }
  return next;
}

/** 저장을 막은 첫 칸으로 포커스를 옮긴다 — 오류가 그려진 다음 프레임에 패널(id) 안 첫 aria-invalid 칸. 표 안에서 그 칸이 보이게 스크롤된다. */
export function focusFirstInvalid(panelId: string) {
  requestAnimationFrame(() => document.getElementById(panelId)?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
}

// 칸에 붙지 못한 오류(어느 새 행인지 모르는 서버 409 등)만 표 아래에 한 줄씩 둔다. 같은 문구는 한 번만 보인다.
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

/** 표시 순서를 옮긴 뒤 안내 — 플랫폼 · BP 상세 코드가 같이 쓴다(2026-10-27 사용자 지정 — 전엔 「표시 순서를 바꿨습니다 — 저장을 눌러야 반영됩니다.」) */
export const REORDERED = "표시 순서가 변경되었습니다. 저장 시 반영됩니다.";

/**
 * 아직 저장하지 않은 변경 안내 — 표 위에 한 줄. 놓치면 안 되는 안내라 플랫폼 메뉴 관리의 「미사용으로 변경하면 …」 안내와 같은
 * 빨간 테두리 · 연한 빨간 바탕으로 둔다(2026-10-27 사용자 지정 — 전엔 처리 결과 안내와 같은 회색, DESIGN.md 색은 상태다 예외). 표시 순서를 옮긴 뒤 보인다.
 */
export function PendingNotice({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off">
      {message}
    </p>
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
