// 커뮤니티 관리(공지사항 · FAQ · 문의사항 · 도입문의, #275 · #276) 화면의 순수 규칙 — URL 쿼리 · 노출 대상 · 저장 전 검사 · 보낼 본문.
// 저장 전 검사는 api(posts.service · post-fields.dto · upload-check)의 규칙에 맞췄다. api 가 최종으로 다시 보고, 화면은 먼저 띄울 뿐이다
// (파일 종류는 화면이 확장자로만 보고, api 는 내용으로 본다).
// 상태 · 유형 · 노출 대상의 한글은 여기 두지 않고 getEnum 으로 받는다(naming.md 화면 문구).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "./api-types.generated.ts";
import { PAGE_SIZES, type PageSize } from "./staff-members.ts";

type Schemas = components["schemas"];
export type PostKind = Schemas["PostContentType"];
export type PostStatus = Schemas["PostStatus"];
export type NoticeType = Schemas["NoticeType"];
export type AnswerStatus = Schemas["InquiryAnswerStatus"];
export type Audience = Exclude<Schemas["PostAudienceType"], "ADDON">;
export type PostAttachment = Schemas["PostAttachmentDto"];

// 화면 주소 = 메뉴 URL(MN000219 ~ MN000222) = api 자원 이름이다(한 단계 경로, 2026-10-20 api squirtle). 글 종류는 경로가 정한다.
export const POST_BASE: Record<PostKind, string> = { NOTICE: "/platform-notices", FAQ: "/platform-faqs" };
export const INQUIRY_BASE = "/platform-inquiries";
export const LEAD_BASE = "/platform-leads";

/** 1차 노출 대상 넷. 부가서비스(ADDON)는 그 차수에 연다(WHALEERP-273). 「전체」 선택은 따로 두지 않고 넷을 모두 고르면 전체다(#276). */
export const AUDIENCES: readonly Audience[] = ["GUEST", "MEMBER", "BP", "STORE"];

/** 첨부 — 공지사항만, JPG · PNG · PDF, 5개 · 파일당 10MB(api MAX_POST_ATTACHMENTS · MAX_UPLOAD_BYTES). */
export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf";
const FILE_EXT = /\.(jpe?g|png|pdf)$/i;

export const TITLE_MAX = 200;
export const BODY_MAX = 20_000;

/** 세션이 끊겼을 때 폼 위 띠 문구. 화면을 옮기지 않아 고치던 내용은 남는다. */
export const SESSION_EXPIRED = "로그인이 만료되었습니다. 고친 내용을 옮겨 둔 뒤 다시 로그인해 주세요.";
/** api 403 중 비밀번호 강제 변경(bff.ts 와 같은 문장 앞부분). 권한 없음과 갈라 api 문장을 그대로 보이고 변경 팝업을 띄운다. */
export const PASSWORD_REQUIRED_PREFIX = "비밀번호를 변경한 뒤 이용할 수 있습니다";

/**
 * 게시물 id — 1..2147483647 정수(api parseRouteId 와 같다). 서버 액션 · 라우트 핸들러 · 화면 주소가 api 경로에 붙이기 전에 본다 —
 * 이것이 느슨하면 관리자 토큰을 실은 요청이 api 의 다른 경로로 샐 수 있다. 숫자로 오면 글자로 바꿔 같은 규칙을 탄다.
 */
export function postIdOf(raw: unknown): number | null {
  const s = typeof raw === "number" ? String(raw) : raw;
  return typeof s === "string" && /^[1-9][0-9]{0,9}$/.test(s) && Number(s) <= 2_147_483_647 ? Number(s) : null;
}

export type ListQuery = { page: number; pageSize: PageSize };
// 상태 · 구분 · 카테고리 필터는 체크박스라 여러 값을 함께 고른다. 빈 배열이 전체다(2026-10-22 재영, #275 · #282~284).
export type PostQuery = ListQuery & { status: PostStatus[] };
export type InquiryQuery = ListQuery & { answerStatus: AnswerStatus[]; title: string; sender: string };
export type LeadQuery = ListQuery & { answerStatus: AnswerStatus[] };

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
/** 주소에 되풀이된 값 중 아는 것만, 정해 둔 순서로 한 번씩. 모르는 값은 오류 없이 버린다. */
const someOf = <T extends string>(values: readonly T[], v: string | string[] | undefined): T[] => {
  const got = all(v);
  return values.filter((x) => got.includes(x));
};

