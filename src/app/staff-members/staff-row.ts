// 직원 목록 한 줄을 화면 문구와 모양으로 바꾼다. 색과 문구는 데모(docs/demo/src/staff-sections.mjs)를 따른다.
// StaffJoinState · EmploymentType 라벨은 목 단계라 여기 둔다 — api 를 붙일 때 getEnum 으로 바꾼다. JOIN_GROUP_LABELS
// 는 화면 묶음이라 여기 남는다.
// 날짜는 모두 한국 날짜로 견준다. today 는 kstToday() 값(YYYY-MM-DD)을 받는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { EnumValue } from "../../lib/enums.ts";
import type { EmploymentType, JoinGroup, StaffMemberListItem } from "../../lib/staff-members.ts";

export type CellStyle = "badge-on" | "badge-off" | "badge-neutral" | "mark-on" | "mark-off" | "muted";
export interface Cell {
  text: string;
  style: CellStyle;
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = { FULL_TIME: "정직원", PART_TIME: "파트타이머" };
export const JOIN_GROUP_LABELS: Record<JoinGroup, string> = {
  JOINED: "가입 완료",
  INVITED: "초대 발송",
  LINK_HOLD: "연결 보류",
  AFFILIATION: "소속 추가 확인",
  UNDER_AGE: "가입 불가",
};

/** 갱신 예정으로 보이는 종료일까지의 날수. 갱신 예정 알림과 같다(okf/notify.md, S-JUWPXF). */
export const RENEWAL_NOTICE_DAYS = 30;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 시각(ISO)이나 날짜(YYYY-MM-DD)를 한국 날짜로. */
function kstDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(Date.parse(value) + KST_OFFSET_MS).toISOString().slice(0, 10);
}
/** from 에서 to 까지의 날수(같은 날이면 0). */
function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
const mmdd = (date: string) => date.slice(5);

/** 순번. 최근 등록이 먼저 오는 목록이라 전체 건수에서 거꾸로 센다(1쪽 첫 줄 = total). index 는 그 쪽 안의 0부터 순서다. */
export function rowNumber(total: number, page: number, pageSize: number, index: number): number {
  return total - (page - 1) * pageSize - index;
}

