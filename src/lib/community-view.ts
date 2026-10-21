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
export type PostQuery = ListQuery & { status: PostStatus | "" };
export type InquiryQuery = ListQuery & { answerStatus: AnswerStatus | ""; title: string; sender: string };
export type LeadQuery = ListQuery & { answerStatus: AnswerStatus | "" };

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const oneOf = <T extends string>(values: readonly T[], v: string | undefined): T | "" => (values.includes(v as T) ? (v as T) : "");

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

export const parsePostQuery = (raw: Raw): PostQuery => ({ ...pageOf(raw), status: oneOf(POST_STATUSES, first(raw.status)) });
export const parseLeadQuery = (raw: Raw): LeadQuery => ({ ...pageOf(raw), answerStatus: oneOf(ANSWER_STATUSES, first(raw.answerStatus)) });
export const parseInquiryQuery = (raw: Raw): InquiryQuery => ({
  ...pageOf(raw),
  answerStatus: oneOf(ANSWER_STATUSES, first(raw.answerStatus)),
  title: textOf(first(raw.title), 200),
  sender: textOf(first(raw.sender), 100),
});

/** 화면 주소 · api 쿼리. 빈 값과 기본값(1쪽 · 20건)은 싣지 않는다. */
export function queryString(q: ListQuery & Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value === "" || (key === "page" && value === 1) || (key === "pageSize" && value === 20)) continue;
    params.set(key, String(value));
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
