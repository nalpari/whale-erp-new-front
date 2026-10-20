"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { Badge, Button, Checkbox, ConfirmDialog, DateField, PageBar, Select, Tag, Textarea, TextField, Toggle, useToast } from "@/components/common";
import { useCodes } from "@/components/site/session-gate";
import { bff, BffError } from "@/lib/bff";
import type { PostDetail } from "@/lib/community";
import {
  AUDIENCES,
  BODY_MAX,
  faqBody,
  FILE_ACCEPT,
  MAX_ATTACHMENTS,
  POST_BASE,
  postFields,
  sizeLabel,
  TITLE_MAX,
  validatePost,
  type Audience,
  type PostForm as Form,
  type PostKind,
  type PostStatus,
} from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { deletePostAction, saveFaqAction, type SaveResult } from "@/lib/community-actions";
import { NOTICE_SAVE_ROUTE } from "@/lib/paper-request";

// 공지사항 · FAQ 등록 · 수정(#276, 목업 support/notice-edit.html, 데모 support/notice-edit · faq-edit). 플랫폼 관리자 전용.
// 공지 · FAQ 는 메뉴가 달라 화면을 나눴고(2026-10-02 재영) 이 폼을 함께 쓴다 — FAQ 에서는 상단 고정 · 게시 기간 · 첨부를 감춘다.
// 저장은 버튼으로 게시 상태를 정한다(게시 · 임시저장 · 비공개). 성공하면 토스트를 띄우고 이 화면에 머문다.
// 공지사항은 첨부 때문에 라우트 핸들러(platform-notices/save)로 multipart 를, FAQ 는 서버 액션으로 JSON 을 보낸다(api 가 FAQ 는 JSON 만 받는다).
// 실패하면 입력값을 그대로 두고 폼 위 빨간 띠에 까닭을 보인다. 그사이 누가 고쳤으면(409) 최신 내용을 다시 불러오게 한다.

const SAVED_TOAST: Record<PostStatus, string> = { PUBLISHED: "게시했습니다.", DRAFT: "임시저장했습니다.", PRIVATE: "비공개로 저장했습니다." };
// 노출 대상 옆 설명(데모와 같다). 비회원은 설명 대신 아래 안내가 붙는다.
const AUDIENCE_HINT: Partial<Record<Audience, string>> = { MEMBER: "로그인한 모든 사용자", BP: "사업자 관리자", STORE: "점포 단위 관리자" };

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
function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">{title}</h3>
      <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div>
    </section>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
