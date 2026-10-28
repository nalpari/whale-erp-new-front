import type { ReactNode } from "react";
import type { LoginIdCheck } from "@/lib/platform-admin-form";

// 플랫폼 관리자 패널들이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다.
// LoginIdAvailability 는 BP 관리자 · BP 마스터 등록도 가져다 쓴다(아이디 중복확인 문구를 한 곳에서, 2026-10-28 사용자 지정).

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

/** 확인 완료 체크 표시(테두리만 그린 원) — LoginIdAvailability · EmailFormatValid 가 같이 쓴다. */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5L8.5 13L14 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 화면 읽기 프로그램 알림 칸 — 문구가 없어도 늘 그려 둔다. 알림 영역(aria-live)이 문구와 함께 새로 생기면 첫 문구를
 * 읽지 않는 프로그램이 있다. sr-only(absolute)라 칸 사이 간격을 차지하지 않는다. 보이는 문구는 aria-hidden 으로 두어
 * 두 번 읽히지 않게 한다(입력칸의 aria-describedby 는 숨긴 요소도 읽는다). 오류는 FieldMessage(role=alert)가 알리므로 비운다.
 */
function LiveText({ text }: { text: string }) {
  return (
    <span className="sr-only" aria-live="polite">
      {text}
    </span>
  );
}

const LOGIN_ID_CHECK_TEXT: Record<Exclude<LoginIdCheck, "idle">, string> = {
  checking: "아이디를 확인하는 중입니다.",
  // 아이디 중복확인이 있는 네 화면(플랫폼 · BP 관리자 · BP 마스터 등록, 회원가입)이 같은 문구 — 회원가입의 「사용가능합니다.」로 맞췄다(2026-10-28 사용자 지정)
  available: "사용가능합니다.",
  // 확인 요청 자체가 실패(429 · 5xx · 연결)했을 때(401 · 403 은 패널 위 띠). 저장은 막지 않는다 — 저장할 때 api 가 중복을 다시 막는다.
  failed: "아이디를 확인하지 못했습니다. 저장 시 다시 확인합니다.",
};

/**
 * 아이디 중복확인 표시 — 확인 중 · 확인 실패(회색, erp-label) · 사용 가능(체크 표시 + 파란 문구 —
 * signup-form.tsx 의 성공 표시와 같은 색, ERP 토큰 erp-on) · 오류(FieldMessage 그대로).
 * 대기 · 성공 · 실패는 막는 오류가 아니므로 role=alert 대신 알림 칸(aria-live="polite")으로만 알린다.
 * 오류 문구(message)가 있으면 상태 문구는 그리지 않는다 — 패널은 칸 오류를 붙일 때 상태를 "idle" 로 내리지만, 여기서도 오류를 앞세운다.
 */
export function LoginIdAvailability({ id, check, message }: { id: string; check: LoginIdCheck; message?: string }) {
  const text = message || check === "idle" ? "" : LOGIN_ID_CHECK_TEXT[check];
  return (
    <>
      <FieldMessage id={id} message={message} />
      {text && (
        <p id={id} aria-hidden="true" className={`flex items-center gap-[4px] text-[13px] leading-[1.5] ${check === "available" ? "text-erp-on" : "text-erp-label"}`}>
          {check === "available" && <CheckIcon />}
          {text}
        </p>
      )}
      <LiveText text={text} />
    </>
  );
}

/**
 * 이메일 형식 즉시 확인 — 아이디처럼 바로 물어볼 중복확인 API 가 없어(중복은 저장할 때 api 가 409 로 막는다) 형식만 본다.
 * 그래서 "사용 가능"이라 하지 않고 "형식이 올바르다"고만 말한다 — 중복 여부는 저장해야 알 수 있다.
 */
export function EmailFormatValid({ id, valid, message }: { id: string; valid: boolean; message?: string }) {
  const text = !message && valid ? "올바른 이메일 형식입니다." : "";
  return (
    <>
      <FieldMessage id={id} message={message} />
      {text && (
        <p id={id} aria-hidden="true" className="flex items-center gap-[4px] text-[13px] leading-[1.5] text-erp-on">
          <CheckIcon />
          {text}
        </p>
      )}
      <LiveText text={text} />
    </>
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

/** 막힌 버튼의 이유 안내. 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 감싸는 칸에 단다. */
export function Blocked({ reason, children }: { reason?: string; children: ReactNode }) {
  return (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  );
}