const POST_STATUSES: readonly PostStatus[] = ["DRAFT", "PUBLISHED", "PRIVATE"];
const ANSWER_STATUSES: readonly AnswerStatus[] = ["WAITING", "ANSWERED"];

/** 쪽 · 건수. 이상한 값은 오류 없이 기본값(1쪽 · 20건)으로 돌린다. */
function pageOf(raw: Raw): ListQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 10_000_000 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? (pageSize as PageSize) : 20,
  };
}

/** 검색어는 api 한도(제목 200자 · 보낸 곳 100자)로 자르고 NUL 을 뺀다 — 둘 다 api 가 400 을 내 목록이 통째로 실패한다. */
const textOf = (v: string | undefined, max: number) => (v ?? "").replaceAll("\u0000", "").trim().slice(0, max);

export const parsePostQuery = (raw: Raw): PostQuery => ({ ...pageOf(raw), status: someOf(POST_STATUSES, raw.status) });
export const parseLeadQuery = (raw: Raw): LeadQuery => ({ ...pageOf(raw), answerStatus: someOf(ANSWER_STATUSES, raw.answerStatus) });
export const parseInquiryQuery = (raw: Raw): InquiryQuery => ({
  ...pageOf(raw),
  answerStatus: someOf(ANSWER_STATUSES, raw.answerStatus),
  title: textOf(first(raw.title), 200),
  sender: textOf(first(raw.sender), 100),
});

/** 화면 주소 · api 쿼리. 빈 값과 기본값(1쪽 · 20건)은 싣지 않는다. 여러 값은 같은 이름을 되풀이한다(`?status=A&status=B`, api 의 다른 목록과 같다). */
export function queryString(q: ListQuery & Record<string, string | number | readonly string[]>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value === "" || (key === "page" && value === 1) || (key === "pageSize" && value === 20)) continue;
    if (Array.isArray(value)) for (const v of value) params.append(key, v);
    else params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** 편집 화면 입력값. 공지사항 칸(유형 · 고정 · 게시 기간 · 첨부)은 FAQ 에서 보내지 않는다. */
export type PostForm = {
  kind: PostKind;
  title: string;
  body: string;
  noticeType: NoticeType | "";
  isPinned: boolean;
  publishStartDate: string;
  publishEndDate: string;
  faqCategoryCode: string;
  audiences: Audience[];
};

/** 새로 더할 파일 — 검사에 쓰는 칸만. */
export type NewFile = { name: string; size: number };

/**
 * 저장 전 검사. 고칠 문장 목록을 돌려주고, 비어 있으면 보내도 된다. 필수 · 유형 · 카테고리 · 노출 대상 · 게시 기간 · 첨부 개수 문구는
 * api 와 같고, 길이 · 파일 종류 · 크기 문구는 화면 것이다(api 는 기본 문구이거나 파일 이름을 붙이지 않는다).
 * kept 는 남겨 둘 기존 첨부 수(수정), files 는 새로 더할 파일이다.
 */
