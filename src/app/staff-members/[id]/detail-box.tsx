import Link from "next/link";
import type { ReactNode } from "react";
import { RetryButton } from "./retry-button";

// 데모 staff-parts.mjs 의 box — 제목 줄(오른쪽에 「관리」 링크) + 내용.
// manageHref 가 없으면 「관리」를 흐리게 두고 누를 수 없게 한다 — 그 화면이 아직 없다. manage 를 주면 그것을 대신 그린다(권한으로 가르는 링크).
// tools 는 「관리」 왼쪽에 서는 것(근무스케줄의 주 넘김 — 데모 weekNav)이다.
export function Box({
  title,
  manageHref,
  manage,
  tools,
  children,
}: {
  title: string;
  manageHref?: string;
  manage?: ReactNode;
  tools?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="flex-1">{title}</span>
        <span className="flex items-center gap-[6px] text-[14px] font-normal">
          {tools}
          {manage ?? (manageHref ? (
            <Link href={manageHref} className="text-erp-link hover:underline">
              관리
            </Link>
          ) : (
            <span aria-disabled="true" title="준비 중입니다." className="cursor-default text-erp-muted">
              관리
            </span>
          ))}
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

/** 영역을 받는 동안. 같은 92px 자리를 쓴다 */
export function AreaLoading() {
  return <BoxMessage>불러오는 중입니다.</BoxMessage>;
}
