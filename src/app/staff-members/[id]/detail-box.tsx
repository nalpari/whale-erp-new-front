import Link from "next/link";
import type { ReactNode } from "react";

// 데모 staff-parts.mjs 의 box — 제목 줄(오른쪽에 「관리」 링크) + 내용.
// manageHref 가 없으면 「관리」를 흐리게 두고 누를 수 없게 한다 — 그 화면이 아직 없다. manage 를 주면 그것을 대신 그린다(권한으로 가르는 링크).
export function Box({
  title,
  manageHref,
  manage,
  children,
}: {
  title: string;
  manageHref?: string;
  manage?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="flex-1">{title}</span>
        <span className="flex items-center gap-[6px] text-[14px] font-normal">
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
