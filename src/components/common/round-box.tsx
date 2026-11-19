import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// 「확인할 것」 상자 — 상세 화면 오른쪽에서 사장님이 살펴볼 정보(검토 사유 · 산정 기준 · 발송 · 이력)를 담는다. 입력 칸 · 본문 정보의 회색 제목 줄
// 상자(DetailTable · 폼 묶음)와 모양으로 가르려고 둥근 모서리 8px · 진한 테두리(#c9d1de — 플랫폼 메뉴 트리의 묶음 선과 같은 값, 패널 선 #edeef1 은 너무
// 흐렸다)다. 맨 위 제목 줄(15px 600, 오른쪽 끝에 건수 · 버튼), 아래 줄마다 옅은 선(erp-divider)으로 나눈다(급여명세서 상세 · 근로계약 상세, 2026-11-19 사용자 지정).
export function RoundBox({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-[8px] border border-[#c9d1de] bg-white px-[20px] py-[16px]">
      {/* 제목 줄 아래 선은 상자 테두리와 같은 진한 색(#c9d1de), 그 아래 줄 사이는 옅은 선(erp-divider) — 둘이 같은 색이면 제목과 항목이 갈리지 않았다
          (2026-11-19 사용자 지정). 그래서 내용의 첫 줄은 위 선을 두지 않는다 */}
      <div className="flex min-h-[34px] items-center gap-[8px] border-b border-[#c9d1de] pb-[12px]">
        <h3 className="flex min-w-0 flex-1 items-center gap-[8px] text-[15px] font-semibold text-erp-ink">{title}</h3>
        {action}
      </div>
      <div className="[&>dl>div:first-child]:border-t-0 [&>p:first-child]:border-t-0 [&>ul>li:first-child]:border-t-0">{children}</div>
    </section>
  );
}

/** RoundBox 안의 「이름 | 값」 줄들 — 이름 90px 회색 500, 값은 남는 폭. 여러 줄 값은 이름을 위에 맞춘다 */
export function RoundRows({ rows }: { rows: { label: string; value: ReactNode; top?: boolean }[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div key={row.label} className={`flex gap-[12px] border-t border-erp-divider py-[12px] text-[14px] last:pb-0 ${row.top ? "items-start" : "items-center"}`}>
          <dt className="w-[90px] shrink-0 font-medium text-erp-label">{row.label}</dt>
          <dd className="min-w-0 flex-1 text-erp-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** RoundBox 안의 목록이 비었을 때 한 줄 */
export function RoundEmpty({ children }: { children: ReactNode }) {
  return <p className="border-t border-erp-divider pt-[12px] text-[14px] text-erp-muted">{children}</p>;
}

/**
 * RoundBox 안의 이동 링크 — 파란 링크 대신 회청(erp-brand) 500 글자 + 작은 꺾쇠 + 밑줄, 누르는 동안 색 반전. 파란 글자는 버튼처럼 보이지 않고 눈에만 튀었다
 * (2026-11-19 사용자 지정, 홈 카드의 꺾쇠와 같은 계열). 파일 내려받기 링크(계약서 파일 이름)는 그대로 파랑이다.
 */
export function RoundLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    // 늘 밑줄(누를 수 있게 보이게), 누르는 동안은 색 반전 — 회청 바탕 · 흰 글자(2026-11-19 사용자 지정)
    <Link
      href={href}
      // 시안: 회청 점선 테두리 알약(26px · 13px 500) — 마우스를 올리면 옅은 바탕, 누르면 색 반전(2026-11-19 사용자 요청으로 보는 안)
      className={DASHED_PILL}
    >
      {children}
      <svg aria-hidden viewBox="0 0 12 12" className="size-[12px]">
        <path d="M4.5 3 7.5 6 4.5 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

// 점선 알약 — RoundLink 와 같은 모양(26px · 13px 500 · 회청 점선 테두리, 마우스를 올리면 옅은 바탕, 누르면 색 반전)
const DASHED_PILL =
  "inline-flex h-[26px] shrink-0 cursor-pointer items-center gap-[2px] rounded-full border border-dashed border-erp-brand px-[10px] text-[13px] font-medium whitespace-nowrap text-erp-brand transition-colors duration-150 hover:bg-erp-thead-bg active:border-solid active:bg-erp-brand active:text-white disabled:pointer-events-none disabled:opacity-40";

/**
 * 점선 알약 버튼 — 상세 표 줄 안 · 표 제목 줄의 작은 동작(직원 상세 생년월일 [수정] · 직원 앱 계정 [비밀번호 초기화]). 34px 색 바탕 버튼은 표 안에서
 * 무거웠다(2026-11-19 사용자 지정). 이동이 아니라 동작이라 꺾쇠는 두지 않는다
 */
export function RoundButton({ children, ...props }: Omit<ComponentProps<"button">, "className" | "style" | "type">) {
  return (
    <button type="button" {...props} className={DASHED_PILL}>
      {children}
    </button>
  );
}
