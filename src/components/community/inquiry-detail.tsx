"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, DetailValues, PageBar, Tag, Textarea, useToast, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
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
// 왼쪽은 문의 내용 · 답변 · 운영자 메모, 오른쪽은 보낸 곳(문의자) · 처리 이력이다. 바꾸는 동작은 서버 액션이 하고, 성공하면 router.refresh() 로 최신 상세를 받는다.
// 쓰던 답변 · 메모는 입력칸이 아니라 useCommon 의 drafts 가 쓰기 시작할 때 저장돼 있던 값(base)과 함께 쥔다 — 다른 동작 · 최신
// 불러오기(409 포함)로 화면이 다시 그려져도 남고, 그 칸을 저장하는 데 성공하거나 [취소]하면 비운다(front #75 리뷰). 그사이 다른 운영자가
// 그 칸을 저장했으면 손대지 않은 글은 버리고, 고쳐 쓰던 글은 남기되 새로 저장된 값을 함께 보인다(draftView, front #87 리뷰).
// 그사이 다른 운영자가 저장했으면(409) 까닭을 띠에 보이고 최신 내용을 다시 불러온다(#274). 그사이 지워졌으면(404) 목록으로 간다. 세션이 끊겨도(401) 화면을 옮기지 않고 띠로만 알린다(공지 폼과 같다).
// 문의사항 답변은 이력이 남고(고치면 새 답변을 더함, 「수정됨 · 이전 답변」), 도입문의 답변은 하나를 덮어쓴다(CNT-17 v144).

const ANSWER_MAX = 20_000;
const MEMO_MAX = 2_000;
const ANSWERED_TOAST = "답변을 저장했습니다. 상태가 답변 완료로 바뀌었습니다.";
const EDITED_TOAST = "답변을 고쳤습니다. 문의자에게 알림은 다시 가지 않습니다.";

const dt = formatDateTime;
const Note = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
/** 쓰던 글이 그사이 저장된 값과 어긋났다는 알림(front #87 리뷰). */
const Stale = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-off">{children}</p>;
const Prose = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.7] whitespace-pre-wrap break-keep text-erp-ink">{children}</p>;
const Meta = ({ children }: { children: ReactNode }) => <p className="text-[13px] text-erp-label">{children}</p>;
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-muted">{children}</span>;

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box). 글 · 입력은 안쪽 여백, 표만 든 상자(처리 이력)는 flush 로 여백 없이.
function Box({ title, hint, flush, children }: { title: ReactNode; hint?: string; flush?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {hint && <span className="text-[14px] font-normal text-erp-label">{hint}</span>}
      </h3>
      {flush ? children : <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div>}
    </section>
  );
}

/** 처리 이력 한 줄 — [단계, 내용, 끝났는가]. */
type Step = [string, string, boolean];
const STEP_COLUMNS: Column<Step>[] = [
  { header: "단계", width: "w-[150px]", cell: (s) => s[0] },
  { header: "내용", align: "left", cell: (s) => s[1] },
  { header: "상태", width: "w-[80px]", cell: (s) => (s[2] ? <Badge tone="on">완료</Badge> : <Badge tone="off">대기</Badge>) },
];

/** 접수 · 확인 · 답변. 「확인」은 처리중을 거친 건만 완료로 그리고, 처리 시작 없이 바로 답한 건은 줄을 숨긴다(#274). */
function steps(d: InquiryDetail | LeadDetail, answered: string | null): Step[] {
  const confirm: Step[] = d.processingStartedAt
    ? [["확인", `${dt(d.processingStartedAt)} · ${d.processingStartedByName ?? "-"} · 처리중으로 바꿈`, true]]
    : d.status === "RECEIVED"
      ? [["확인", "[처리 시작]을 누르면 처리중 · 시각 · 운영자가 남음", false]]
      : [];
  return [["접수", dt(d.createdAt), true], ...confirm, answered ? ["답변", answered, true] : ["답변", "저장하면 답변 완료 · 그 뒤에도 고칠 수 있음", false]];
}

