"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, DetailValues, PageBar, Tag, Textarea, useToast, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import { bff, BffError, PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import type { InquiryDetail, LeadDetail, Target } from "@/lib/community";
import {
  deleteLeadAction,
  resendLeadReplyMailAction,
  saveMemoAction,
  saveReplyAction,
  startProcessingAction,
  type ActResult,
} from "@/lib/community-actions";
import { draftView, INQUIRY_BASE, LEAD_BASE, PASSWORD_REQUIRED_PREFIX, sizeLabel, type Draft } from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime, formatPhone } from "@/lib/format";

// 문의사항 · 도입문의 상세(#277, 목업 support/inquiry-detail · lead-detail, 데모 support/inquiry-detail* · lead-detail*). 플랫폼 관리자 전용.
// 왼쪽은 문의 내용 · 답변, 오른쪽은 문의자 정보 · (도입문의는 도입 문의 내용 · 보관) · 처리 이력 · 운영자 메모다. 바꾸는 동작은 서버 액션이 하고, 성공하면 router.refresh() 로 최신 상세를 받는다.
// 쓰던 답변 · 메모는 입력칸이 아니라 useCommon 의 drafts 가 쓰기 시작할 때 저장돼 있던 값(base)과 함께 쥔다 — 다른 동작 · 최신
// 불러오기(409 포함)로 화면이 다시 그려져도 남고, 그 칸을 저장하는 데 성공하거나 [취소]하면 비운다(front #75 리뷰). 그사이 다른 운영자가
// 그 칸을 저장했으면 손대지 않은 글은 버리고, 고쳐 쓰던 글은 남기되 새로 저장된 값을 함께 보인다(draftView, front #87 리뷰).
// 그사이 다른 운영자가 저장했으면(409) 까닭을 띠에 보이고 최신 내용을 다시 불러온다(#274). 그사이 지워졌으면(404) 목록으로 간다. 세션이 끊겨도(401) 화면을 옮기지 않고 띠로만 알린다(공지 폼과 같다).
// 문의사항 답변은 이력이 남고(고치면 새 답변을 더함, 「수정됨 · 이전 답변」), 도입문의 답변은 하나를 덮어쓴다(CNT-17 v144).
// 처리 시작 · 답변 · 메모 · 답변 메일 다시 보내기는 수정, 도입문의 삭제는 삭제 권한으로 가린다(usePagePermission, api 와 같다). 수정 권한이
// 없으면 답변 · 메모는 읽기로 보이고 처리 이력은 대기 상태만 적는다.

const ANSWER_MAX = 20_000;
const MEMO_MAX = 2_000;
// 첫 답변 저장 토스트도 한 문장 — 상태가 바뀐다는 말은 저장 옆 안내(firstNote)가 한다(2026-11-06 사용자 지정 — 전엔 「… 상태가 답변 완료로 바뀌었습니다.」)
const ANSWERED_TOAST = "답변을 저장했습니다.";
// 답변 수정 토스트는 두 상세 모두 한 문장 — 알림 · 메일이 다시 가지 않는다는 말은 입력칸 아래 안내(editNote)가 한다
// (2026-11-06 사용자 지정 — 전엔 「답변을 고쳤습니다. 문의자에게 알림은 다시 가지 않습니다.」)
const EDITED_TOAST = "답변을 수정했습니다.";

const dt = formatDateTime;
const Note = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
/**
 * 저장 버튼 옆 안내 — 입력칸 플레이스홀더(회색)와 갈리게 느낌표 동그라미 아이콘(회청) + 먹색 13px 500 으로 둔다(2026-11-05 사용자 지정 — 전엔 회색 14px Note).
 */