export function formatPhone(phone: string): string {
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  if (/^\d{10}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

export function joinCell(item: StaffMemberListItem, today: string): Cell {
  switch (item.joinState) {
    case "JOINED":
      return { text: "가입 완료", style: item.employmentStatus === "RETIRED" ? "badge-neutral" : "badge-on" };
    case "INVITED":
      return {
        text: item.invitation ? `초대 발송 · ${mmdd(kstDate(item.invitation.lastSentAt))}` : "초대 발송",
        style: "badge-off",
      };
    case "EXPIRED":
      return { text: "초대 만료", style: "badge-off" };
    case "REJECTED":
      return { text: "거절", style: "badge-off" };
    case "LINK_HOLD":
      return {
        text: item.linkHold ? `연결 보류 · ${dayDiff(kstDate(item.linkHold.heldAt), today)}일` : "연결 보류",
        style: "badge-off",
      };
    case "AFFILIATION_PENDING":
      return { text: "소속 추가 확인", style: "badge-on" };
    case "RETURN_PENDING":
      return { text: "복귀 확인", style: "badge-on" };
    case "UNDER_AGE":
      return { text: "가입 불가(만 19세 미만)", style: "badge-off" };
    default:
      return { text: "초안", style: "badge-neutral" };
  }
}

/**
 * 가입 초대 재발송 버튼을 보일지(WHALEERP-138). api 의 invitation.canResend 를 그대로 따른다 — api 가 재발송(POST /contracts/:id/send)이
 * 가입 초대 알림톡을 실제로 보낼 수 있을 때만 참으로 준다(WHALEERP-611: 가입 전 · 계정 없는 휴대폰 번호 · 계약 발송 대기 또는
 * 서명 대기 · 수락하지 않은 초대). 가입한 직원의 앱 알림 재발송은 근로계약 상세에서 한다.
 */
export function canResendInvitation(item: Pick<StaffMemberListItem, "invitation">): boolean {
  return !!item.invitation?.canResend;
}

/**
 * 상세 「초대」 줄 — 초대 유형 · 초대 상태 · 보낸 날(한국 날짜). 한글은 api enum(InvitationType · InvitationStatus)이고, 받지 못했거나
 * 목록에 없는 값은 영문 값 대신 그 조각을 뺀다. 초대가 없으면 「-」.
 */
export function invitationText(
  invitation: StaffMemberListItem["invitation"],
  typeLabels: readonly EnumValue[],
  statusLabels: readonly EnumValue[],
): string {
  if (!invitation) return "-";
  const label = (values: readonly EnumValue[], value: string) => values.find((v) => v.value === value)?.label;
  const parts = [label(typeLabels, invitation.invitationType), label(statusLabels, invitation.status), `보낸 날 ${kstDate(invitation.lastSentAt)}`];
  return parts.filter(Boolean).join(" · ");
}

export function contractCell(item: StaffMemberListItem, today: string): Cell | null {
  const c = item.contract;
  if (!c || !c.status) return null;
  switch (c.status) {
    case "DRAFT":
      return { text: "임시저장", style: "badge-neutral" };
    case "PENDING_SEND":
      return { text: "발송 대기", style: "badge-neutral" };
    case "PENDING_SIGNATURE": {
      const left = c.signDeadlineAt ? dayDiff(today, kstDate(c.signDeadlineAt)) : null;
      // 기한이 지났는데 아직 서명 대기면 만료 배치 전의 잠깐이다. 「D--1」로 보이지 않게 날수를 뺀다.
      return { text: left !== null && left >= 0 ? `서명 대기 · D-${left}` : "서명 대기", style: "badge-off" };
    }
    case "CORRECTION_REQUESTED":
      // 직원이 가입 값과 계약서 값이 달라 수정을 요청했다(본인 대조, WHALEERP-125) — 관리자가 고쳐 다시 보낼 차례
      return { text: "수정 요청", style: "badge-off" };
    case "SIGNED": {
      const left = c.endDate ? dayDiff(today, c.endDate) : null;
      // 종료일이 지난 체결 완료는 종료 배치 전의 잠깐이다. 갱신 예정이 아니다.
      return left !== null && left >= 0 && left <= RENEWAL_NOTICE_DAYS
        ? { text: `갱신 예정 D-${left}`, style: "badge-off" }
        : { text: "체결 완료", style: "badge-on" };
    }
    case "REJECTED":
      // 거부일은 따로 저장하지 않고 근로계약서의 최종 수정일로 보인다(2026-10-12 재영).
      return { text: c.updatedAt ? `거부 · ${mmdd(kstDate(c.updatedAt))}` : "거부", style: "badge-off" };
    case "EXPIRED":
      return { text: "만료", style: "badge-off" };
    case "ENDED":
      return { text: "종료", style: "badge-neutral" };
  }
}

/** 재직 칸. 가입 · 계약 · 재직 상태를 한눈에 보는 요약이다(데모). 위에서부터 처음 맞는 것. */
export function statusCells(item: StaffMemberListItem): Cell[] {
  if (item.employmentStatus === "RETIRED")
    return [{ text: item.retiredDate ? `퇴직 ${mmdd(item.retiredDate)}` : "퇴직", style: "muted" }];
  if (item.joinState === "LINK_HOLD") return [{ text: "확인 필요", style: "mark-off" }];
  if (item.joinState === "UNDER_AGE") return [{ text: "삭제 대상", style: "mark-off" }];
  if (item.joinState === "AFFILIATION_PENDING" || item.joinState === "RETURN_PENDING")
    return [{ text: "응답 대기", style: "muted" }];
  if (item.joinState !== "JOINED") return [{ text: "가입 대기", style: "muted" }];
  const status = item.contract?.status;
  if (status === "PENDING_SIGNATURE") return [{ text: "날인 대기", style: "mark-off" }];
  if (status === "CORRECTION_REQUESTED") return [{ text: "수정 필요", style: "mark-off" }];
  if (status === "REJECTED" || status === "EXPIRED") return [{ text: "재발송 필요", style: "mark-off" }];
  const cells: Cell[] = [{ text: "재직", style: "mark-on" }];
  if (item.retiredDate) cells.push({ text: `퇴직 예정 ${mmdd(item.retiredDate)}`, style: "badge-off" });
  return cells;
}

/** 상세의 재직 상태 칸. 목록 요약(statusCells)과 달리 재직 · 퇴직 예정 · 퇴직만 보인다 — 가입 · 계약 상태는 섞지 않는다. 값이 없으면(가림) 빈 배열. */
export function employmentStatusCells(item: StaffMemberListItem): Cell[] {
  if (item.employmentStatus === "RETIRED")
    return [{ text: item.retiredDate ? `퇴직 ${mmdd(item.retiredDate)}` : "퇴직", style: "muted" }];
  if (item.employmentStatus !== "EMPLOYED") return [];
  const cells: Cell[] = [{ text: "재직", style: "mark-on" }];
  if (item.retiredDate) cells.push({ text: `퇴직 예정 ${mmdd(item.retiredDate)}`, style: "badge-off" });
  return cells;
}