export function validatePost(f: PostForm, status: PostStatus, kept: number, files: readonly NewFile[]): string[] {
  const errors: string[] = [];
  const notice = f.kind === "NOTICE";
  if (!f.title.trim()) errors.push("제목을 입력해 주세요");
  else if (f.title.length > TITLE_MAX) errors.push(`제목은 ${TITLE_MAX}자까지 쓸 수 있습니다`);
  if (!f.body.trim()) errors.push("본문을 입력해 주세요");
  else if (f.body.length > BODY_MAX) errors.push(`본문은 ${BODY_MAX.toLocaleString("ko-KR")}자까지 쓸 수 있습니다`);
  if (notice && !f.noticeType) errors.push("공지사항 유형을 골라 주세요");
  if (!notice && !f.faqCategoryCode) errors.push("FAQ 카테고리를 골라 주세요");
  if (status === "PUBLISHED" && f.audiences.length === 0) errors.push("게시하려면 노출 대상을 하나 이상 골라 주세요");
  // YYYY-MM-DD 는 글자 순서가 날짜 순서다.
  if (notice && f.publishStartDate && f.publishEndDate && f.publishEndDate < f.publishStartDate) errors.push("게시 종료일이 시작일보다 앞설 수 없습니다");
  if (notice) {
    if (kept + files.length > MAX_ATTACHMENTS) errors.push(`첨부파일은 공지사항 하나에 ${MAX_ATTACHMENTS}개까지 올릴 수 있습니다`);
    for (const file of files) {
      if (!FILE_EXT.test(file.name)) errors.push(`${file.name}: JPG · PNG · PDF 만 올릴 수 있습니다`);
      else if (file.size > MAX_FILE_BYTES) errors.push(`${file.name}: 파일 하나는 10MB 까지 올릴 수 있습니다`);
    }
  }
  return errors;
}

/**
 * 공지사항으로 보낼 multipart 칸. api 가 문자열을 JSON 과 같은 값으로 바꾼다(post-fields.dto) — 배열은 같은 이름을 되풀이하고,
 * 빈 선택 칸은 빈 문자열(null), 불리언은 'true' · 'false' 다. 파일과 수정용 updatedAt · removeAttachmentIds 는 부르는 쪽이 붙인다.
 */
type Field = [keyof Schemas["UpdatePostDto"], string];
export function postFields(f: PostForm, status: PostStatus): Field[] {
  const notice = f.kind === "NOTICE";
  const fields: Field[] = [
    ["title", f.title],
    ["body", f.body],
    ["status", status],
    ...f.audiences.map((a): Field => ["audiences", a]),
  ];
  if (notice)
    fields.push(
      ["noticeType", f.noticeType],
      ["isPinned", String(f.isPinned)],
      ["publishStartDate", f.publishStartDate],
      ["publishEndDate", f.publishEndDate],
    );
  else fields.push(["faqCategoryCode", f.faqCategoryCode]);
  return fields;
}

/**
 * FAQ 로 보내는 JSON(api CreatePostDto, 수정은 updatedAt 을 더해 UpdatePostDto). FAQ 경로는 JSON 만 받고 공지사항 칸
 * (유형 · 고정 · 게시 기간)을 보내지 않는다.
 */
export function faqBody(f: PostForm, status: PostStatus): Schemas["CreatePostDto"] {
  return { title: f.title, body: f.body, status, audiences: f.audiences, faqCategoryCode: f.faqCategoryCode };
}

