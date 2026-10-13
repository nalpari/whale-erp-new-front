import type { ReactNode } from "react";

// 플랫폼 관리자 패널들이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다.

/**
 * 공통코드 ROLE_TYPE 의 PM · PA 표시 이름(용어집 표준 표기). 네이밍 규칙은 front 에 상수 대응표를 두지 않고
 * getCodes(group) 로 받게 하지만, 그 조회가 아직 없어 임시로 둔다. TODO(getCodes): 조회한 label 로 바꾸고 지운다.
 */
export const ROLE_TYPE_LABEL = { PM: "플랫폼 마스터", PA: "플랫폼 관리자" } as const;

/**
 * server action 호출 자체가 거절됐을 때(응답을 못 받음). 요청이 서버에 닿지 않았다는 뜻은 아니다 — 받는 도중 끊겼거나
 * 배포가 어긋났을 수 있어, 이미 처리됐을 수도 있다고 말한다(다시 누르면 중복 등록 409 · 메일 두 번이 날 수 있다).
 */
export const unknownResult = (what: string) => (error: unknown) => {
  console.error(`플랫폼 관리자 ${what} 호출 실패`, error);
  return {
    ok: false as const,
    status: undefined,
    message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.`,
  };
};

/** 실패 띠 — 패널 맨 위에 하나만 선다. 저장 실패면 입력값을 그대로 두었다는 것을 함께 말한다. */
export function FailedBand({ message, detail }: { message: string; detail?: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      <p className="font-medium">{message}</p>
      {detail && <p className="text-erp-ink">{detail}</p>}
    </div>
  );
}

/**
 * 칸 오류 문구 — 그 입력칸 바로 아래 한 줄. 입력칸은 aria-invalid 로 빨간 테두리가 되고 aria-describedby 로 이 문구를 가리킨다.
 * 문구가 없으면 아무것도 그리지 않는다(자리도 차지하지 않는다).
 */
export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}

/** 확인창 안에서 누구를 대상으로 하는지 — 짧은 항목 · 값 두 칸. */
export function WhoList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[60px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-erp-label">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 사용자 권한 꼬리표 앞 방패 — 데모 상세와 같은 선(public/icons 에 없다). */
export function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mr-[4px] inline-block size-[12px] align-[-1px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z" />
      <path d="m8.9 12.1 2.1 2.1 4.1-4.2" />
    </svg>
  );
}

/** 막힌 버튼의 이유 안내. 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 감싸는 칸에 단다. */
export function Blocked({ reason, children }: { reason?: string; children: ReactNode }) {
  return (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  );
}
