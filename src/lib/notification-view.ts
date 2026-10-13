// 운영 알림함 화면의 순수 규칙 — 이동 경로 검사, 관련 업무 표시, URL 쿼리, 일시, 종 배지. 갈 업무 화면은 알림을 만든
// 업무 쪽이 정한 link 다(NOTIFY-16). 화면 · 종 · 메일 버튼(api WHALEERP-249 의 /notifications/{id}/open)이 모두 그 link 로 간다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { PAGE_SIZES, type PageSize } from "./staff-members.ts";

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

/**
 * 알림을 눌러 갈 경로. 알림을 만든 업무 쪽이 정한 link 를 그대로 쓴다(NOTIFY-16) — 운영 알림 쪽은 업무 화면 경로를 모른다.
 * api 와 DB 도 막지만 리다이렉트 직전에 한 번 더, 관리자 웹 안의 경로(`/` 로 시작, `//` · 백슬래시 · 공백 없음)만 보낸다.
 * 없거나 맞지 않으면 null — 알림함에서 「이동할 화면이 없습니다」를 보인다.
 */
export function safeLink(link: string | null): string | null {
  return link && link.startsWith("/") && !link.startsWith("//") && !/[\\\s]/.test(link) ? link : null;
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
