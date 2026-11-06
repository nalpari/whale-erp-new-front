"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode, useEffect } from "react";
import { AttachmentField, Badge, Button, Checkbox, ConfirmDialog, DateField, FieldMessage, NoticeBand, PageBar, RequiredMark, Select, Tag, Textarea, TextField, Toggle, useFilePreviews, useToast } from "@/components/common";
import { useCodes, usePagePermission } from "@/components/site/session-gate";
import { bff, BffError, PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import type { PostDetail } from "@/lib/community";
import {
  AUDIENCES,
  BODY_MAX,
  faqBody,
  FILE_ACCEPT,
  MAX_ATTACHMENTS,
  PASSWORD_REQUIRED_PREFIX,
  pickInquiryFiles,
  POST_BASE,
  postFields,
  SESSION_EXPIRED,
  TITLE_MAX,
  postFieldErrors,
  type PostField,
  type Audience,
  type PostForm as Form,
  type PostKind,
  type PostStatus,
} from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { kstToday } from "@/lib/staff-members";
import { deletePostAction, saveFaqAction, type SaveResult } from "@/lib/community-actions";
import { NOTICE_SAVE_ROUTE } from "@/lib/paper-request";

// 공지사항 · FAQ 등록 · 수정(#276, 목업 support/notice-edit.html, 데모 support/notice-edit · faq-edit). 플랫폼 관리자 전용.
// 공지 · FAQ 는 메뉴가 달라 화면을 나눴고(2026-10-02 재영) 이 폼을 함께 쓴다 — FAQ 에서는 상단 고정 · 게시 기간 · 첨부를 감춘다.
// 저장은 버튼으로 게시 상태를 정한다(게시 · 임시저장 · 비공개). 성공하면 토스트를 띄우고 이 화면에 머문다.
// 공지사항은 첨부 때문에 라우트 핸들러(platform-notices/save)로 multipart 를, FAQ 는 서버 액션으로 JSON 을 보낸다(api 가 FAQ 는 JSON 만 받는다).
// 실패하면 입력값을 그대로 두고 폼 위 빨간 띠에 까닭을 보인다. 그사이 누가 고쳤으면(409) 최신 내용을 다시 불러오게 한다.

// 저장 토스트 — 짧게 동작만(2026-11-06 사용자 지정 — 전엔 비공개가 「비공개로 저장했습니다.」)
const SAVED_TOAST: Record<PostStatus, string> = { PUBLISHED: "게시했습니다.", DRAFT: "임시저장했습니다.", PRIVATE: "비공개로 변경했습니다." };
// 노출 대상 옆 설명(데모와 같다). 비회원은 설명 대신 아래 안내가 붙는다.
// 노출 대상 설명 — 「이름 : 설명」(2026-11-06 사용자 지정), 실제로 보는 곳 · 권한유형(api published-posts BP_ROLES · STORE_ROLES)을 적는다(2026-11-06 사용자 지정 — 전엔 「사업자 관리자」 · 「점포 단위 관리자」)
const AUDIENCE_HINT: Partial<Record<Audience, ReactNode>> = {
  GUEST: "로그인전 홈화면",
  // 회원이 BP · 점포를 품는다는 것을 밑줄로(2026-11-06 사용자 지정)
  MEMBER: (
    <>
      <u>BP · 점포 포함</u> 로그인한 모든 사용자
    </>
  ),
  BP: "BP마스터, BP관리자",
  STORE: "가맹마스터, 가맹관리자",
};


/**
 * 변경이력 두 줄 — 「등록 | 등록 시각」, 「최종수정 | 시각 · 수정자 [상태]」. 이름 칸 폭을 같게 둬 구분선 · 시각 시작선을 맞춘다
 * (문의사항 상세 처리이력 답변 줄과 같은 모양, 2026-11-06 사용자 지정). api 는 중간 수정 · 상태 변경을 남기지 않고 마지막 수정만 덮어쓴다(WHALEERP-272).
 * 등록자 이름은 상세 응답에 없어 시각만 둔다. 상태는 게시만 파랑 배지, 임시저장 · 비공개는 회색 꼬리표(목록과 같다)
 */
function HistoryLines({ detail, statuses }: { detail?: PostDetail; statuses: EnumValue[] }) {
  const line = (label: string, body: ReactNode) => (
    <p className="flex min-w-0 items-center gap-[10px] text-[14px] leading-[1.6] text-erp-ink">
      <span className="w-[56px] shrink-0 text-erp-label">{label}</span>
      {/* #d9d9d9 — DESIGN.md 의 값 구분선 */}
      <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
      <span className="flex min-w-0 items-center gap-[8px]">{body}</span>
    </p>
  );
  return (
    <div className="flex flex-col gap-[6px]">
      {/* 등록 화면은 아직 저장 전이라 「-」 — 상자 자리는 수정 화면과 같게 둔다(2026-11-06 사용자 지정) */}
      {line("등록", detail ? formatDateTime(detail.createdAt) : "-")}
      {line(
        "최종수정",
        !detail ? (
          "-"
        ) : (
        <>
          {formatDateTime(detail.updatedAt)}
          {detail.updatedByName && ` · ${detail.updatedByName}`}
          {detail.status === "PUBLISHED" ? <Badge tone="on">{labelOf(statuses, detail.status)}</Badge> : <Tag>{labelOf(statuses, detail.status)}</Tag>}
        </>
        ),
      )}
    </div>
  );
}

function formOf(kind: PostKind, d: PostDetail | undefined): Form {
  return {
    kind,
    title: d?.title ?? "",
    body: d?.body ?? "",
    noticeType: d?.noticeType ?? "",
    isPinned: d?.isPinned ?? false,
    publishStartDate: d?.publishStartDate ?? "",
    publishEndDate: d?.publishEndDate ?? "",
    faqCategoryCode: d?.faqCategoryCode ?? "",
    audiences: (d?.audiences ?? []).filter((a): a is Audience => (AUDIENCES as readonly string[]).includes(a)),
  };
}

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box — 알림 템플릿 편집과 같은 모양).
/** title 이 없으면 제목 줄 없이 상자만 — 「내용」 상자는 칸 라벨이 스스로 말해 제목을 뺐다(2026-11-06 사용자 지정) */
function Box({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      {title && <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">{title}</h3>}
      <div className={`flex flex-col gap-[24px] border border-erp-thead-line bg-white p-[16px] ${title ? "rounded-b-[2px]" : "rounded-[2px]"}`}>{children}</div>
    </section>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
/**
 * 칸 이름. strong — 제목 줄을 뺀 「내용」 상자의 칸(유형 · 제목 · 본문 · 첨부파일)은 다른 상자 제목(노출 대상 등)과 같은 16px 500 먹색으로 키운다
 * (2026-11-06 사용자 지정 — 전엔 14px 회색). 게시 기간도 같은 크기로 맞췄다(2026-11-06 사용자 지정).
 */
const Label = ({ children, count, strong = false, required = false, help }: { children: ReactNode; count?: { now: number; max: number }; strong?: boolean; required?: boolean; help?: { title: string; value: string } }) => (
  <span className={`flex items-center ${strong ? "text-[16px] font-medium text-erp-ink" : "text-[14px] font-medium text-erp-label"}`}>
    {children}
    {/* 필수 칸(유형 · 제목 · 본문)은 이름 뒤 붉은 * — 공통 Field 와 같은 표시(2026-11-06 사용자 지정). 화면 읽기는 aria-required 로 안다 */}
    {required && <RequiredMark />}
        {help && (
      // 값의 출처 — 문의사항 상세 머리 줄 「분류 [꼬리표]」와 같은 모양: 회색 14px 500 이름 + 꼬리표(Tag) 값, 라벨 줄 오른쪽 끝(2026-11-06 사용자 지정)
      <span className="ml-auto flex items-center gap-[6px] pl-[10px] text-[14px] font-medium text-erp-label">
        {help.title} <Tag>{help.value}</Tag>
      </span>
    )}
    {count && (
      <span className={`ml-[6px] text-[12px] font-normal ${count.now > count.max ? "text-erp-off" : "text-erp-muted"}`}>
        {count.now.toLocaleString("ko-KR")} / {count.max.toLocaleString("ko-KR")}
      </span>
    )}
  </span>
);

export function PostForm({
  kind,
  detail,
  statuses,
  noticeTypes,
  audiences,
}: {
  kind: PostKind;
  detail?: PostDetail;
  statuses: EnumValue[];
  noticeTypes: EnumValue[];
  audiences: EnumValue[];
}) {
  const router = useRouter();
  const toast = useToast();
  const faqCategories = useCodes("FAQ_CATEGORY");
  const [form, setForm] = useState<Form>(() => formOf(kind, detail));
  /** 새로 더할 파일. key 는 같은 이름 파일을 둘 올려도 줄을 가르려고 붙인다. */
  const [files, setFiles] = useState<{ key: number; file: File }[]>([]);
  // 고를 때 뺀 파일과 까닭 — 문의하기 패널과 같다(10MB 초과 · 형식 · 개수, 2026-11-06 사용자 지정)
  const [rejected, setRejected] = useState<{ name: string; reason: string }[]>([]);
  /** 뺄 기존 첨부 */
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  // 저장 전 검사에 걸린 칸 — 그 칸 바로 아래 8px 에 문구로만 보인다(칸 테두리는 칠하지 않는다, BP 관리자 등록 패널과 같은 자리). 칸을 고치면 그 칸 것만 내린다(공통 정책 PL-SPGSWC, 2026-11-06 사용자 지정 — 전엔 화면 위 띠에 모아 보였다)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PostField, string[]>>>({});
  const clearField = (field: PostField) => setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  const fieldMessage = (field: PostField) => fieldErrors[field]?.join("\n");
  const [stale, setStale] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, startTransition] = useTransition();
  const errorRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(0);

  // 저장(게시 · 임시저장 · 비공개)은 등록 화면이면 등록, 수정 화면이면 수정 권한이다. 삭제는 삭제 권한. 권한이 빠지면 저장 버튼 · 첨부
  // 고르기 · 빼기와 열려 있던 삭제 확인창을 거둔다 — 막는 것은 api 다(create · update · delete). 입력칸은 잠그지 않는다(안내 띠가 알린다).
  const can = usePagePermission();
  const canSave = detail ? can.update : can.create;
  const notice = kind === "NOTICE";
  const name = notice ? "공지사항" : "FAQ";
  const listHref = POST_BASE[kind];
  const kept = (detail?.attachments ?? []).filter((a) => !removeIds.includes(a.postAttachmentId));
  // 칸을 고치면 그 칸에 걸린 오류를 내린다
  const FIELD_OF: Partial<Record<keyof Form, PostField>> = {
    noticeType: "type",
    faqCategoryCode: "type",
    title: "title",
    body: "body",
    publishStartDate: "period",
    publishEndDate: "period",
    audiences: "audiences",
  };
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const field = FIELD_OF[key];
    if (field) clearField(field);
  };
  // 회원은 로그인한 모든 관리자라 BP · 점포를 품는다 — 회원을 찍으면 BP · 점포도 찍는다(api 도 회원이면 BP · 점포 계정에 보인다, 2026-11-06 사용자 지정).
  // 회원을 풀면 BP · 점포도 함께 푼다(2026-11-06 사용자 지정)
  const COVERED_BY_MEMBER: readonly Audience[] = ["BP", "STORE"];
  const toggleAudience = (a: Audience, on: boolean) => {
    const next = AUDIENCES.filter((x) => {
      if (x === a) return on;
      if (a === "MEMBER" && COVERED_BY_MEMBER.includes(x)) return on;
      // 회원이 찍힌 채 BP · 점포 중 하나를 풀면 회원도 푼다 — 회원은 BP · 점포를 품어서, 남겨 두면 푼 쪽도 공지를 본다
      if (x === "MEMBER" && !on && COVERED_BY_MEMBER.includes(a)) return false;
      return form.audiences.includes(x);
    });
    // BP · 점포를 모두 찍으면 회원도 찍는다(2026-11-06 사용자 지정) — 체크 상자 묶음의 「전체」처럼 움직인다
    const allCovered = COVERED_BY_MEMBER.every((x) => next.includes(x));
    set("audiences", allCovered && COVERED_BY_MEMBER.includes(a) && !next.includes("MEMBER") ? AUDIENCES.filter((x) => x === "MEMBER" || next.includes(x)) : next);
  };

  const showErrors = (messages: string[], isStale = false) => {
    setErrors(messages);
    setStale(isStale);
    // 비밀번호 강제 변경 403 이면 SessionGate 가 변경 팝업을 다시 띄운다(BFF 와 같은 이벤트).
    if (messages[0]?.startsWith(PASSWORD_REQUIRED_PREFIX)) dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
    // 띠가 화면 밖일 수 있어 띠로 올려 보인다.
    if (messages.length) requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: "nearest" }));
  };

  /** 서버 액션 호출 자체가 실패하면(연결 끊김 · 배포로 액션이 바뀜) 오류 화면으로 넘기지 않고 띠로 알린다 — 입력값을 지킨다. */
  const callAction = async <T,>(act: () => Promise<T>): Promise<T | { ok: false; messages: string[] }> => {
    try {
      return await act();
    } catch (e) {
      console.error("공지사항 · FAQ 서버 액션 실패", e);
      return { ok: false, messages: ["서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요."] };
    }
  };

  const save = (status: PostStatus) => {
    // 시작일은 화면이 지어내지 않는다 — 비우면 비운 채 보내 api 가 등록 일시를 게시일로 쓴다. 브라우저 시계로 채우면 PC 시계가 앞선 날
    // 게시한 공지가 사용자 화면에서 빠지고, 내렸다 다시 게시하면 게시일이 바뀌었다(ip-code-review 블로커, 2026-11-06). 게시일은 칸 아래에 보인다
    const sending = form;
    // 시작일이 비었을 때 견줄 게시일 — 지금 게시 중인 글은 등록일, 새 글 · 임시저장 · 비공개는 지금 게시하는 오늘(검사에만 쓴다, 리뷰 반영)
    const postedDate = detail?.status === "PUBLISHED" ? formatDateTime(detail.createdAt).slice(0, 10) : kstToday();
    const found = postFieldErrors(sending, status, kept.length, files.map((f) => f.file), postedDate);
    if (found.length) {
      const next: Partial<Record<PostField, string[]>> = {};
      for (const [field, message] of found) next[field] = [...(next[field] ?? []), message];
      setFieldErrors(next);
      setErrors([]);
      // 첫 오류 칸이 보이게 — 칸에 단 data-post-field 로 찾는다
      requestAnimationFrame(() => document.querySelector(`[data-post-field="${found[0][0]}"]`)?.scrollIntoView({ block: "center" }));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const edit = detail ? { postId: detail.postId, updatedAt: detail.updatedAt } : null;
      const result: SaveResult = notice ? await sendNotice(sending, status) : await callAction(() => saveFaqAction(edit, faqBody(sending, status)));
      if (!result.ok) {
        // 세션이 끊겼으면(401) 화면을 옮기지 않고 띠로만 알린다 — 고치던 내용이 남는다. 쿠키는 핸들러 · 액션이 지웠다.
        // 그사이 다른 관리자가 고쳤거나 지웠다(409) — 덮어쓰지 않고 최신 내용을 다시 불러오게 한다.
        return showErrors(result.messages, result.status === 409);
      }
      toast(SAVED_TOAST[status]);
      if (!detail) return router.replace(`${listHref}/${result.detail.postId}`);
      // 화면은 updatedAt 을 key 로 다시 그려 저장된 값 · 첨부로 새로 시작한다(post-page.tsx).
      router.refresh();
    });
  };

  /** 공지사항 — api 칸 + 첨부를 multipart 로. 핸들러가 api 와 같은 상태 코드로 상세나 { messages } 를 준다. */
  const sendNotice = async (sending: Form, status: PostStatus): Promise<SaveResult> => {
    const data = new FormData();
    for (const [key, value] of postFields(sending, status)) data.append(key, value);
    if (detail) {
      data.set("postId", String(detail.postId));
      data.set("updatedAt", detail.updatedAt);
      for (const id of removeIds) data.append("removeAttachmentIds", String(id));
    }
    for (const { file } of files) data.append("files", file);
    let res: Response;
    try {
      res = await fetch(NOTICE_SAVE_ROUTE, { method: "POST", body: data });
    } catch {
      return { ok: false, messages: ["서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 저장해 주세요."] };
    }
    const body = (await res.json().catch(() => null)) as (PostDetail & { messages?: string[] }) | null;
    if (res.ok && body) return { ok: true, detail: body };
    // proxy 가 먼저 막은 401 은 본문이 { message } 라 문구를 여기서 정한다.
    if (res.status === 401) return { ok: false, status: 401, messages: [SESSION_EXPIRED] };
    return { ok: false, status: res.status, messages: body?.messages ?? [`저장하지 못했습니다 (HTTP ${res.status}). 잠시 뒤 다시 저장해 주세요.`] };
  };

  const handleDelete = () =>
    detail &&
    startTransition(async () => {
      setConfirmDelete(false);
      const result = await callAction(() => deletePostAction(kind, detail.postId));
      if (!result.ok) return showErrors(result.messages);
      toast("삭제했습니다.");
      router.push(listHref);
    });

  // 첨부 내려받기 — 5분짜리 서명 주소라 누를 때마다 새로 받는다.
  const download = (attachmentId: number) =>
    detail &&
    startTransition(async () => {
      try {
        const { url } = await bff<{ url: string }>(`${listHref}/${detail.postId}/attachments/${attachmentId}/download-url`);
        window.location.assign(url);
      } catch (e) {
        showErrors([e instanceof BffError ? (e.status === 401 ? SESSION_EXPIRED : e.message) : "첨부파일을 받지 못했습니다."]);
      }
    });

  // 그림 첨부 미리보기 — 문의사항 상세 첨부처럼 64px 썸네일을 이름 앞에 둔다(2026-11-06 사용자 지정).
  // 새 파일은 브라우저 안 주소, 이미 올린 JPG · PNG 는 내려받기 주소(5분짜리 서명 주소)를 받아 쓴다. api 가 썸네일 주소를 주지 않아서다
  const newPreviews = useFilePreviews(files);
  const [keptPreviews, setKeptPreviews] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!detail) return;
    let alive = true;
    for (const a of detail.attachments) {
      if (a.fileType === "PDF") continue;
      bff<{ url: string }>(`${listHref}/${detail.postId}/attachments/${a.postAttachmentId}/download-url`)
        .then(({ url }) => alive && setKeptPreviews((prev) => ({ ...prev, [a.postAttachmentId]: url })))
        .catch((e) => console.warn("첨부 미리보기 주소를 받지 못했습니다", { postId: detail.postId, postAttachmentId: a.postAttachmentId }, e)); // 미리보기만 못 그린다 — 이름 · 내려받기는 그대로 쓴다
    }
    return () => {
      alive = false;
    };
  }, [detail, listHref]);

  const addFiles = (picked: File[]) => {
    // 형식 · 10MB 초과 · 5개 넘는 파일은 고를 때 바로 빼고 파일명 아래 까닭을 보인다 — 문의하기 패널과 같은 규칙(2026-11-06 사용자 지정,
    // 전엔 목록에 넣었다가 게시할 때에야 막았다)
    const { accepted, rejected: out } = pickInquiryFiles(kept.length + files.length, picked);
    if (accepted.length) setFiles((prev) => [...prev, ...accepted.map((file) => ({ key: nextKey.current++, file }))]);
    setRejected(out);
    clearField("attachments");
  };

  // 사용 중지된 카테고리의 FAQ 를 열면 고른 값이 목록에 없다 — 값을 그대로 두고 바꾸게 한다(api 가 게시 · 내용 수정 때 막는다).
  const categoryMissing = !!form.faqCategoryCode && !faqCategories.some((c) => c.value === form.faqCategoryCode);

  return (
    <>
      <PageBar title={detail ? `${name} 수정` : `${name} 등록`}>
        <div className="flex items-center gap-[6px]">
          <Button href={listHref}>
            목록
          </Button>
          {detail && can.delete && (
            <Button variant="soft" disabled={busy} onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )}
          {canSave && (
            <>
              <Button variant="soft" disabled={busy} onClick={() => save("PRIVATE")}>
                비공개
              </Button>
              <Button variant="soft" disabled={busy} onClick={() => save("DRAFT")}>
                임시저장
              </Button>
              <Button disabled={busy} onClick={() => save("PUBLISHED")}>
                게시
              </Button>
            </>
          )}
        </div>
      </PageBar>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {/* 저장 버튼이 없는 까닭을 알린다 — 막힌 실패가 아니라 조회만 가능 안내라 info 띠다(DESIGN.md Notice Band) */}
          {!canSave && (
            <NoticeBand
              tone="info"
              title={`${notice ? "공지사항을" : "FAQ 를"} ${detail ? "고칠" : "등록할"} 권한이 없습니다.`}
              detail={detail ? "고쳐도 저장할 수 없습니다." : "입력해도 저장할 수 없습니다."}
            />
          )}
          {errors.length > 0 && (
            <div ref={errorRef} role="alert" className="flex items-start gap-[12px] rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
              <div className="flex flex-1 flex-col gap-[4px]">
                {errors.map((m, i) => (
                  <p key={i}>{m}</p>
                ))}
                {stale && <p>최신 내용을 불러오면 지금 고친 내용은 사라집니다. 필요하면 먼저 옮겨 두세요.</p>}
              </div>
              {stale && (
                <Button variant="off" onClick={() => router.refresh()}>
                  최신 내용 불러오기
                </Button>
              )}
            </div>
          )}
          {/* 공지사항 — 왼쪽(유형 · 제목 · 본문 · 첨부) · 오른쪽(상단 고정 · 게시 기간 · 노출 대상) 상자 모두 묶음 사이 24px 로 같은 간격(18px 은 답답했다, 2026-11-06 사용자 지정), 두 상자의 위 시작선만 맞춘다
              (2026-11-06 사용자 지정 — 가로줄을 행 격자로 맞추니 오른쪽 묶음이 높은 행에서 왼쪽 간격이 벌어졌다). 최종수정은 오른쪽 상자 아래 */}
          {notice ? (
            <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
              <div className="col-start-1 row-start-1 flex flex-col gap-[24px] rounded-[2px] border border-erp-thead-line bg-white p-[16px]">
                <div className="flex flex-col gap-[24px]">
                  <div data-post-field="type" className="flex flex-col gap-[8px]">
                  <label className="flex flex-col gap-[8px]">
                    <Label strong required help={notice ? undefined : { title: "공통코드 그룹", value: "FAQ_CATEGORY" }}>{notice ? "유형" : "카테고리"}</Label>
                    {notice ? (
                      // 공지사항 유형 — 사용자 쪽 목록의 「구분」이 이것이다.
                      <Select value={form.noticeType} onChange={(e) => set("noticeType", e.target.value as Form["noticeType"])} aria-required>
                        <option value="">선택</option>
                        {noticeTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      // 카테고리는 공통코드 FAQ_CATEGORY 의 사용 중인 것만.
                      <Select value={form.faqCategoryCode} onChange={(e) => set("faqCategoryCode", e.target.value)} aria-required>
                        <option value="">선택</option>
                        {categoryMissing && <option value={form.faqCategoryCode}>{form.faqCategoryCode} (사용 중지)</option>}
                        {faqCategories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </label>
                  <FieldMessage id="post-type-error" message={fieldMessage("type")} />
                  </div>
                  {categoryMissing && <Note>사용 중지된 카테고리입니다. 게시하거나 내용을 고치려면 카테고리를 바꿔 주세요.</Note>}
                </div>
                <div data-post-field="title" className="flex flex-col gap-[8px]">
                <label className="flex flex-col gap-[8px]">
                  <Label strong required count={{ now: form.title.length, max: TITLE_MAX }}>{notice ? "제목" : "질문"}</Label>
                  <TextField value={form.title} onChange={(e) => set("title", e.target.value)} aria-required aria-describedby={fieldErrors.title ? "post-title-error" : undefined} />
                </label>
                <FieldMessage id="post-title-error" message={fieldMessage("title")} />
                </div>
                <div className="flex flex-col gap-[24px]">
                  <div data-post-field="body" className="flex flex-col gap-[8px]">
                  <label className="flex flex-col gap-[8px]">
                    <Label strong required count={{ now: form.body.length, max: BODY_MAX }}>{notice ? "본문" : "답변"}</Label>
                    <Textarea
                      rows={notice ? 12 : 10}
                      value={form.body}
                      onChange={(e) => set("body", e.target.value)}
                      // 공지 본문 안내는 입력칸 안에 — 아래 따로 두던 「본문은 글자 그대로 보입니다. …」 줄을 옮겼다(2026-11-06 사용자 지정)
                      placeholder={notice ? "공지사항 내용을 입력해 주세요.\nHTML 태그는 지원하지 않으며, 입력한 내용이 그대로 표시됩니다." : undefined}
                      aria-required
                      aria-describedby={fieldErrors.body ? "post-body-error" : undefined}
                    />
                  </label>
                  <FieldMessage id="post-body-error" message={fieldMessage("body")} />
                  </div>
                  {notice && (
                    <div data-post-field="attachments" className="flex flex-col gap-[8px]">
                      <Label strong count={{ now: kept.length + files.length, max: MAX_ATTACHMENTS }}>첨부파일</Label>
                      {/* 공통 첨부 칸 — 문의하기 패널과 같은 모양(2026-11-06 사용자 지정). 이미 올린 파일은 이름이 내려받기 링크다 */}
                      <AttachmentField
                        editable={canSave}
                        busy={busy}
                        accept={FILE_ACCEPT}
                        canPick={kept.length + files.length < MAX_ATTACHMENTS}
                        onPick={addFiles}
                        rejected={rejected}
                        note={
                          <>
                            JPG, PNG, PDF 파일을 최대 {MAX_ATTACHMENTS}개까지 첨부할 수 있습니다. <span className="whitespace-nowrap">(파일당 10MB 이하)</span>
                          </>
                        }
                        rows={[
                          ...kept.map((at) => ({
                            key: `kept-${at.postAttachmentId}`,
                            name: at.fileName,
                            size: at.sizeBytes,
                            preview: keptPreviews[at.postAttachmentId],
                            onOpen: () => download(at.postAttachmentId),
                            onRemove: () => {
                              setRemoveIds((ids) => [...ids, at.postAttachmentId]);
                              setRejected([]);
                              clearField("attachments");
                            },
                          })),
                          ...files.map(({ key, file }) => ({
                            key: `new-${key}`,
                            name: file.name,
                            size: file.size,
                            preview: newPreviews.get(key),
                            onRemove: () => {
                              setFiles((prev) => prev.filter((f) => f.key !== key));
                              setRejected([]);
                              clearField("attachments");
                            },
                          })),
                        ]}
                      />
                      <FieldMessage id="post-attachments-error" message={fieldMessage("attachments")} />
                    </div>
                  )}
                </div>
              </div>
              {/* 오른쪽은 상단 고정 · 게시 기간 상자와 노출 대상 상자 둘로(2026-11-06 사용자 지정 — 한 상자였다), 상자 사이 24px */}
              <div className="col-start-2 row-start-1 flex flex-col gap-[24px]">
              <div className="flex flex-col gap-[24px] rounded-[2px] border border-erp-thead-line bg-white p-[16px]">
                <div className="flex flex-col gap-[8px]">
                  {/* 칸 이름을 앞에, 스위치를 뒤에. 공통 Toggle 은 글자를 뒤에 그려 글자 없이 두고 이름은 Label 로 */}
                  <span className="flex items-center gap-[10px]">
                    <Label strong>상단 고정</Label>
                    <Toggle label="" aria-label="상단 고정" checked={form.isPinned} onChange={(e) => set("isPinned", e.target.checked)} />
                  </span>
                  <Note>상단 고정 시 공지 목록 맨 위에 표시되며, 여러 개일 경우 최신 게시일순으로 정렬됩니다.</Note>
                </div>
                <div data-post-field="period" className="flex flex-col gap-[8px]">
                  <Label strong>게시 기간</Label>
                  {/* 종료일 오류는 종료일 칸 바로 아래에 — 어느 칸을 고칠지 바로 보이게 */}
                  <div className="flex items-start gap-[6px]">
                    <div className="flex flex-1 flex-col gap-[8px]">
                      <DateField aria-label="게시 시작일" value={form.publishStartDate} onChange={(v) => set("publishStartDate", v)} />
                      {/* 시작일을 비운 채 게시한 글은 api 가 등록일을 게시일로 쓴다 — 그 날짜를 칸 아래 연한 노랑 꼬리표(14px, #fff6e5 · #956013 — 지각 표시 · 급여명세서 경고와 같은 계열, 토큰이 없어 여기 적는다)로 알린다 — 회색 글자는 흐려 안내 문구와 섞였다(2026-11-06 사용자 지정) */}
                      {detail && detail.status !== "DRAFT" && !form.publishStartDate && <p className="self-start rounded-[2px] border border-[#e8a33d]/50 bg-[#fff6e5] px-[8px] text-[14px] leading-[24px] font-medium text-[#956013]">게시일: {formatDateTime(detail.createdAt).slice(0, 10)} (등록일)</p>}
                    </div>
                    <span className="flex h-[34px] items-center text-erp-label">~</span>
                    <div className="flex flex-1 flex-col gap-[8px]">
                      <DateField aria-label="게시 종료일" value={form.publishEndDate} onChange={(v) => set("publishEndDate", v)} />
                      <FieldMessage id="post-period-error" message={fieldMessage("period")} />
                    </div>
                  </div>
                  <Note>
                    기간 미설정 시 <u>게시 후 계속 표시</u>됩니다. 종료일만 설정하면 시작일은 게시일로 자동 적용됩니다.
                  </Note>
                </div>
              </div>
              <div className="flex flex-col gap-[24px] rounded-[2px] border border-erp-thead-line bg-white p-[16px]">
                <div className="flex flex-col gap-[8px]">
                  {/* 칸 이름 「노출 대상 *」 — 게시할 때 필수 */}
                  <Label strong required>
                    노출 대상
                  </Label>
                  {/* 노출 대상은 표로 — 이름 칸(체크 상자 + 굵은 이름)과 설명 칸이 줄마다 같은 자리에 선다. 상세 표(DetailTable)와 같은 선 · 높이(2026-11-06 사용자 지정 —
                      전엔 체크 상자 줄에 「이름 : 설명」). 회원을 찍으면 BP · 점포도 찍히고, 회원을 풀면 함께 풀리며, 회원이 찍힌 채 하나를 풀면 회원도 풀린다(2026-11-06 사용자 지정) */}
                  <table data-post-field="audiences" className="w-full table-fixed border-collapse text-[15px]">
                    <colgroup>
                      <col className="w-[110px]" />
                      <col />
                    </colgroup>
                    <tbody>
                      {AUDIENCES.map((a) => (
                        <tr key={a} className="h-[46px] border border-erp-thead-line">
                          <th scope="row" className="border-r border-erp-thead-line bg-erp-thead-bg px-[12px] text-left font-semibold text-erp-ink">
                            <span className="flex items-center gap-[8px]">
                              <Checkbox
                                id={`post-audience-${a}`}
                                label=""
                                aria-label={labelOf(audiences, a)}
                                checked={form.audiences.includes(a)}
                                onChange={(e) => toggleAudience(a, e.target.checked)}
                              />
                              <label htmlFor={`post-audience-${a}`}>{labelOf(audiences, a)}</label>
                            </span>
                          </th>
                          <td className="px-[12px] text-erp-label">
                            <label htmlFor={`post-audience-${a}`}>{AUDIENCE_HINT[a]}</label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <FieldMessage id="post-audiences-error" message={fieldMessage("audiences")} />
</div>
              </div>
              {/* 변경이력도 오른쪽 열 안에 둬 위 상자들과 같은 24px 간격(2026-11-06 사용자 지정 — 따로 격자 둘째 줄에 두니 왼쪽 상자 높이만큼 벌어졌다) */}
              <Box title="변경이력">
                <HistoryLines detail={detail} statuses={statuses} />
              </Box>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
              <Box>
                <div data-post-field="type" className="flex flex-col gap-[8px]">
                <label className="flex flex-col gap-[8px]">
                  <Label strong required help={notice ? undefined : { title: "공통코드 그룹", value: "FAQ_CATEGORY" }}>{notice ? "유형" : "카테고리"}</Label>
                  {notice ? (
                    // 공지사항 유형 — 사용자 쪽 목록의 「구분」이 이것이다.
                    <Select value={form.noticeType} onChange={(e) => set("noticeType", e.target.value as Form["noticeType"])} aria-required>
                      <option value="">선택</option>
                      {noticeTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    // 카테고리는 공통코드 FAQ_CATEGORY 의 사용 중인 것만.
                    <Select value={form.faqCategoryCode} onChange={(e) => set("faqCategoryCode", e.target.value)} aria-required>
                      <option value="">선택</option>
                      {categoryMissing && <option value={form.faqCategoryCode}>{form.faqCategoryCode} (사용 중지)</option>}
                      {faqCategories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </label>
                <FieldMessage id="post-type-error" message={fieldMessage("type")} />
                </div>
                {categoryMissing && <Note>사용 중지된 카테고리입니다. 게시하거나 내용을 고치려면 카테고리를 바꿔 주세요.</Note>}
                <div data-post-field="title" className="flex flex-col gap-[8px]">
                <label className="flex flex-col gap-[8px]">
                  <Label strong required count={{ now: form.title.length, max: TITLE_MAX }}>{notice ? "제목" : "질문"}</Label>
                  <TextField value={form.title} onChange={(e) => set("title", e.target.value)} aria-required aria-describedby={fieldErrors.title ? "post-title-error" : undefined} />
                </label>
                <FieldMessage id="post-title-error" message={fieldMessage("title")} />
                </div>
                <div data-post-field="body" className="flex flex-col gap-[8px]">
                <label className="flex flex-col gap-[8px]">
                  <Label strong required count={{ now: form.body.length, max: BODY_MAX }}>{notice ? "본문" : "답변"}</Label>
                  <Textarea
                    rows={notice ? 12 : 10}
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                    // 공지 본문 안내는 입력칸 안에 — 아래 따로 두던 「본문은 글자 그대로 보입니다. …」 줄을 옮겼다(2026-11-06 사용자 지정)
                    placeholder={notice ? "공지사항 내용을 입력해 주세요.\nHTML 태그는 지원하지 않으며, 입력한 내용이 그대로 표시됩니다." : undefined}
                    aria-required
                    aria-describedby={fieldErrors.body ? "post-body-error" : undefined}
                  />
                </label>
                <FieldMessage id="post-body-error" message={fieldMessage("body")} />
                </div>
              </Box>
              <div className="flex min-w-0 flex-col gap-[24px]">
                <Box>
                  <div className="flex flex-col gap-[8px]">
                    {/* 칸 이름 「노출 대상 *」 — 게시할 때 필수 */}
                    <Label strong required>
                      노출 대상
                    </Label>
                    {/* 노출 대상은 표로 — 이름 칸(체크 상자 + 굵은 이름)과 설명 칸이 줄마다 같은 자리에 선다. 상세 표(DetailTable)와 같은 선 · 높이(2026-11-06 사용자 지정 —
                        전엔 체크 상자 줄에 「이름 : 설명」). 회원을 찍으면 BP · 점포도 찍히고, 회원을 풀면 함께 풀리며, 회원이 찍힌 채 하나를 풀면 회원도 풀린다(2026-11-06 사용자 지정) */}
                    <table data-post-field="audiences" className="w-full table-fixed border-collapse text-[15px]">
                      <colgroup>
                        <col className="w-[110px]" />
                        <col />
                      </colgroup>
                      <tbody>
                        {AUDIENCES.map((a) => (
                          <tr key={a} className="h-[46px] border border-erp-thead-line">
                            <th scope="row" className="border-r border-erp-thead-line bg-erp-thead-bg px-[12px] text-left font-semibold text-erp-ink">
                              <span className="flex items-center gap-[8px]">
                                <Checkbox
                                  id={`post-audience-${a}`}
                                  label=""
                                  aria-label={labelOf(audiences, a)}
                                  checked={form.audiences.includes(a)}
                                  onChange={(e) => toggleAudience(a, e.target.checked)}
                                />
                                <label htmlFor={`post-audience-${a}`}>{labelOf(audiences, a)}</label>
                              </span>
                            </th>
                            <td className="px-[12px] text-erp-label">
                              <label htmlFor={`post-audience-${a}`}>{AUDIENCE_HINT[a]}</label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <FieldMessage id="post-audiences-error" message={fieldMessage("audiences")} />
</div>
                </Box>
                <Box title="변경이력">
                  <HistoryLines detail={detail} statuses={statuses} />
                </Box>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete && can.delete}
        title={notice ? "공지사항을 삭제하시겠습니까?" : "FAQ를 삭제하시겠습니까?"}
        // 커뮤니티 관리는 빨간 버튼을 두지 않는다 — 기본 버튼, 되돌릴 수 없다는 말은 굵은 글로(2026-11-06 사용자 지정 — 전엔 danger)
        confirmLabel="삭제"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>삭제한 {notice ? "공지사항은 사용자 화면과 공지사항" : "FAQ는 사용자 화면과 FAQ"} 목록에서 사라집니다.</p>
        <p>삭제한 내용은 복구할 수 없습니다.</p>
      </ConfirmDialog>
    </>
  );
}
