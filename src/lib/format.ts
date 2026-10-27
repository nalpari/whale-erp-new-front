// 화면 표시용 형식. 서버(Node)와 브라우저가 같은 글자를 내야 hydration 이 어긋나지 않으므로 시간대를 늘 한국으로 고정한다.

const DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DATE = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

/** ISO 일시 → `2026-10-13 09:05`(한국 시간). 값이 없거나 깨졌으면 빈 문자열. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : DATE_TIME.format(date);
}

/**
 * 등록 뒤 고친 적이 있는지 — 등록만 한 행은 최종수정일시가 등록일시와 같다. 1팀 화면은 같으면 최종수정을 「-」로 둔다(2026-10-27 사용자 요청).
 * 초까지 견준다(사용자 지정) — 등록 때 두 값이 따로 찍혀 ms 가 어긋날 수 있어 1초 안쪽은 같은 것으로 본다. 값이 없거나 깨졌으면 고친 적 없는 것으로 본다.
 * 관리자 등록은 초기 비밀번호 메일을 보낸 뒤 api 가 미발송 표시를 끄며 updatedAt 이 몇 초 늦게 찍혀, 화면에는 같은 분이어도 최종수정이 보인다.
 */
export function wasUpdated(createdAt: string | null | undefined, updatedAt: string | null | undefined): boolean {
  if (!createdAt || !updatedAt) return false;
  const gap = Date.parse(updatedAt) - Date.parse(createdAt);
  return Number.isFinite(gap) && Math.abs(gap) >= 1000;
}

/** ISO 일시 → `2026-10-13`(한국 시간, 날짜만). 값이 없거나 깨졌으면 빈 문자열. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : DATE.format(date);
}

/**
 * 하이픈 없는 전화번호 → `010-1234-5678` · `02-123-4567` · `031-123-4567` · `0507-2033-1334`(050X 평생번호 12자리).
 * 숫자 9~11자리(02 국번은 9자리부터)나 050X 12자리가 아니면 그대로 둔다.
 */
export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return "";
  if (/^050[0-9]{9}$/.test(digits)) return digits.replace(/^([0-9]{4})([0-9]{4})([0-9]{4})$/, "$1-$2-$3");
  if (!/^[0-9]{9,11}$/.test(digits)) return digits;
  if (digits.startsWith("02")) return digits.replace(/^(02)([0-9]{3,4})([0-9]{4})$/, "$1-$2-$3");
  return digits.replace(/^([0-9]{3})([0-9]{3,4})([0-9]{4})$/, "$1-$2-$3");
}
