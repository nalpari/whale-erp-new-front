import type { ReactNode } from "react";
import { RetryButton } from "./retry-button";

// 데모 staff-parts.mjs 의 box — 제목 줄(오른쪽에 「관리」 링크) + 내용.
// 「관리」는 manage 로 받는다 — 링크는 그 메뉴 조회 권한을 보는 MenuManageLink(manage-link.tsx)다. 없으면 흐리게 두고 누를 수 없게 한다(그 화면으로 가는
// 링크가 아직 없다, WHALEERP-186). 권한을 보지 않는 링크를 걸 길은 두지 않는다(front #90 리뷰). 만들 화면이 없는 칸은 false 를 넘겨 자리를
// 비운다(발송 이력 — 따로 된 화면을 두지 않는다, WHALEERP-136) — false 는 nullish 가 아니라 아래 ?? 를 타지 않고 React 가 그리지 않는다.
// 흐린 「관리」는 생길 화면이 있다는 뜻이라서다.
// tools 는 「관리」 왼쪽에 서는 것(근무스케줄의 주 넘김, week-nav.tsx)이다.
export function Box({
  title,
  manage,
  tools,
  plainTitle = false,
  children,
}: {
  title: string;
  manage?: ReactNode;
  tools?: ReactNode;
  /** 회색 제목 줄 대신 표 위 글자 제목(15px 600) — 기간 이동으로 묶은 근무스케줄 · 출퇴근 현황(2026-11-23 사용자 지정). 표 위 선은 표가 긋는다 */
  plainTitle?: boolean;
  children: ReactNode;
}) {
  if (plainTitle)
    return (
      <section className="flex min-w-0 flex-col gap-[8px]">
        <h3 className="flex min-h-[26px] items-center gap-[6px] text-[15px] font-semibold text-erp-ink">
          <span className="flex-1">{title}</span>
          <span className="flex items-center gap-[6px] text-[14px] font-normal">
            {tools}
            {manage}
          </span>
        </h3>
        {/* 위 선은 안의 표 머리 · 안내 칸이 긋는다 — 여기서도 그으면 두 겹(2px)이었다 */}
        <div>{children}</div>
      </section>
    );
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">
        <span className="flex-1">{title}</span>
        <span className="flex items-center gap-[6px] text-[14px] font-normal">
          {tools}
          {manage ?? (
            <span aria-disabled="true" title="준비 중입니다." className="cursor-default text-erp-muted">
              관리
            </span>
          )}
        </span>
      </h3>
      {children}
    </section>
  );
}

/** 칸 하나를 채우는 안내 한 줄 — 표의 빈 상태처럼 92px 가운데. 준비 중 · 빈 상태 · 오류가 같은 자리를 쓴다. */
export function BoxMessage({ children, alert = false }: { children: ReactNode; alert?: boolean }) {
  return (
    <div
      role={alert ? "alert" : undefined}
      className="flex min-h-[92px] items-center justify-center gap-[12px] rounded-b-[2px] border border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-muted"
    >
      {children}
    </div>
  );
}

/** 영역을 못 받았을 때의 안내(WHALEERP-184). 권한이 없으면 다시 해도 같아 안내만, 나머지는 「다시 하기」 */
export function AreaFailure({ kind, subject }: { kind: "forbidden" | "error"; subject: string }) {
  return kind === "forbidden" ? (
    <BoxMessage>{subject} 볼 권한이 없습니다.</BoxMessage>
  ) : (
    <BoxMessage alert>
      {subject} 불러오지 못했습니다.
      <RetryButton />
    </BoxMessage>
  );
}
