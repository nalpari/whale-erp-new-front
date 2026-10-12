// 근로계약 목록의 순수 로직 — 주소 쿼리 ↔ API 쿼리, 칸 표기. 테스트: node --test src/app/contracts/contract-list.test.ts

export const PAGE_SIZE = 20;

/** GET /contracts 의 한 줄. openapi-typescript 로 타입을 생성하기 전까지 api 의 ContractListItemDto 를 옮겨 적는다. */
export interface ContractListItem {
  contractId: number;
  staffMemberId: number;
  staffMemberName: string;
  storeId: number;
  storeName: string | null;
  // 임시저장한 계약은 아래 칸이 비어 있을 수 있다(근로계약은 키만 NOT NULL).
  employmentType: "FULL_TIME" | "PART_TIME" | null;
  contractMethod: "ELECTRONIC" | "PAPER" | null;
  startDate: string | null;
  endDate: string | null;
  wageAmount: number | null;
  status: null | "DRAFT" | "PENDING_SEND" | "PENDING_SIGNATURE" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
  /** 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null */
  draftAction: null | "SIGNUP_INVITE" | "AFFILIATION_CONFIRM" | "RETURN_CONFIRM" | "IMMEDIATE_SEND";
  sentAt: string | null;
  signDeadlineAt: string | null;
}

export interface ContractListPage {
  items: ContractListItem[];
  total: number;
}

/** 화면 주소의 쿼리. 상태가 비어 있으면 전체다. */
export interface ListQuery {
  page: number;
  storeName: string;
  staffMemberName: string;
  status: string[];
}

type SearchParams = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function readListQuery(params: SearchParams): ListQuery {
  const page = Number.parseInt(first(params.page), 10);
  const status = params.status;
  return {
    // 숫자가 아니거나 1보다 작으면 첫 페이지. api 는 page=0 을 400 으로 돌려준다.
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    storeName: first(params.storeName).trim(),
    staffMemberName: first(params.staffMemberName).trim(),
    status: (Array.isArray(status) ? status : status ? [status] : []).filter(Boolean),
  };
}

/** 화면 주소와 API 쿼리는 같은 이름을 쓴다. 기본값(1페이지 · 빈 칸)은 빼서 주소를 짧게 둔다. */
export function toSearch(q: ListQuery, extra: Record<string, string> = {}): string {
  const s = new URLSearchParams();
  if (q.page > 1) s.set("page", String(q.page));
  if (q.storeName) s.set("storeName", q.storeName);
  if (q.staffMemberName) s.set("staffMemberName", q.staffMemberName);
  for (const v of q.status) s.append("status", v);
  for (const [k, v] of Object.entries(extra)) s.set(k, v);
  const text = s.toString();
  return text ? `?${text}` : "";
}

export function periodText(row: Pick<ContractListItem, "startDate" | "endDate">): string {
  if (!row.startDate) return "-";
  return `${row.startDate} ~ ${row.endDate ?? "무기한"}`;
}

/** 정직원은 월급, 파트타이머는 시급 — 급여액의 뜻은 고용 형태가 정한다. */
export function wageText(row: Pick<ContractListItem, "wageAmount" | "employmentType">): string {
  if (row.wageAmount === null || row.employmentType === null) return "-";
  return `${row.wageAmount.toLocaleString("ko-KR")} ${row.employmentType === "FULL_TIME" ? "/월" : "/h"}`;
}

// 날짜는 한국 시간으로 끊는다. 서버(UTC)에서 그리면 오전 9시 전 발송이 전날로 보인다.
const kstDate = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10);

/** 발송일 MM-DD. 발송 전이면 "-" */
export function sentText(sentAt: string | null): string {
  return sentAt ? kstDate(sentAt).slice(5) : "-";
}

/** 서명 대기의 남은 날. 날인 기한 날짜까지 며칠 남았는지(D-0 이 마감일). */
export function deadlineNote(row: Pick<ContractListItem, "status" | "signDeadlineAt">, now: Date): string | undefined {
  if (row.status !== "PENDING_SIGNATURE" || !row.signDeadlineAt) return undefined;
  const days = Math.round((Date.parse(kstDate(row.signDeadlineAt)) - Date.parse(kstDate(now.toISOString()))) / 86_400_000);
  return days >= 0 ? `D-${days}` : undefined;
}
