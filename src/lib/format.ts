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
