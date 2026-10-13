// 운영 알림함 화면의 순수 규칙 — 알림 → 업무 화면 경로, URL 쿼리, 일시, 종 배지. 화면 · 종 · 메일 버튼 링크
// (api WHALEERP-249 의 /notifications/{id}/open)가 모두 이 경로표 하나를 쓴다. api 는 업무별 화면 주소를 모른다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { PAGE_SIZES, type PageSize } from "./staff-members.ts";

type Target = { relatedType: string; path: (id: number) => string };

const CONTRACT: Target = { relatedType: "CONTRACT", path: (id) => `/contracts/${id}` };
const STAFF: Target = { relatedType: "STAFF_MEMBER", path: (id) => `/staff-members/${id}` };

/**
 * 템플릿 코드 → 갈 곳. 화면이 아직 없는 문의 · 도입문의 넷은 null 이라 알림함으로 돌아와 「이동할 화면이 없습니다」를
 * 보인다 — 읽음 뒤 404 로 보내지 않는다. 화면이 생기면 여기에 넣는다: 문의사항 접수 /platform/community/inquiries/{id},
 * 문의사항 답변 /support/inquiries/{id}(등록한 사람의 고객지원), 도입문의 접수 · 처리 상태 변경 /platform/community/leads/{id}.
 */
const TARGETS: Record<string, Target | null> = {
  NTF_CONTRACT_SIGNED: CONTRACT,
  NTF_CONTRACT_REJECTED: CONTRACT,
  NTF_CONTRACT_EXPIRED: CONTRACT,
  NTF_CONTRACT_RENEWAL_DUE: CONTRACT,
  NTF_LINK_HOLD: STAFF,
  NTF_AFFILIATION_REJECTED: STAFF,
  NTF_INQUIRY_RECEIVED: null,
  NTF_INQUIRY_ANSWERED: null,
  NTF_LEAD_RECEIVED: null,
  NTF_LEAD_ANSWERED: null,
};

const RELATED_LABELS: Record<string, string> = {
  CONTRACT: "근로계약",
  STAFF_MEMBER: "직원",
  INQUIRY: "문의사항",
  LEAD: "도입문의",
};

/** 관련 업무 식별 정보 — 「근로계약 #41」. 모르는 종류이거나 없으면 「-」. */
export function relatedLabel(relatedType: string | null, relatedId: number | null): string {
  const label = relatedType !== null && Object.hasOwn(RELATED_LABELS, relatedType) ? RELATED_LABELS[relatedType] : undefined;
  return label && relatedId !== null ? `${label} #${relatedId}` : "-";
}

/** api 경로 · 쿼리에 넣을 알림 ID — integer 칸에 들어가는 1..2147483647 의 정수만. */
export function isNotificationId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= 2147483647;
}

export type LinkSource = { templateCode: string; relatedType: string | null; relatedId: number | null };

/** 알림이 갈 업무 화면. 모르는 코드이거나 관련 업무가 없거나 맞지 않으면 null — 엉뚱한 화면으로 보내지 않는다. */
export function linkOf({ templateCode, relatedType, relatedId }: LinkSource): string | null {
  const target = Object.hasOwn(TARGETS, templateCode) ? TARGETS[templateCode] : null;
  if (!target || relatedId === null || relatedType !== target.relatedType) return null;
  return target.path(relatedId);
}

export type NotificationQuery = { page: number; pageSize: PageSize };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** URL 쿼리 → 쪽 · 건수. 이상한 값은 오류 없이 기본값(1쪽 · 20건)으로 돌린다. */
export function parseNotificationQuery(raw: Record<string, string | string[] | undefined>): NotificationQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? (pageSize as PageSize) : 20,
  };
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시간 MM-DD HH:mm. 서버가 UTC 로 돌아도 어긋나지 않게 한다. */
export function formatAt(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString();
  return `${kst.slice(5, 10)} ${kst.slice(11, 16)}`;
}

/** 종 배지 글자. 미확인이 없으면 그리지 않는다. */
export function badgeText(unread: number): string {
  if (unread <= 0) return "";
  return unread > 99 ? "99+" : String(unread);
}