const GuideIcon = ({ className = "" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 ${className || "text-erp-brand"}`}>
    <circle cx="8" cy="8" r="8" fill="currentColor" />
    <rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff" />
    <circle cx="8" cy="11.6" r="0.95" fill="#fff" />
  </svg>
);
/** risk — 놓치면 안 되는 안내(탈퇴한 회원의 문의)는 아이콘 · 글자를 빨강(erp-off)으로(2026-11-06 사용자 지정) */
const Guide = ({ children, risk = false }: { children: ReactNode; risk?: boolean }) => (
  <p className={`flex items-start gap-[6px] text-[13px] leading-[1.6] font-medium ${risk ? "text-erp-off" : "text-erp-ink"}`}>
    <GuideIcon className={`mt-[3px] ${risk ? "text-erp-off" : "text-erp-brand"}`} />
    <span>{children}</span>
  </p>
);
/**
 * 쓸 수 있는 답변 · 메모 칸은 테두리를 연회청(erp-brand-soft)으로 진하게 — 공통 입력칸의 옅은 테두리(#ededee)로는 열린 칸이 잘 안 보였다
 * (2026-11-05 사용자 지정). 포커스하면 공통 규칙대로 회청(erp-brand). 공통 입력칸 토큰은 그대로 두고 이 화면에서만 감싸서 칠한다.
 */
const ACTIVE_FIELD = "[&_textarea]:border-erp-brand-soft [&_textarea:focus]:border-erp-brand";
/** 처리이력의 할 일 안내(대기 줄) — 같은 느낌표 아이콘을 붙인다(2026-11-05 사용자 지정). 글자는 표 칸 그대로 14px */
const Pending = ({ children }: { children: ReactNode }) => (
  <span className="flex min-w-0 items-center gap-[6px]">
    <GuideIcon />
    <span className="truncate">{children}</span>
  </span>
);
/** 쓰던 글이 그사이 저장된 값과 어긋났다는 알림(front #87 리뷰). */
const Stale = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-off">{children}</p>;
const Prose = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.7] whitespace-pre-wrap break-keep text-erp-ink">{children}</p>;
// 보조 글자는 점포 정보 관리 상세와 같은 14px(2026-11-05 사용자 지정 — 전엔 13px)
const Meta = ({ children }: { children: ReactNode }) => <p className="text-[14px] text-erp-label">{children}</p>;
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-muted">{children}</span>;

/** 문의자 「점포」 도움말 — 글 대신 작은 표로(2026-11-05 사용자 지정). 점포는 문의를 등록할 때 api 가 채운다(api support-inquiries targetStoreOf). */
const STORE_HELP = (
  <table className="border-collapse text-[13px] leading-[1.5] whitespace-nowrap">
    <thead>
      <tr className="text-erp-label">
        <th className="pr-[12px] pb-[4px] text-left font-medium">권한유형</th>
        <th className="pr-[12px] pb-[4px] text-left font-medium">대상점포</th>
        <th className="pb-[4px] text-left font-medium">점포</th>
      </tr>
    </thead>
    <tbody className="font-normal">
      {/* 대상점포 1곳 · 여러 곳으로 나눈다(2026-11-05 사용자 지정). 관리 점포가 없을 때도 여러 곳과 같이 BP 단위 문의다 */}
      {[
        ["가맹마스터 · 가맹관리자", "1곳", "그 점포"],
        ["가맹마스터 · 가맹관리자", "여러 곳", "BP 단위 문의"],
        ["BP 마스터 · BP 관리자", "-", "BP 단위 문의"],
      ].map(([role, count, store]) => (
        <tr key={role + count} className="border-t border-erp-thead-line">
          <td className="py-[4px] pr-[12px]">{role}</td>
          <td className="py-[4px] pr-[12px]">{count}</td>
          <td className="py-[4px]">{store}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box). 글 · 입력은 안쪽 여백, 표만 든 상자(처리 이력)는 flush 로 여백 없이.
// 제목 바 글자는 DetailTable 제목과 같은 15px 600(2026-11-05 사용자 지정 — 전엔 16px 500). hintLeft 면 보조 글자를 제목 바로 옆에 구분선과 함께 붙인다
// (답변의 「운영자 · 등록 … (수정됨 …)」 — 고객지원 문의상세와 같다), 기본은 오른쪽 끝.
function Box({ title, hint, hintLeft, flush, children }: { title: ReactNode; hint?: string; hintLeft?: boolean; flush?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className={`flex h-[42px] items-center ${hintLeft ? "gap-[10px]" : "gap-[6px]"} rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink`}>
        <span className={`min-w-0 truncate ${hintLeft ? "shrink-0" : "flex-1"}`}>{title}</span>
        {hint && hintLeft && <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />}
        {/* 제목 옆에 붙는 보조 글자(답변의 「운영자 · 등록 … (수정됨 …)」)는 2depth 글자색(erp-sub) 500 으로 진하게 — 회색 400 은 흐렸다(2026-11-06 사용자 지정).
            오른쪽 끝 안내(「운영자에게만 표시됩니다.」 등)는 그대로 회색 */}
        {hint && <span className={`min-w-0 truncate text-[14px] ${hintLeft ? "font-medium text-erp-sub" : "font-normal text-erp-label"}`}>{hint}</span>}
      </h3>
      {flush ? children : <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div>}
    </section>
  );
}

/**
 * 끝난 단계 — 배지 대신 회청 동그라미 체크 + 「완료」 글자(고객지원 처리현황의 답변완료 아이콘과 같은 모양). 할 일인 「대기」 빨간 배지만 눈에 띄게 둔다
 * (2026-11-06 사용자 지정 — 전엔 파란 「완료」 배지라 처리중 배지와 헷갈렸다).
 */
const Done = () => (
  <span className="inline-flex items-center gap-[4px] text-[14px] text-erp-ink">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-erp-brand">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8.25 7.1 10l3.65-3.75" />
    </svg>
    완료
  </span>
);

/** 아직 안 된 단계 — 「완료」와 같은 모양으로 빨간 시계 아이콘 + 빨간 「대기」 글자(고객지원 처리현황의 처리중 아이콘과 같은 모양, 2026-11-06 사용자 지정 — 전엔 빨간 배지) */
const Waiting = () => (
  <span className="inline-flex items-center gap-[4px] text-[14px] text-erp-off">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
    대기
  </span>
);

/** 처리 이력 한 줄 — [단계, 내용, 끝났는가]. 내용은 여러 줄일 수 있다(답변 등록 · 수정). */
type Step = [string, ReactNode, boolean];
/**
 * 단계 칸은 왼쪽 정렬, 폭은 위 「문의자」 표의 라벨 칸과 같게 둬 세로줄을 맞춘다(2026-11-05 사용자 지정 — 전엔 150px 가운데).
 * 표 칸 여백(10px)이 상세 표 라벨(12px)보다 2px 좁아 글 시작을 2px 밀어 맞춘다. 글자도 상세 표 라벨과 같은 회색 500(2026-11-05 사용자 지정).
 */
const stepColumns = (stepWidth: `w-[${number}px]`): Column<Step>[] => [
  { header: "단계", width: stepWidth, align: "left", cell: (s) => <span className="pl-[2px] font-medium text-erp-label">{s[0]}</span> },
  { header: "내용", align: "left", cell: (s) => s[1] },
  { header: "상태", width: "w-[80px]", cell: (s) => (s[2] ? <Done /> : <Waiting />) },
];

/**
 * 접수 · 확인 · 답변. 「확인」은 처리중을 거친 건만 완료로 그리고, 처리 시작 없이 바로 답한 건은 줄을 숨긴다(#274).
 * canEdit(수정 권한)이 없으면 누를 버튼이 없으므로 「[처리 시작]을 누르면」 · 「저장하면」 대신 대기 상태만 적는다.
 */
/** 대기 줄 할 일 안내. 문의사항은 문의자 화면(고객지원)에 보이는 상태를, 도입문의는 문의자 화면이 없어 바뀌는 상태 · 자동 메일을 말한다(2026-11-06 사용자 지정) */
const PENDING_TEXT = {
  inquiry: { confirm: "[처리 시작]을 누르면 문의자에게 처리중으로 표시됩니다.", answer: "답변을 저장하면 문의자에게 답변완료로 표시됩니다." },
  lead: { confirm: "[처리 시작]을 누르면 처리중이 됩니다.", answer: "답변을 저장하면 답변완료가 됩니다." },
};

function steps(d: InquiryDetail | LeadDetail, answered: ReactNode, canEdit: boolean, kind: keyof typeof PENDING_TEXT = "inquiry"): Step[] {
  const text = PENDING_TEXT[kind];
  const confirm: Step[] = d.processingStartedAt
    ? [["확인", `${dt(d.processingStartedAt)} · ${d.processingStartedByName ?? "-"}`, true]]
    : d.status === "RECEIVED"
      ? [["확인", canEdit ? <Pending>{text.confirm}</Pending> : "처리 시작 전", false]]
      : [];
  return [["접수", dt(d.createdAt), true], ...confirm, answered ? ["답변", answered, true] : ["답변", canEdit ? <Pending>{text.answer}</Pending> : "답변 전", false]];
}

/** stepWidth 는 같은 쪽 「문의자」 표의 라벨 칸 폭(문의사항 100px · 도입문의 110px) */
function History({ rows, stepWidth = "w-[110px]" }: { rows: Step[]; stepWidth?: `w-[${number}px]` }) {
  return (
    <Box title="처리이력" flush>
      {/* 열 이름 줄(단계 · 내용 · 상태)은 두지 않는다 — 값만으로 뜻이 분명하다(2026-11-05 사용자 지정) */}
      <DataTable headVariant="none" columns={stepColumns(stepWidth)} rows={rows} rowKey={(s) => s[0]} />
    </Box>
  );
}

type Failure = { ok: false; status?: number; messages: string[] };

/** 서버 액션을 부른다. 요청이 닿지 않으면(오프라인 · 배포 뒤 옛 화면 · 500) 던지지 않고 실패로 돌려 오류 화면 대신 띠에 보인다. */
async function call<T>(action: () => Promise<T>): Promise<T | Failure> {
  try {
    return await action();
  } catch (e) {
    console.error("문의 상세 서버 액션 실패", e);
    return { ok: false, messages: ["서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요."] };
  }
}

/**
 * 실패 띠 · 진행 중 · 서버 액션 부르기. 성공하면 토스트를 띄우고 최신 상세를 다시 받는다(done 이 있으면 그것을 대신 한다).
 * 그사이 다른 운영자가 지웠으면(404) 띠만 띄우면 화면이 그대로 남으므로 까닭을 토스트로 알리고 목록으로 보낸다.
 */
function useAct(listHref: string, hasDrafts: boolean) {
  const router = useRouter();
  const toast = useToast();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, startTransition] = useTransition();
  const fail = ({ status, messages }: Failure) => {
    if (status === 404) {
      toast(messages[0] ?? "이미 삭제되었습니다.");
      return router.push(listHref);
    }
    const reloaded = `최신 내용을 다시 불러왔습니다.${hasDrafts ? " 쓰던 답변 · 메모는 그대로 두었습니다." : ""} 확인한 뒤 다시 해 주세요.`;
    setErrors(status === 409 ? [...messages, reloaded] : messages);
    if (status === 409) router.refresh();
    // 비밀번호 강제 변경 403 이면 SessionGate 가 변경 팝업을 다시 띄운다(BFF 와 같은 이벤트).
    if (messages[0]?.startsWith(PASSWORD_REQUIRED_PREFIX)) dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
  };
  const run = (action: () => Promise<ActResult>, message: string, done?: () => void) =>
    startTransition(async () => {
      const result = await call(action);
      if (!result.ok) return fail(result);
      setErrors([]);
      toast(message);
      if (done) done();
      else router.refresh();
    });
  return { errors, setErrors, busy, run, fail, startTransition, router, toast };
}

function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    // 공통 실패 띠(NoticeBand risk)와 같은 빨간 1px 테두리(2026-11-06 사용자 지정 — 전엔 테두리를 바탕색으로 칠해 다른 화면 실패 띠보다 흐려 보였다)
    <div role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      {errors.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}

/** 본문 첫 줄 「○○ 상세」 + 상태 + 오른쪽 끝 버튼, 아래 7:5 두 단(데모 detailHead · cols). */
/** head 를 넘기면 「○○ 상세 [상태]」 대신 그 머리 줄(점포 정보 관리 상세의 점포명 줄 모양)을 보인다 — 문의사항. */
function Frame({ title, head, status, buttons, errors, left, right, children }: { title: string; head?: ReactNode; status: ReactNode; buttons: ReactNode; errors: string[]; left: ReactNode; right: ReactNode; children?: ReactNode }) {
  return (
    <>
      <PageBar title={title} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className={`flex items-center ${head ? "gap-[18px]" : "gap-[6px]"}`}>
            {head ? (
              <div className="min-w-0 flex-1">{head}</div>
            ) : (
              <h2 className="flex flex-1 items-center gap-[8px] text-[18px] font-semibold text-erp-ink">
                {title} 상세 {status}
              </h2>
            )}
            {buttons}
          </div>
          <Errors errors={errors} />
          <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
            <div className="flex min-w-0 flex-col gap-[24px]">{left}</div>
            <div className="flex min-w-0 flex-col gap-[24px]">{right}</div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

/**
 * 상세 상태 — 접수 빨강 배지 · 처리중 파랑 배지 · 답변완료 회색 꼬리표. 답변완료는 목록과 같이 끝난 일이라 회색이고, 처리중은 회색이 겹치지 않게 파랑으로 둔다
 * (2026-11-06 사용자 지정 — 전엔 처리중 회색 꼬리표 · 답변완료 파랑 배지).
 */
const StatusBadge = ({ status, statuses }: { status: InquiryDetail["status"]; statuses: EnumValue[] }) =>
  status === "ANSWERED" ? <Tag>{labelOf(statuses, status)}</Tag> : status === "IN_PROGRESS" ? <Badge tone="on">{labelOf(statuses, status)}</Badge> : <Badge tone="off">{labelOf(statuses, status)}</Badge>;

/**
 * 답변 상자. 답변 전이면 입력칸, 답변 완료면 읽기 + 「답변 수정」(CNT-17). 쓰던 글(draft)이 있으면 입력칸을 연다 — 저장에 성공하거나
 * [취소]하면 draft 가 비어 읽기로 돌아간다. 그사이 다른 운영자가 답변을 저장했으면 위 읽기(view)에 새 답변이 서고 입력칸 아래에 알린다.
 * view 는 답변 완료일 때 위에 늘 보일 읽기 내용(본문 · 시각 · 메일 결과 등)이다. actions 는 읽기일 때 「답변 수정」 옆에 둘 버튼이다 —
 * 고치는 동안에는 숨는다. 그때 누르면 화면에서 고치던 글이 아니라 이미 저장된 답변이 나가기 때문이다.
 */
function AnswerBox({
  hint,
  hintLeft,
  current,
  view,
  actions,
  placeholder,
  firstNote,
  editNote,
  noteRisk,
  busy,
  canEdit,
  onSave,
  draft,
  onDraft,
}: {
  hint?: string;
  /** 답변이 있을 때 보조 글자(운영자 · 등록 …)를 제목 옆 왼쪽에 둔다 */
  hintLeft?: boolean;
  current: string | null;
  view: ReactNode;
  actions?: ReactNode;
  placeholder: string;
  firstNote: string;
  editNote: string;
  /** 저장 옆 안내를 빨강으로(탈퇴한 회원의 문의) */
  noteRisk?: boolean;
  busy: boolean;
  /** 수정 권한. 없으면 저장된 답변만 읽기로 보이고 입력칸 · 버튼 · actions(답변 메일 다시 보내기)를 두지 않는다 */
  canEdit: boolean;
  onSave: (body: string) => void;
  /** 쓰던 답변. 없으면(undefined) 저장된 답변을 읽기로 보인다. */
  draft: Draft | undefined;
  /** 쓰던 글을 바꾼다. base 는 지금 저장된 값 — 새로 쓰기 시작할 때만 남는다. undefined 면 비운다. */
  onDraft: (text: string | undefined, base: string) => void;
}) {
  if (!canEdit)
    return (
      <Box title="답변" hint={hint} hintLeft={hintLeft}>
        {current !== null ? view : <Note>등록된 답변이 없습니다.</Note>}
      </Box>
    );
  const saved = current ?? "";
  const shown = draftView(draft, saved);
  const editing = shown.text !== undefined || current === null;
  const text = shown.text ?? saved;
  return (
    <Box title="답변" hint={hint} hintLeft={hintLeft}>
      {current !== null && view}
      {editing ? (
        <>
          {/* [답변 수정]으로 연 칸은 바로 포커스해 테두리가 회청으로 바뀐다 — 옅은 테두리라 열린 칸이 잘 안 보였다(2026-11-05 사용자 지정). 첫 답변 칸은 화면을 열 때부터 있어 포커스를 빼앗지 않는다 */}
          <div className={ACTIVE_FIELD}>
            <Textarea rows={6} value={text} maxLength={ANSWER_MAX} placeholder={placeholder} aria-label="답변 내용" autoFocus={current !== null} onChange={(e) => onDraft(e.target.value, saved)} />
          </div>
          {shown.stale && <Stale>그사이 다른 운영자가 답변을 저장했습니다(위). 확인한 뒤 고쳐 저장하거나 [취소]하세요.</Stale>}
          <div className="flex items-center gap-[12px]">
            <div className="flex-1">
              <Guide risk={noteRisk}>{current === null ? firstNote : editNote}</Guide>
            </div>
            {current !== null && (
              <Button variant="off" disabled={busy} onClick={() => onDraft(undefined, saved)}>
                취소
              </Button>
            )}
            <Button disabled={busy} onClick={() => onSave(text)}>
              답변 저장
            </Button>
          </div>
        </>
      ) : (
        // 저장 · 메모 저장 버튼처럼 오른쪽 끝에(2026-11-05 사용자 지정 — 전엔 왼쪽)
        <div className="flex items-center justify-end gap-[6px]">
          <Button variant="soft" onClick={() => onDraft(saved, saved)}>
            답변 수정
          </Button>
          {actions}
        </div>
      )}
    </Box>
  );
}

function MemoBox({
  memo,
  busy,
  canEdit,
  onSave,
  draft,
  onDraft,
}: {
  memo: string | null;
  busy: boolean;
  /** 수정 권한. 없으면 저장된 메모만 읽기로 보인다 */
  canEdit: boolean;
  onSave: (memo: string) => void;
  draft: Draft | undefined;
  onDraft: (text: string | undefined, base: string) => void;
}) {
  if (!canEdit)
    return (
      <Box title="운영자 메모" hint="운영자에게만 표시됩니다.">
        {memo ? <Prose>{memo}</Prose> : <Note>메모가 없습니다.</Note>}
      </Box>
    );
  const saved = memo ?? "";
  const shown = draftView(draft, saved);
  const text = shown.text ?? saved;
  return (
    <Box title="운영자 메모" hint="운영자에게만 표시됩니다.">
      {/* 그사이 다른 운영자가 메모를 저장했다 — 쓰던 글로 덮어쓰기 전에 그 메모를 보인다. */}
      {shown.stale && (
        <Stale>
          그사이 다른 운영자가 저장한 메모: {saved ? <span className="whitespace-pre-wrap text-erp-ink">{saved}</span> : "(비움)"}
          <span className="ml-[6px]">
            <Button variant="off" disabled={busy} onClick={() => onDraft(undefined, saved)}>
              저장된 메모로 바꾸기
            </Button>
          </span>
        </Stale>
      )}
      <div className={ACTIVE_FIELD}>
        <Textarea rows={4} value={text} maxLength={MEMO_MAX} aria-label="내부 기록" onChange={(e) => onDraft(e.target.value, saved)} />
      </div>
      <div className="flex items-center gap-[12px]">
        <div className="flex-1">
          <Guide>작성한 메모는 다른 운영자와 공유됩니다. 내용을 모두 지우고 저장하면 메모가 삭제됩니다.</Guide>
        </div>
        <Button variant="soft" disabled={busy} onClick={() => onSave(text)}>
          메모 저장
        </Button>
      </div>
    </Box>
  );
}

/** 처리 시작 · 답변 · 메모 — 두 상세가 같다. */
/** onEdited — 답변 완료 건의 답변을 고쳐 저장한 뒤 부른다(도입문의는 재발송 확인창을 연다). */
function useCommon(target: Target, id: number, updatedAt: string, answered: boolean, onEdited?: () => void) {
  // 쓰던 답변 · 메모. 저장에 성공하면 그 칸만 비우고 최신 상세를 받는다.
  const [drafts, setDrafts] = useState<{ answer?: Draft; memo?: Draft }>({});
  // 409 안내의 「그대로 두었다」는 실제로 고쳐 쓰던 글이 있을 때만.
  const edited = (["answer", "memo"] as const).some((f) => drafts[f] && drafts[f].text !== drafts[f].base);
  const act = useAct(target === "inquiry" ? INQUIRY_BASE : LEAD_BASE, edited);
  const { run, setErrors } = act;
  // 처리 시작 · 답변 · 메모 · 답변 메일 다시 보내기는 수정, 도입문의 삭제는 삭제 권한이다(api 와 같다). 권한이 빠지면 버튼 · 입력칸 · 열려 있던 확인창을 거둔다.
  // 쓰던 글(drafts)은 지우지 않고 숨기기만 한다 — 권한이 돌아오면 다시 보인다.
  const can = usePagePermission();
  // base 는 쓰기 시작할 때의 저장값 — 이어 쓰는 동안은 처음 base 를 지킨다. 버려진 글(draftView 가 undefined)에 이어 쓰면 새로 시작한다.
  const setDraft = (field: "answer" | "memo") => (text: string | undefined, base: string) =>
    setDrafts((d) => {
      const prev = d[field];
      if (text === undefined) return { ...d, [field]: undefined };
      return { ...d, [field]: { text, base: prev && draftView(prev, base).text !== undefined ? prev.base : base } };
    });
  const saved = (field: "answer" | "memo") => () => {
    setDrafts((d) => ({ ...d, [field]: undefined }));
    act.router.refresh();
  };
  return {
    ...act,
    can,
    drafts,
    setDraft,
    startProcessing: () => run(() => startProcessingAction(target, id), "처리중으로 변경됩니다."),
    saveReply: (body: string) => {
      if (!body.trim()) return setErrors(["답변을 입력해 주세요."]);
      const toast = answered ? EDITED_TOAST : ANSWERED_TOAST;
      run(() => saveReplyAction(target, id, body, updatedAt), toast, () => {
        saved("answer")();
        if (answered) onEdited?.();
      });
    },
    saveMemo: (memo: string) => run(() => saveMemoAction(target, id, memo, updatedAt), "saved", saved("memo")),
  };
}

export function InquiryDetailView({ detail: d, statuses }: { detail: InquiryDetail; statuses: EnumValue[] }) {
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const roleLabel = useCodeLabel("ROLE_TYPE");
  const answered = d.replies.length > 0;
  // 탈퇴한 회원의 문의 — BP 회원 탈퇴는 계정의 이름 · 휴대전화 · 이메일을 비운다(api admin-withdrawal). 쓰는 계정은 이름이 필수라 이름이 비었으면 탈퇴다.
  // 답변을 저장해도 api 가 받는 사람을 못 찾아 알림 · 메일을 보내지 않는다(inquiries.service sendMail) — 이름 칸과 저장 옆 안내로 알린다(2026-11-06 사용자 지정)
  const withdrawn = !d.senderName;
  const c = useCommon("inquiry", d.inquiryId, d.updatedAt, answered);
  const first = d.replies[0];
  const last = d.replies.at(-1);
  const previous = d.replies.slice(0, -1).reverse();

  // 첨부 내려받기 — 5분짜리 서명 주소라 누를 때마다 새로 받는다. 받으면 원래 파일 이름으로 저장된다.
  const download = (attachmentId: number) =>
    c.startTransition(async () => {
      try {
        const { url } = await bff<{ url: string }>(`${INQUIRY_BASE}/${d.inquiryId}/attachments/${attachmentId}/download-url`);
        window.location.assign(url);
      } catch (e) {
        c.setErrors([e instanceof BffError ? e.message : "첨부파일을 받지 못했습니다."]);
      }
    });

  const left = (
    <>
      {/* 제목 · 접수일시 · 분류 · 상태는 머리 줄로 옮겼다 — 고객지원 문의상세와 같은 「문의내용」 상자(2026-11-05 사용자 지정) */}
      <Box title="문의내용">
        <Prose>{d.body}</Prose>
      </Box>
      {/* 첨부(CNT-18): 이미지는 작은 미리보기(8px 둥글게), PDF 는 이름 + 크기. 누르면 내려받는다.
          종류 칸(이미지 · PDF) 없이 줄만 — 고객지원 문의상세와 같다(2026-11-05 사용자 지정) */}
      {d.attachments.length > 0 && (
        <Box title="첨부파일" flush>
          <ul className="rounded-b-[2px] border border-erp-thead-line bg-white">
            {d.attachments.map((a) => (
              <li key={a.inquiryAttachmentId} className={`flex items-center border-b border-erp-thead-line px-[12px] last:border-b-0 ${a.thumbnailUrl ? "py-[12px]" : "h-[46px]"}`}>
                <button type="button" disabled={c.busy} onClick={() => download(a.inquiryAttachmentId)} title={`${a.fileName} 내려받기`} className="flex min-w-0 items-center gap-[10px] text-left text-[14px]">
                  {a.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
                    <img src={a.thumbnailUrl} alt="" className="size-[64px] shrink-0 rounded-[8px] border border-erp-panel-line object-cover" />
                  )}
                  <span className="truncate text-erp-link hover:underline">{a.fileName}</span>
                  <Sub>{sizeLabel(a.sizeBytes)}</Sub>
                </button>
              </li>
            ))}
          </ul>
        </Box>
      )}
      <AnswerBox
        // 답변이 있으면 지금 보이는 답변이 언제 · 누가 쓴 것인지만 제목 옆 왼쪽에 — 고친 적이 없으면 「등록 시각 · 운영자」, 고쳤으면 「최종 수정 시각 · 운영자」
        // (2026-11-06 사용자 지정 — 전엔 「운영자 · 등록 시각 (수정됨 시각 · 운영자)」). 첫 등록 · 중간 수정은 처리이력 · 이전 답변이 보인다. 없으면 오른쪽 끝 안내
        hint={
          first && last
            ? previous.length
              ? `최종 수정 ${dt(last.repliedAt)} · ${last.repliedByName ?? "-"}`
              : `등록 ${dt(first.repliedAt)} · ${first.repliedByName ?? "-"}`
            : "문의자에게 표시됩니다."
        }
        hintLeft={answered}
        current={last?.body ?? null}
        view={
          last && (
            <>
              <Prose>{last.body}</Prose>
              {previous.length > 0 && (
                <details className="group rounded-[2px] border border-[#d9d9d9]">
                  {/* 펼치는 줄로 보이게 오른쪽에 꺾쇠(닫히면 아래, 펼치면 위 — FAQ 와 같다). 바탕은 위 「답변」 제목 바(#f8f9fb)와 갈리게 erp-subtle, 호버하면 erp-bar-line
                      (2026-11-06 사용자 지정 — 전엔 제목 바와 같은 #f8f9fb 라 구분이 안 됐다) */}
                  <summary className="flex h-[34px] cursor-pointer items-center gap-[10px] bg-erp-subtle px-[12px] text-[14px] font-medium text-erp-ink transition-colors duration-150 hover:bg-erp-bar-line [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">이전 답변 {previous.length}개</span>
                    <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="-rotate-90 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" />
                  </summary>
                  {/* 답변마다 칸을 나눈다 — 1px 선으로 가르고, 머리 줄에 「등록 · 수정」 꼬리표 + 일시 · 운영자(처리이력 답변 줄과 같은 말). 최근 것이 위
                      (2026-11-06 사용자 지정 — 전엔 12px 간격만 두고 이어 붙여 여러 개면 어디서 나뉘는지 안 보였다).
                      상자 · 칸 선은 값 구분선 #d9d9d9(DESIGN.md), 머리 줄 글자는 먹색 500 — 패널 선 · 회색 글자로는 흐려 보였다(2026-11-06 사용자 지정) */}
                  <ol className="flex flex-col divide-y divide-[#d9d9d9] border-t border-[#d9d9d9]">
                    {previous.map((r) => (
                      <li key={r.inquiryReplyId} className="flex flex-col gap-[8px] p-[12px]">
                        <p className="flex items-center gap-[8px] text-[14px] font-medium text-erp-ink">
                          <Tag>{r.inquiryReplyId === first?.inquiryReplyId ? "등록" : "수정"}</Tag>
                          {dt(r.repliedAt)} · {r.repliedByName ?? "-"}
                        </p>
                        <Prose>{r.body}</Prose>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </>
          )
        }
        placeholder={"문의자가 확인할 답변을 작성해 주세요.\n문제 해결 방법이나 필요한 조치를 구체적으로 안내해 주세요."}
        noteRisk={withdrawn}
        firstNote={
          withdrawn
            ? "탈퇴한 회원의 문의입니다. 답변을 저장해도 알림함 · 이메일로 안내되지 않습니다."
            : "답변을 저장하면 처리상태는 '답변완료'로 변경되며, 문의자의 알림함과 이메일로 안내됩니다."
        }
        editNote={
          withdrawn
            ? "탈퇴한 회원의 문의입니다. 답변을 수정해도 알림함 · 이메일로 안내되지 않습니다."
            : "답변을 수정하면 처리상태는 '답변완료'로 유지되며, 문의자에게 알림이 발송되지 않습니다."
        }
        busy={c.busy}
        canEdit={c.can.update}
        onSave={c.saveReply}
        draft={c.drafts.answer}
        onDraft={c.setDraft("answer")}
      />
    </>
  );

  const right = (
    <>
      {/* 문의를 보낸 사람 — 「문의자 정보」(2026-11-06 사용자 지정 — 전엔 「문의자」, 그 전엔 「보낸 곳」). 도입문의 상세도 같다 */}
      <DetailTable
        title="문의자 정보"
        labelWidth="w-[100px]"
        rows={[
          // 탈퇴한 회원은 빨강 — 답변이 가지 않는 문의라 눈에 띄게(2026-11-06 사용자 지정)
          { label: "이름", value: d.senderName || <span className="text-erp-off">탈퇴한 회원</span> },
          // BP 상호명은 길 수 있어 자르지 않고 줄을 바꾼다(2026-11-05 사용자 지정)
          { label: "BP상호명", value: <span className="break-keep">{d.bpName ?? "-"}</span>, multiline: true },
          // 이름 · BP상호명 · 권한유형 · 점포(2026-11-05 사용자 지정). 권한유형은(BP 마스터 등) — 아이디 · 권한명은 api 가 내려주지 않는다.
          { label: "권한유형", value: d.senderRoleTypeCode ? roleLabel(d.senderRoleTypeCode) : "-" },
          // 점포는 api 가 채운다 — 가맹마스터 · 가맹관리자가 관리 점포 하나뿐이면 그 점포, 그 밖(BP 단위 관리자 · 점포 여럿)은 비어 「BP 단위 문의」
          // 「점포」 라벨 옆 도움말 — 마우스를 올리면 어떤 점포가 들어가는지 알린다(2026-11-05 사용자 지정)
          {
            label: "점포",
            help: STORE_HELP,
            value: d.storeName ?? <Sub>BP 단위 문의</Sub>,
          },
        ]}
      />
      {/* 관리자 쪽은 누가 언제 무엇을 했는지 남기는 「단계 · 내용 · 상태」 표 그대로 — 문의자 쪽(고객지원)만 처리현황 목록으로 바꿨다(2026-11-05 사용자 지정) */}
      <History
        stepWidth="w-[100px]"
        // 답변은 처음 등록 한 줄, 고칠 때마다 한 줄씩 더한다 — 「등록 | 일시 · 운영자」 · 「수정 | 일시 · 운영자」(2026-11-05 사용자 지정)
        rows={steps(
          d,
          answered && (
            <span className="flex flex-col py-[12px] leading-[1.6]">
              {d.replies.map((r, i) => (
                <span key={r.inquiryReplyId} className="flex min-w-0 items-center gap-[10px]">
                  {/* 「등록 · 수정 · 최종 수정」 칸 폭을 같게 둬 구분선 · 시각 시작선을 맞춘다(2026-11-06 사용자 지정) */}
                  <span className="w-[56px] shrink-0 text-erp-label">{i === 0 ? "등록" : i === d.replies.length - 1 ? "최종 수정" : "수정"}</span>
                  {/* #d9d9d9 — DESIGN.md 의 값 구분선 */}
                  <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
                  <span className="truncate">
                    {dt(r.repliedAt)} · {r.repliedByName ?? "-"}
                  </span>
                </span>
              ))}
            </span>
          ),
          c.can.update,
        )}
      />
      {/* 운영자 메모는 처리이력 아래(2026-11-06 사용자 지정 — 전엔 왼쪽 답변 아래). 도입문의 상세도 같다 */}
      <MemoBox memo={d.internalMemo} busy={c.busy} canEdit={c.can.update} onSave={c.saveMemo} draft={c.drafts.memo} onDraft={c.setDraft("memo")} />
    </>
  );

  return (
    <Frame
      title="문의사항"
      head={
        // 점포 정보 관리 상세의 점포명 줄과 같은 모양 — 제목 20px(자르지 않음), 아래 줄 「접수일시 … | 분류 [꼬리표] | [상태]」(2026-11-05 사용자 지정)
        <div className="flex flex-col gap-[6px] py-[6px]">
          <h2 className="break-all text-[20px] font-semibold text-erp-ink">{d.title}</h2>
          <div className="flex flex-wrap items-center gap-[10px] text-[14px] font-medium text-erp-label">
            <span>접수일시 {dt(d.createdAt)}</span>
            <span className="h-[11px] w-px bg-[#d9d9d9]" />
            <span className="flex items-center gap-[6px]">
              분류 <Tag>{categoryLabel(d.inquiryCategoryCode)}</Tag>
            </span>
            <span className="h-[11px] w-px bg-[#d9d9d9]" />
            {/* 상태에도 「분류」처럼 앞에 이름을 붙인다(2026-11-06 사용자 지정) */}
            <span className="flex items-center gap-[6px]">
              상태 <StatusBadge status={d.status} statuses={statuses} />
            </span>
          </div>
        </div>
      }
      status={<StatusBadge status={d.status} statuses={statuses} />}
      errors={c.errors}
      left={left}
      right={right}
      buttons={
        <div className="flex items-center gap-[6px]">
          {d.status === "RECEIVED" && c.can.update && (
            <Button variant="soft" disabled={c.busy} onClick={c.startProcessing}>
              처리 시작
            </Button>
          )}
          <Button href={INQUIRY_BASE}>
            목록
          </Button>
        </div>
      }
    />
  );
}

export function LeadDetailView({ detail: d, statuses, interests, mailResults }: { detail: LeadDetail; statuses: EnumValue[]; interests: EnumValue[]; mailResults: EnumValue[] }) {
  const industryLabel = useCodeLabel("INDUSTRY");
  const planLabel = useCodeLabel("PLAN_PERIOD");
  const answered = d.reply !== null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
  // 답변을 고쳐 저장한 직후에 연 창인가 — 「resend」는 재발송 확인, 「wait」는 1분 제한 안내(재발송 버튼 없이 [확인]만)
  const [afterEdit, setAfterEdit] = useState<false | "resend" | "wait">(false);
  // 답변 메일은 한 건에 1분에 한 번만 보낸다(api RESEND_TOO_SOON). 마지막 발송이 1분 안이면 고친 뒤 재발송 확인창을 띄우지 않는다 —
  // 확인창에서 [재발송]을 눌러도 409 실패 띠만 뜬다. 대신 같은 자리에 「1분 후 재발송」 안내 창을 띄운다(2026-11-06 사용자 지정). 시계 차이는 api 가 다시 막는다.
  const tooSoon = () => !!d.replyMailAttemptedAt && Date.now() - Date.parse(d.replyMailAttemptedAt) < 60_000;
  const c = useCommon(
    "lead",
    d.leadId,
    d.updatedAt,
    answered,
    () => {
      setAfterEdit(tooSoon() ? "wait" : "resend");
      setConfirmResend(true);
    },
  );
  const closeResend = () => {
    setConfirmResend(false);
    setAfterEdit(false);
  };
  // 열린 동안 수정 권한이 빠지면 창 상태도 거둔다 — 권한이 돌아와도 옛 창이 저절로 다시 열리지 않게(리뷰 반영)
  if (!c.can.update && (confirmResend || afterEdit)) closeResend();
  // api 와 같은 조건 — 상담 완료일이 없어도 답변 완료면 못 지운다(상담 완료일 없이 답변 완료된 옛 행, front #75 리뷰).
  const deletable = !d.consultedDate && d.status !== "ANSWERED";
  const industry = d.industryDetail ? `${industryLabel(d.industryCode)} (${d.industryDetail})` : industryLabel(d.industryCode);
  // 상담 완료일로부터 1년 뒤 파기(WHALEERP-274 · 295) — api 가 주지 않아 여기서 연도만 더해 보인다(2월 29일은 3월 1일로 읽는다). 실제 파기는 api 배치가 한다.
  const purge = d.consultedDate && (d.consultedDate.endsWith("-02-29") ? `${Number(d.consultedDate.slice(0, 4)) + 1}-03-01` : `${Number(d.consultedDate.slice(0, 4)) + 1}${d.consultedDate.slice(4)}`);

  // 저장된 지금 답변을 다시 보낸다(#597). 답변 완료면 지난 결과와 상관없이 누를 수 있다. SMTP 가 실패해도 200 에 FAILED 라 결과를 보고 알린다.
  // 1분 안에 또 보내면 api 가 409 — 띠에 까닭을 보이고 최신 상세를 다시 받는다.
  // 문의자 메일함에 한 통 더 가므로 확인창을 거친다(front #75 리뷰).
  const resend = () =>
    c.startTransition(async () => {
      closeResend();
      const result = await call(() => resendLeadReplyMailAction(d.leadId));
      if (!result.ok) return c.fail(result);
      if (result.mail.replyMailResult === "SUCCEEDED") {
        c.setErrors([]);
        c.toast("답변 메일을 재발송했습니다.");
      } else c.setErrors(["답변 메일을 재발송하지 못했습니다. 잠시 후 다시 시도해 주세요."]);
      c.router.refresh();
    });

  const remove = () => {
    setConfirmDelete(false);
    c.run(deleteLeadAction.bind(null, d.leadId), "deleted", () => c.router.push(LEAD_BASE));
  };

  // 마지막 답변 메일 결과(#597). 결과 없이 시각만 있으면 보내는 중이거나 결과를 남기지 못한 것이다.
  const mail = d.replyMailResult ? (
    <>
      <Badge tone={d.replyMailResult === "SUCCEEDED" ? "on" : "off"}>{labelOf(mailResults, d.replyMailResult)}</Badge>
      {dt(d.replyMailAttemptedAt)}
    </>
  ) : d.replyMailAttemptedAt ? (
    <>
      <Tag>결과 모름</Tag>
      {dt(d.replyMailAttemptedAt)}
    </>
  ) : (
    <Sub>보낸 적 없음</Sub>
  );

  const left = (
    <>
      {/* 왼쪽 맨 위 「도입 문의 내용」 — 관심 서비스 · 도입 예정 시기, 그 아래 문의 글(2026-11-06 사용자 지정 — 전엔 왼쪽 「이름 · 업종」 상자에 글,
          오른쪽에 「도입 문의 내용」 표). 동의 두 줄은 오른쪽 문의자 정보로 옮겼다 */}
      {/* 문의 글은 라벨 칸 없이 표 아래에 붙여 표 폭을 다 쓴다(2026-11-06 사용자 지정 — 「문의 내용」 라벨 줄을 뺐다) */}
      <div className="flex min-w-0 flex-col">
        <DetailTable
          title="도입 문의 내용"
          // 접수 시각은 제목 줄 오른쪽 끝에 그대로 둔다 — 전 「이름 · 업종」 상자의 보조 글자와 같은 14px 회색(2026-11-06 사용자 지정)
          action={<span className="shrink-0 text-[14px] text-erp-label">{dt(d.createdAt)} 접수</span>}
          rows={[
            { label: "관심 서비스", value: <DetailValues items={d.interests.map((i) => labelOf(interests, i))} /> },
            { label: "도입 예정 시기", value: d.planPeriodCode ? planLabel(d.planPeriodCode) : <Sub>선택하지 않음</Sub> },
          ]}
        />
        <div className="rounded-b-[2px] border border-t-0 border-erp-thead-line bg-white p-[16px]">
          <Prose>{d.body}</Prose>
        </div>
      </div>
      <AnswerBox
        current={d.reply}
        view={
          <>
            <Prose>{d.reply}</Prose>
            <Meta>
              {dt(d.repliedAt)} · {d.repliedByName ?? "-"}
            </Meta>
            <DetailTable title="답변 메일" rows={[{ label: "마지막 발송", value: mail }]} />
          </>
        }
        // 처음 답할 때만 메일이 가고 고쳐도 다시 가지 않는다. [다시 보내기]는 저장된 지금 답변을 보낸다(같은 도입문의 1분 간격).
        actions={
          <Button variant="soft" disabled={c.busy || d.status !== "ANSWERED"} onClick={() => {
              setAfterEdit(false);
              setConfirmResend(true);
            }}>
            답변 메일 재발송
          </Button>
        }
        // 입력칸 · 저장 옆 안내(2026-11-06 사용자 지정 — 전엔 「계정이 없는 분이라 …」 · 「저장하면 상태가 답변 완료로 바뀌고 …」)
        placeholder="문의자에게 전달할 답변을 입력해 주세요."
        firstNote="답변을 저장하면 상담이 완료되고, 문의자에게 답변 메일이 자동 발송됩니다."
        editNote="수정한 답변은 문의자에게 자동으로 발송되지 않습니다. 수정 내용을 전달하려면 저장 후 [답변 메일 재발송]을 눌러 주세요."
        busy={c.busy}
        canEdit={c.can.update}
        onSave={c.saveReply}
        draft={c.drafts.answer}
        onDraft={c.setDraft("answer")}
      />
    </>
  );

  // 상호 · 사업자등록번호 · 점포 수는 접수 때 받지 않는다(WHALEERP-288).
  const right = (
    <>
      {/* 「문의자 정보」 — 문의사항 상세와 같다(2026-11-06 사용자 지정 — 전엔 「문의자」) */}
      <DetailTable
        title="문의자 정보"
        rows={[
          { label: "이름", value: d.contactName },
          { label: "업종", value: industry },
          { label: "전화번호", value: formatPhone(d.phone) },
          { label: "이메일", value: d.email },
          { label: "개인정보 동의", value: `동의 · ${dt(d.privacyAgreedAt)}` },
          { label: "마케팅 수신", value: d.marketingAgreedAt ? `동의 · ${dt(d.marketingAgreedAt)}` : <Sub>동의하지 않음</Sub> },
        ]}
      />
      <div className="flex flex-col gap-[12px]">
        <DetailTable
          title="보관"
          // 보관 안내 한 문장은 제목 줄 오른쪽 끝 — 「도입 문의 내용」의 접수 시각과 같은 14px 회색(2026-11-06 사용자 지정 — 전엔 표 아래 줄,
          // 그 전엔 삭제 가능 여부 · 권한에 따라 네 가지 문장). [삭제]는 지울 수 있고 권한이 있을 때만 버튼으로 보인다
          action={<span className="min-w-0 truncate text-[14px] text-erp-label">상담 완료 후 1년간 보관되며, 기간 만료 시 파기됩니다.</span>}
          rows={[
            // 빈 값 · 라벨(2026-11-06 사용자 지정 — 전엔 「답변을 저장하는 날 남습니다.」 · 「파기 예정」)
            { label: "상담 완료일", value: d.consultedDate ?? <Sub>답변 저장 시 자동 기록</Sub> },
            { label: "파기 예정일", value: purge || <Sub>상담 완료일로부터 1년</Sub> },
          ]}
        />
        {/* 삭제 안내 — 지울 수 있는 건(답변 전)이고 삭제 권한이 있어 [삭제]가 보일 때만. 저장 옆 안내와 같은 느낌표 아이콘 + 먹색 13px(2026-11-06 사용자 지정) */}
        {deletable && c.can.delete && <Guide>스팸, 중복 접수, 테스트, 연락처 오류 등 상담이 필요하지 않은 문의는 삭제할 수 있습니다. 삭제한 문의는 복구할 수 없습니다.</Guide>}
      </div>
      <History rows={steps(d, d.repliedAt && `${dt(d.repliedAt)} · ${d.repliedByName ?? "-"}`, c.can.update, "lead")} />
      {/* 운영자 메모는 처리이력 아래 — 문의사항 상세와 같다(2026-11-06 사용자 지정 — 전엔 왼쪽 답변 아래) */}
      <MemoBox memo={d.internalMemo} busy={c.busy} canEdit={c.can.update} onSave={c.saveMemo} draft={c.drafts.memo} onDraft={c.setDraft("memo")} />
    </>
  );

  return (
    <Frame
      title="도입문의"
      status={<StatusBadge status={d.status} statuses={statuses} />}
      errors={c.errors}
      left={left}
      right={right}
      buttons={
        <div className="flex items-center gap-[6px]">
          {deletable && c.can.delete && (
            <Button variant="soft" disabled={c.busy} onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )}
          {d.status === "RECEIVED" && c.can.update && (
            <Button variant="soft" disabled={c.busy} onClick={c.startProcessing}>
              처리 시작
            </Button>
          )}
          <Button href={LEAD_BASE}>
            목록
          </Button>
        </div>
      }
    >
      <ConfirmDialog open={confirmDelete && c.can.delete} title="도입 문의를 삭제하시겠습니까?" confirmLabel="삭제" busy={c.busy} onConfirm={remove} onCancel={() => setConfirmDelete(false)}>
        {/* 지워도 되는 건인지 확인 → 누구의 어느 접수인지(회색 상자) → 복구 불가(2026-11-06 사용자 지정 — 전엔 「{이름} · {일시} 접수 건을 지웁니다. 지우면 기록이 남지 않고 되돌릴 수 없습니다.」) */}
        <p>스팸, 중복 접수, 테스트, 연락처 오류 등 상담이 필요하지 않은 문의인지 확인해 주세요.</p>
        <dl className="mt-[12px] grid grid-cols-[max-content_1fr] gap-x-[12px] gap-y-[2px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[12px] py-[10px]">
          <dt className="font-semibold">문의자</dt>
          <dd>{d.contactName}</dd>
          <dt className="font-semibold">접수일시</dt>
          <dd>{dt(d.createdAt)}</dd>
        </dl>
        <p className="mt-[12px] font-semibold">삭제한 문의는 복구할 수 없습니다.</p>
      </ConfirmDialog>
      {/* 안내 한 줄 + 받는 주소 한 줄(2026-11-06 사용자 지정 — 전엔 「{이메일} 로 지금 저장된 답변을 한 번 더 보냅니다.」 · [보내기]).
          답변을 고쳐 저장하면 같은 창을 바로 띄운다 — 고친 답변은 메일로 저절로 가지 않는다(2026-11-06 사용자 지정) */}
      <ConfirmDialog
        open={confirmResend && c.can.update}
        title={afterEdit === "wait" ? "수정한 답변은 1분 후 재발송할 수 있습니다." : afterEdit ? "수정한 답변을 재발송하시겠습니까?" : "답변 메일을 다시 발송하시겠습니까?"}
        confirmLabel={afterEdit === "wait" ? "확인" : "재발송"}
        cancelLabel={afterEdit === "wait" ? null : afterEdit ? "나중에" : "취소"}
        busy={c.busy}
        onConfirm={afterEdit === "wait" ? closeResend : resend}
        onCancel={closeResend}
      >
        {afterEdit === "wait" ? (
          <>
            {/* 마지막 답변 메일이 1분 안이라 지금은 못 보낸다 — 이유와 할 일(2026-11-06 사용자 지정) */}
            <p>답변 메일은 1분에 한 번만 발송할 수 있습니다.</p>
            <p>1분 후 [답변 메일 재발송]을 눌러 아래 이메일 주소로 발송해 주세요.</p>
          </>
        ) : afterEdit ? (
          <>
            {/* 두 문장을 줄을 나눠 둔다(2026-11-06 사용자 지정) */}
            <p>수정한 답변은 문의자에게 자동으로 발송되지 않습니다.</p>
            <p>아래 이메일 주소로 지금 재발송할 수 있습니다.</p>
          </>
        ) : (
          <p>저장된 답변을 아래 이메일 주소로 다시 발송합니다.</p>
        )}
        <p className="mt-[6px] font-semibold break-all text-erp-ink">{d.email}</p>
      </ConfirmDialog>
    </Frame>
  );
}