/** 파일 크기 글자 — 1MB 넘으면 MB, 아니면 KB(올림). */
export function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(bytes / 1024))}KB`;
}

// ── 고객지원(#282 · 283 · 284) — 로그인한 관리자가 노출 대상에 든 공지 · FAQ 를 읽고 자기 문의를 남긴다. 화면 주소 = 메뉴 URL = api 경로다.
export const SUPPORT_NOTICE_BASE = "/support-notices";
export const SUPPORT_FAQ_BASE = "/support-faqs";
export const SUPPORT_INQUIRY_BASE = "/support-inquiries";

export type InquiryStatus = Schemas["InquiryStatus"];
export type SupportNoticeQuery = ListQuery & { keyword: string; noticeType: NoticeType[] };
export type SupportFaqQuery = ListQuery & { keyword: string; faqCategoryCode: string[] };
export type SupportInquiryQuery = ListQuery & { title: string; status: InquiryStatus[] };

const NOTICE_TYPES: readonly NoticeType[] = ["MAINTENANCE", "FEATURE", "TERMS", "GENERAL"];
const INQUIRY_STATUSES: readonly InquiryStatus[] = ["RECEIVED", "IN_PROGRESS", "ANSWERED"];

// 검색어 한도는 api 와 같다(공지 · FAQ keyword 100자, 문의 제목 200자). FAQ 카테고리는 공통코드 상세 코드 20자.
export const parseSupportNoticeQuery = (raw: Raw): SupportNoticeQuery => ({
  ...pageOf(raw),
  keyword: textOf(first(raw.keyword), 100),
  noticeType: someOf(NOTICE_TYPES, raw.noticeType),
});
export const parseSupportFaqQuery = (raw: Raw): SupportFaqQuery => ({
  ...pageOf(raw),
  keyword: textOf(first(raw.keyword), 100),
  // 카테고리는 공통코드라 목록을 모른다 — 다듬어 빈 값 · 겹친 값만 빼고, api 가 400 을 내는 값(20자 넘음 · 50개 넘음)은 버린다.
  faqCategoryCode: [...new Set(all(raw.faqCategoryCode).map((v) => textOf(v, 21)))].filter((v) => v && v.length <= 20).slice(0, 50),
});
export const parseSupportInquiryQuery = (raw: Raw): SupportInquiryQuery => ({
  ...pageOf(raw),
  title: textOf(first(raw.title), 200),
  status: someOf(INQUIRY_STATUSES, raw.status),
});

/**
 * 문의 첨부 고르기(CNT-18). 6번째 · 10MB 초과 · JPG · PNG · PDF 가 아닌 파일은 그 파일만 빼고 까닭을 돌려준다 —
 * 이미 올린 파일과 쓴 내용은 그대로 둔다. had 는 이미 올린 파일 수다.
 */
export function pickInquiryFiles<F extends NewFile>(had: number, picked: readonly F[]): { accepted: F[]; rejected: string[] } {
  const accepted: F[] = [];
  const rejected: string[] = [];
  for (const file of picked) {
    if (!FILE_EXT.test(file.name)) rejected.push(`${file.name}: 이미지(JPG · PNG)와 PDF 만 올릴 수 있습니다`);
    else if (file.size > MAX_FILE_BYTES) rejected.push(`${file.name}: 파일 하나는 10MB 까지 올릴 수 있습니다`);
    else if (had + accepted.length >= MAX_ATTACHMENTS) rejected.push(`${file.name}: 첨부파일은 ${MAX_ATTACHMENTS}개까지 올릴 수 있습니다`);
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** 쓰던 답변 · 메모와, 쓰기 시작할 때 저장돼 있던 값(base). */
export type Draft = { text: string; base: string };

/**
 * 쓰던 글을 지금 저장된 값(saved)과 견줘 무엇을 보일지 정한다(front #87 리뷰).
 * - 그사이 저장된 값이 그대로면 쓰던 글을 그대로 보인다.
 * - 바뀌었는데 손대지 않은 글(「답변 수정」만 누름)이면 버리고 새로 저장된 값을 보인다 — 옛 값으로 덮어쓰지 않게.
 * - 바뀌었고 고쳐 쓰던 글이면 남기되 stale 로 알려, 화면이 새로 저장된 값을 함께 보이게 한다.
 */
export function draftView(draft: Draft | undefined, saved: string): { text: string | undefined; stale: boolean } {
  if (!draft) return { text: undefined, stale: false };
  if (draft.base === saved) return { text: draft.text, stale: false };
  if (draft.text === draft.base) return { text: undefined, stale: false };
  return { text: draft.text, stale: true };
}

/**
 * 페이지 번호 줄(비로그인 공지사항 #293) — 지금 쪽이 든 10개 묶음(1~10, 11~20 …)과 앞 · 뒤 묶음으로 갈 쪽.
 * 마지막 쪽을 넘어온 주소(?page=99)는 마지막 묶음을 보인다. 글이 없어도 1쪽은 있다.
 */
export function pageWindow(page: number, total: number, pageSize: number): { pages: number[]; prev: number | null; next: number | null } {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.floor((Math.min(page, last) - 1) / 10) * 10 + 1;
  const end = Math.min(start + 9, last);
  return {
    pages: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    prev: start > 1 ? start - 1 : null,
    next: end < last ? end + 1 : null,
  };
}