function History({ rows }: { rows: Step[] }) {
  return (
    <Box title="처리 이력" flush>
      <DataTable columns={STEP_COLUMNS} rows={rows} rowKey={(s) => s[0]} />
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
    <div role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      {errors.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}

/** 본문 첫 줄 「○○ 상세」 + 상태 + 오른쪽 끝 버튼, 아래 7:5 두 단(데모 detailHead · cols). */
function Frame({ title, status, buttons, errors, left, right, children }: { title: string; status: ReactNode; buttons: ReactNode; errors: string[]; left: ReactNode; right: ReactNode; children?: ReactNode }) {
  return (
    <>
      <PageBar title={title} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex items-center gap-[6px]">
            <h2 className="flex flex-1 items-center gap-[8px] text-[18px] font-semibold text-erp-ink">
              {title} 상세 {status}
            </h2>
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

const StatusBadge = ({ status, statuses }: { status: InquiryDetail["status"]; statuses: EnumValue[] }) =>
  status === "ANSWERED" ? <Badge tone="on">{labelOf(statuses, status)}</Badge> : status === "IN_PROGRESS" ? <Tag>{labelOf(statuses, status)}</Tag> : <Badge tone="off">{labelOf(statuses, status)}</Badge>;

/**
 * 답변 상자. 답변 전이면 입력칸, 답변 완료면 읽기 + 「답변 수정」(CNT-17). 쓰던 글(draft)이 있으면 입력칸을 연다 — 저장에 성공하거나
 * [취소]하면 draft 가 비어 읽기로 돌아간다. 그사이 다른 운영자가 답변을 저장했으면 위 읽기(view)에 새 답변이 서고 입력칸 아래에 알린다.
 * view 는 답변 완료일 때 위에 늘 보일 읽기 내용(본문 · 시각 · 메일 결과 등)이다. actions 는 읽기일 때 「답변 수정」 옆에 둘 버튼이다 —
 * 고치는 동안에는 숨는다. 그때 누르면 화면에서 고치던 글이 아니라 이미 저장된 답변이 나가기 때문이다.
 */
function AnswerBox({
  hint,
  current,
  view,
  actions,
  placeholder,
  firstNote,
  editNote,
  busy,
  onSave,
  draft,
  onDraft,
}: {
  hint: string;
  current: string | null;
  view: ReactNode;
  actions?: ReactNode;
  placeholder: string;
  firstNote: string;
  editNote: string;
  busy: boolean;
  onSave: (body: string) => void;
  /** 쓰던 답변. 없으면(undefined) 저장된 답변을 읽기로 보인다. */
  draft: Draft | undefined;
  /** 쓰던 글을 바꾼다. base 는 지금 저장된 값 — 새로 쓰기 시작할 때만 남는다. undefined 면 비운다. */
  onDraft: (text: string | undefined, base: string) => void;
}) {
  const saved = current ?? "";
  const shown = draftView(draft, saved);
  const editing = shown.text !== undefined || current === null;
  const text = shown.text ?? saved;
  return (
    <Box title="답변" hint={hint}>
      {current !== null && view}
      {editing ? (
        <>
          <Textarea rows={6} value={text} maxLength={ANSWER_MAX} placeholder={placeholder} aria-label="답변 내용" onChange={(e) => onDraft(e.target.value, saved)} />
          {shown.stale && <Stale>그사이 다른 운영자가 답변을 저장했습니다(위). 확인한 뒤 고쳐 저장하거나 [취소]하세요.</Stale>}
          <div className="flex items-center gap-[12px]">
            <div className="flex-1">
              <Note>{current === null ? firstNote : editNote}</Note>
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
        <div className="flex items-center gap-[6px]">
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
  onSave,
  draft,
  onDraft,
}: {
  memo: string | null;
  busy: boolean;
  onSave: (memo: string) => void;
  draft: Draft | undefined;
  onDraft: (text: string | undefined, base: string) => void;
}) {
  const saved = memo ?? "";
  const shown = draftView(draft, saved);
  const text = shown.text ?? saved;
  return (
    <Box title="운영자 메모" hint="문의자에게 보이지 않습니다">
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
      <Textarea rows={4} value={text} maxLength={MEMO_MAX} aria-label="내부 기록" onChange={(e) => onDraft(e.target.value, saved)} />
      <div className="flex items-center gap-[12px]">
        <div className="flex-1">
          <Note>다른 운영자와 함께 봅니다. 비우고 저장하면 지웁니다.</Note>
        </div>
        <Button variant="soft" disabled={busy} onClick={() => onSave(text)}>
          메모 저장
        </Button>
      </div>
    </Box>
  );
}

/** 처리 시작 · 답변 · 메모 — 두 상세가 같다. */
function useCommon(target: Target, id: number, updatedAt: string, answered: boolean) {
  // 쓰던 답변 · 메모. 저장에 성공하면 그 칸만 비우고 최신 상세를 받는다.
  const [drafts, setDrafts] = useState<{ answer?: Draft; memo?: Draft }>({});
  // 409 안내의 「그대로 두었다」는 실제로 고쳐 쓰던 글이 있을 때만.
  const edited = (["answer", "memo"] as const).some((f) => drafts[f] && drafts[f].text !== drafts[f].base);
  const act = useAct(target === "inquiry" ? INQUIRY_BASE : LEAD_BASE, edited);
  const { run, setErrors } = act;
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
    drafts,
    setDraft,
    startProcessing: () => run(() => startProcessingAction(target, id), "처리중으로 바꿨습니다."),
    saveReply: (body: string) => {
      if (!body.trim()) return setErrors(["답변을 입력해 주세요"]);
      run(() => saveReplyAction(target, id, body, updatedAt), answered ? EDITED_TOAST : ANSWERED_TOAST, saved("answer"));
    },
    saveMemo: (memo: string) => run(() => saveMemoAction(target, id, memo, updatedAt), "saved", saved("memo")),
  };
}

export function InquiryDetailView({ detail: d, statuses }: { detail: InquiryDetail; statuses: EnumValue[] }) {
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const roleLabel = useCodeLabel("ROLE_TYPE");
  const answered = d.replies.length > 0;
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
      <Box title={d.title} hint={`${categoryLabel(d.inquiryCategoryCode)} · ${dt(d.createdAt)} 접수`}>
        <Prose>{d.body}</Prose>
        {/* 첨부(CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 크기. 누르면 내려받는다. */}
        {d.attachments.length > 0 && (
          <DetailTable
            title="첨부파일"
            rows={d.attachments.map((a) => ({
              label: a.fileType === "PDF" ? "PDF" : "이미지",
              multiline: !!a.thumbnailUrl,
              value: (
                <button type="button" disabled={c.busy} onClick={() => download(a.inquiryAttachmentId)} title={`${a.fileName} 내려받기`} className="flex min-w-0 items-center gap-[10px] text-left">
                  {a.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
                    <img src={a.thumbnailUrl} alt="" className="size-[64px] shrink-0 rounded-[2px] border border-erp-panel-line object-cover" />
                  )}
                  <span className="truncate text-erp-link hover:underline">{a.fileName}</span>
                  <Sub>{sizeLabel(a.sizeBytes)}</Sub>
                </button>
              ),
            }))}
          />
        )}
      </Box>
      <AnswerBox
        hint="문의한 사람에게 보입니다"
        current={last?.body ?? null}
        view={
          last && (
            <>
              <Prose>{last.body}</Prose>
              <Meta>
                {previous.length ? "수정됨 · " : ""}
                {dt(last.repliedAt)} · {last.repliedByName ?? "-"}
              </Meta>
              {previous.length > 0 && (
                <details className="rounded-[2px] border border-erp-panel-line">
                  <summary className="flex h-[34px] cursor-pointer items-center px-[12px] text-[14px] font-medium text-erp-ink [&::-webkit-details-marker]:hidden">이전 답변 {previous.length}개</summary>
                  <div className="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]">
                    {previous.map((r) => (
                      <div key={r.inquiryReplyId} className="flex flex-col gap-[4px]">
                        <Meta>
                          {dt(r.repliedAt)} · {r.repliedByName ?? "-"}
                        </Meta>
                        <Prose>{r.body}</Prose>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )
        }
        placeholder="문의한 분이 그대로 읽습니다. 어떤 화면에서 무엇을 하면 되는지 적어 주세요."
        firstNote="저장하면 상태가 즉시 답변 완료로 바뀌고 문의자에게 알림함과 메일로 알립니다. 처리 시작을 거치지 않고 바로 답해도 됩니다."
        editNote="고쳐도 상태는 답변 완료 그대로입니다. 문의자에게 알림은 다시 가지 않습니다."
        busy={c.busy}
        onSave={c.saveReply}
        draft={c.drafts.answer}
        onDraft={c.setDraft("answer")}
      />
      <MemoBox memo={d.internalMemo} busy={c.busy} onSave={c.saveMemo} draft={c.drafts.memo} onDraft={c.setDraft("memo")} />
    </>
  );

  const right = (
    <>
      <DetailTable
        title="보낸 곳"
        rows={[
          { label: "이름", value: d.senderName ?? "-" },
          { label: "역할", value: d.senderRoleTypeCode ? roleLabel(d.senderRoleTypeCode) : "-" },
          { label: "BP", value: d.bpName ?? "-" },
          { label: "점포", value: d.storeName ?? <Sub>BP 단위 문의</Sub> },
        ]}
      />
      <History
        rows={steps(d, first && last ? `${dt(first.repliedAt)} · ${first.repliedByName ?? "-"}${previous.length ? ` · ${dt(last.repliedAt)} ${last.repliedByName ?? "-"} 수정` : ""}` : null)}
      />
    </>
  );

  return (
    <Frame
      title="문의사항"
      status={<StatusBadge status={d.status} statuses={statuses} />}
      errors={c.errors}
      left={left}
      right={right}
      buttons={
        <div className="flex items-center gap-[6px]">
          {d.status === "RECEIVED" && (
            <Button variant="soft" disabled={c.busy} onClick={c.startProcessing}>
              처리 시작
            </Button>
          )}
          <Button variant="off" href={INQUIRY_BASE}>
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
  const c = useCommon("lead", d.leadId, d.updatedAt, answered);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
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
      setConfirmResend(false);
      const result = await call(() => resendLeadReplyMailAction(d.leadId));
      if (!result.ok) return c.fail(result);
      if (result.mail.replyMailResult === "SUCCEEDED") {
        c.setErrors([]);
        c.toast("답변 메일을 다시 보냈습니다.");
      } else c.setErrors(["답변 메일을 보내지 못했습니다. 잠시 뒤 다시 보내 주세요."]);
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
      <Box title={`${d.contactName} · ${industry}`} hint={`${dt(d.createdAt)} 접수`}>
        <Prose>{d.body}</Prose>
      </Box>
      <AnswerBox
        hint="적어 준 이메일로 나갑니다"
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
          <Button variant="soft" disabled={c.busy || d.status !== "ANSWERED"} onClick={() => setConfirmResend(true)}>
            답변 메일 다시 보내기
          </Button>
        }
        placeholder="계정이 없는 분이라 이 내용이 메일로 그대로 갑니다."
        firstNote="저장하면 상태가 답변 완료로 바뀌고 오늘이 상담 완료일로 남습니다. 처음 저장할 때만 문의자 이메일로 답변이 갑니다."
        editNote="고치면 지금 답변을 덮어씁니다. 상태는 답변 완료 그대로이고 운영 알림 · 메일은 다시 가지 않습니다."
        busy={c.busy}
        onSave={c.saveReply}
        draft={c.drafts.answer}
        onDraft={c.setDraft("answer")}
      />
      <MemoBox memo={d.internalMemo} busy={c.busy} onSave={c.saveMemo} draft={c.drafts.memo} onDraft={c.setDraft("memo")} />
    </>
  );

  // 상호 · 사업자등록번호 · 점포 수는 접수 때 받지 않는다(WHALEERP-288).
  const right = (
    <>
      <DetailTable
        title="문의자"
        rows={[
          { label: "이름", value: d.contactName },
          { label: "업종", value: industry },
          { label: "전화번호", value: formatPhone(d.phone) },
          { label: "이메일", value: d.email },
        ]}
      />
      <DetailTable
        title="도입 문의 내용"
        rows={[
          { label: "관심 서비스", value: <DetailValues items={d.interests.map((i) => labelOf(interests, i))} /> },
          { label: "도입 예정 시기", value: d.planPeriodCode ? planLabel(d.planPeriodCode) : <Sub>선택하지 않음</Sub> },
          { label: "개인정보 동의", value: `동의 · ${dt(d.privacyAgreedAt)}` },
          { label: "마케팅 수신", value: d.marketingAgreedAt ? `동의 · ${dt(d.marketingAgreedAt)}` : <Sub>동의하지 않음</Sub> },
        ]}
      />
      <div className="flex flex-col gap-[12px]">
        <DetailTable
          title="보관"
          rows={[
            { label: "상담 완료일", value: d.consultedDate ?? <Sub>답변을 저장하는 날 남습니다</Sub> },
            { label: "파기 예정", value: purge || <Sub>상담 완료일로부터 1년</Sub> },
          ]}
        />
        <Note>
          {deletable
            ? "상담하지 않은 건은 [삭제]로 지웁니다. 지우면 기록이 남지 않습니다."
            : d.consultedDate
              ? "상담을 마친 건이라 지울 수 없고, 상담 완료일로부터 1년 뒤 배치가 파기합니다."
              : "답변을 마친 건이라 지울 수 없습니다."}
        </Note>
      </div>
      <History rows={steps(d, d.repliedAt && `${dt(d.repliedAt)} · ${d.repliedByName ?? "-"}`)} />
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
          {deletable && (
            <Button variant="soft" disabled={c.busy} onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )}
          {d.status === "RECEIVED" && (
            <Button variant="soft" disabled={c.busy} onClick={c.startProcessing}>
              처리 시작
            </Button>
          )}
          <Button variant="off" href={LEAD_BASE}>
            목록
          </Button>
        </div>
      }
    >
      <ConfirmDialog open={confirmDelete} title="도입문의를 삭제하시겠습니까?" confirmLabel="삭제" confirmVariant="danger" busy={c.busy} onConfirm={remove} onCancel={() => setConfirmDelete(false)}>
        {d.contactName} · {dt(d.createdAt)} 접수 건을 지웁니다. 지우면 기록이 남지 않고 되돌릴 수 없습니다.
      </ConfirmDialog>
      <ConfirmDialog open={confirmResend} title="답변 메일을 다시 보내시겠습니까?" confirmLabel="보내기" busy={c.busy} onConfirm={resend} onCancel={() => setConfirmResend(false)}>
        {d.email} 로 지금 저장된 답변을 한 번 더 보냅니다.
      </ConfirmDialog>
    </Frame>
  );
}