const Label = ({ children, count }: { children: ReactNode; count?: { now: number; max: number } }) => (
  <span className="text-[14px] font-medium text-erp-label">
    {children}
    {count && (
      <span className={`ml-[6px] text-[12px] font-normal ${count.now > count.max ? "text-erp-off" : "text-erp-muted"}`}>
        {count.now.toLocaleString("ko-KR")} / {count.max.toLocaleString("ko-KR")}
      </span>
    )}
  </span>
);
const Band = ({ children }: { children: ReactNode }) => (
  <p className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-off">{children}</p>
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
  /** 뺄 기존 첨부 */
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [stale, setStale] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, startTransition] = useTransition();
  const errorRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);

  const notice = kind === "NOTICE";
  const name = notice ? "공지사항" : "FAQ";
  const listHref = POST_BASE[kind];
  const kept = (detail?.attachments ?? []).filter((a) => !removeIds.includes(a.postAttachmentId));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleAudience = (a: Audience, on: boolean) => set("audiences", AUDIENCES.filter((x) => (x === a ? on : form.audiences.includes(x))));

  const showErrors = (messages: string[], isStale = false) => {
    setErrors(messages);
    setStale(isStale);
    // 띠가 화면 밖일 수 있어 띠로 올려 보인다.
    if (messages.length) requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: "nearest" }));
  };

  const save = (status: PostStatus) => {
    const messages = validatePost(form, status, kept.length, files.map((f) => f.file));
    if (messages.length) return showErrors(messages);
    startTransition(async () => {
      const result = notice ? await sendNotice(status) : await saveFaqAction(detail?.postId ?? null, faqBody(form, status), detail?.updatedAt);
      if (!result.ok) {
        // 세션이 끊겼다 — 로그인 화면으로 보낸다.
        if (result.status === 401) return router.push("/login");
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
  const sendNotice = async (status: PostStatus): Promise<SaveResult> => {
    const data = new FormData();
    for (const [key, value] of postFields(form, status)) data.append(key, value);
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
    return { ok: false, status: res.status, messages: body?.messages ?? [`저장하지 못했습니다 (HTTP ${res.status}). 잠시 뒤 다시 저장해 주세요.`] };
  };

  const handleDelete = () =>
    detail &&
    startTransition(async () => {
      setConfirmDelete(false);
      const result = await deletePostAction(kind, detail.postId);
      if (!result.ok) return showErrors([result.message]);
      toast("deleted");
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
        showErrors([e instanceof BffError ? e.message : "첨부파일을 받지 못했습니다."]);
      }
    });

  const addFiles = (list: FileList | null) => {
    if (list) setFiles((prev) => [...prev, ...Array.from(list, (file) => ({ key: nextKey.current++, file }))]);
    // 같은 파일을 빼고 다시 고를 수 있게 비운다.
    if (fileInput.current) fileInput.current.value = "";
  };

  // 사용 중지된 카테고리의 FAQ 를 열면 고른 값이 목록에 없다 — 값을 그대로 두고 바꾸게 한다(api 가 게시 · 내용 수정 때 막는다).
  const categoryMissing = !!form.faqCategoryCode && !faqCategories.some((c) => c.value === form.faqCategoryCode);

  return (
    <>
      <PageBar title={detail ? `${name} 수정` : `${name} 등록`}>
        <div className="flex items-center gap-[6px]">
          <Button variant="off" href={listHref}>
            목록
          </Button>
          {detail && (
            <Button variant="soft" disabled={busy} onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )}
          <Button variant="soft" disabled={busy} onClick={() => save("PRIVATE")}>
            비공개
          </Button>
          <Button variant="soft" disabled={busy} onClick={() => save("DRAFT")}>
            임시저장
          </Button>
          <Button disabled={busy} onClick={() => save("PUBLISHED")}>
            게시
          </Button>
        </div>
      </PageBar>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {errors.length > 0 && (
            <div ref={errorRef} role="alert" className="flex items-start gap-[12px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
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
          <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
            <Box title="내용">
              <label className="flex flex-col gap-[8px]">
                <Label>{notice ? "유형" : "카테고리"}</Label>
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
              {categoryMissing && <Note>사용 중지된 카테고리입니다. 게시하거나 내용을 고치려면 카테고리를 바꿔 주세요.</Note>}
              <label className="flex flex-col gap-[8px]">
                <Label count={{ now: form.title.length, max: TITLE_MAX }}>{notice ? "제목" : "질문"}</Label>
                <TextField value={form.title} onChange={(e) => set("title", e.target.value)} aria-required />
              </label>
              <label className="flex flex-col gap-[8px]">
                <Label count={{ now: form.body.length, max: BODY_MAX }}>{notice ? "본문" : "답변"}</Label>
                <Textarea rows={notice ? 12 : 10} value={form.body} onChange={(e) => set("body", e.target.value)} aria-required />
              </label>
              {notice && <Note>본문은 글자 그대로 보입니다. HTML 은 쓸 수 없습니다.</Note>}
              {notice && (
                <div className="flex flex-col gap-[8px]">
                  <Label count={{ now: kept.length + files.length, max: MAX_ATTACHMENTS }}>첨부파일</Label>
                  {(kept.length > 0 || files.length > 0) && (
                    <ul className="flex flex-col rounded-[2px] border border-erp-panel-line">
                      {kept.map((a) => (
                        <li key={a.postAttachmentId} className="flex h-[42px] items-center gap-[8px] border-b border-erp-panel-line px-[12px] text-[14px] last:border-b-0">
                          <button type="button" disabled={busy} onClick={() => download(a.postAttachmentId)} className="min-w-0 flex-1 truncate text-left text-erp-link hover:underline">
                            {a.fileName}
                          </button>
                          <span className="text-erp-muted">{sizeLabel(a.sizeBytes)}</span>
                          <Button variant="off" onClick={() => setRemoveIds((ids) => [...ids, a.postAttachmentId])}>
                            빼기
                          </Button>
                        </li>
                      ))}
                      {files.map(({ key, file }) => (
                        <li key={`new-${key}`} className="flex h-[42px] items-center gap-[8px] border-b border-erp-panel-line px-[12px] text-[14px] last:border-b-0">
                          <span className="min-w-0 flex-1 truncate text-erp-ink">{file.name}</span>
                          <Tag>새 파일</Tag>
                          <span className="text-erp-muted">{sizeLabel(file.size)}</span>
                          <Button variant="off" onClick={() => setFiles((prev) => prev.filter((f) => f.key !== key))}>
                            빼기
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div>
                    <input ref={fileInput} type="file" multiple accept={FILE_ACCEPT} hidden onChange={(e) => addFiles(e.target.files)} />
                    <Button variant="soft" disabled={kept.length + files.length >= MAX_ATTACHMENTS} onClick={() => fileInput.current?.click()}>
                      파일 선택
                    </Button>
                  </div>
                  <Note>이미지(JPG · PNG)와 PDF 를 올릴 수 있습니다. {MAX_ATTACHMENTS}개까지, 파일당 10MB. 저장할 때 함께 올라갑니다.</Note>
                </div>
              )}
            </Box>

            <div className="flex min-w-0 flex-col gap-[24px]">
              {notice && (
                <Box title="게시 설정">
                  <Toggle label="상단 고정" checked={form.isPinned} onChange={(e) => set("isPinned", e.target.checked)} />
                  <Note>켜면 사용자 쪽 공지 목록 맨 위에 고정 표시와 함께 섭니다. 여러 개면 그 안에서 게시일 내림차순입니다.</Note>
                  <div className="flex flex-col gap-[8px]">
                    <Label>게시 기간</Label>
                    <div className="flex items-center gap-[6px]">
                      <div className="flex-1">
                        <DateField aria-label="게시 시작일" value={form.publishStartDate} onChange={(v) => set("publishStartDate", v)} />
                      </div>
                      <span className="text-erp-label">~</span>
                      <div className="flex-1">
                        <DateField aria-label="게시 종료일" value={form.publishEndDate} onChange={(v) => set("publishEndDate", v)} />
                      </div>
                    </div>
                    <Note>비우면 등록한 때부터 기한 없이 보입니다. 종료일은 시작일보다 앞설 수 없고, 그날까지 보입니다. 사용자 쪽 게시일은 시작일입니다.</Note>
                  </div>
                </Box>
              )}

              {/* 「전체」 선택은 따로 두지 않는다 — 넷을 모두 고르면 전체다(#276 2026-10-20). 부가서비스 대상은 1차에 없다. */}
              <Box title="노출 대상">
                <div className="flex flex-col gap-[12px]">
                  {AUDIENCES.map((a) => (
                    <Checkbox
                      key={a}
                      label={AUDIENCE_HINT[a] ? `${labelOf(audiences, a)} — ${AUDIENCE_HINT[a]}` : labelOf(audiences, a)}
                      checked={form.audiences.includes(a)}
                      onChange={(e) => toggleAudience(a, e.target.checked)}
                    />
                  ))}
                </div>
                {form.audiences.includes("GUEST") ? <Band>비회원이 포함되어 로그인 전 홈에 공개됩니다.</Band> : <Note>비회원을 고르면 로그인 전 홈에 공개됩니다.</Note>}
                <Note>게시하려면 하나 이상 골라야 합니다. 임시저장 · 비공개는 비워 둬도 됩니다.</Note>
              </Box>

              {detail && (
                <Box title="최근 수정">
                  <p className="flex items-center gap-[8px] text-[14px] text-erp-ink">
                    {detail.status === "PUBLISHED" ? (
                      <Badge tone="on">{labelOf(statuses, detail.status)}</Badge>
                    ) : detail.status === "PRIVATE" ? (
                      <Badge tone="off">{labelOf(statuses, detail.status)}</Badge>
                    ) : (
                      <Tag>{labelOf(statuses, detail.status)}</Tag>
                    )}
                    {formatDateTime(detail.updatedAt)}
                    {detail.updatedByName && ` · ${detail.updatedByName}`}
                  </p>
                  <Note>둘이 동시에 고치면 나중 저장이 막히고(409) 최신 내용을 다시 불러옵니다. 덮어쓰지 않습니다.</Note>
                </Box>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={notice ? "공지사항을 삭제하시겠습니까?" : "FAQ 를 삭제하시겠습니까?"}
        confirmLabel="삭제"
        confirmVariant="danger"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        사용자에게 더는 보이지 않습니다. 기록은 남습니다.
      </ConfirmDialog>
    </>
  );
}
