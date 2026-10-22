import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import type { ActionFailure } from "@/lib/role-group-actions";

// 권한 그룹 화면(플랫폼 권한 관리 · BP 권한 그룹 관리)이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다.
// 카드 · 띠 · 칸 오류는 메뉴 관리와 같이 쓴다(side-parts).

export { CARD, FailedBand, FieldMessage, InfoBand } from "@/components/site/side-parts";

/**
 * 막힌 이유 한글(api enum). 목록에 없거나 enum 을 못 받았으면 값(SELF_LINKED 같은 영문) 대신 fallback 을 보인다.
 */
export function reasonLabel(labels: EnumValue[], value: string, fallback: string): string {
  return labels.some((l) => l.value === value) ? labelOf(labels, value) : fallback;
}

/**
 * server action 호출 자체가 실패했을 때(연결 끊김 · 재배포로 action 을 못 찾음).
 * 쓰기(wrote)는 처리됐을 수도 있어 부르는 쪽이 화면을 새로 받는다 — 그 사실을 함께 말한다. 읽기는 다시 시도하라고만 한다.
 */
export const unknownResult =
  (what: string, wrote = true) =>
  (error: unknown): ActionFailure => {
    console.error(`권한 ${what} 호출 실패`, error);
    return {
      ok: false,
      message: wrote
        ? `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.`
        : `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
    };
  };

type Actor = { name: string | null; loginId: string } | null;
/** 등록자 · 수정자. 마이그레이션이 넣은 행이면 「시스템」 */
export const actorOf = (actor: Actor) => (actor ? (actor.name ?? actor.loginId) : "시스템");

/** 목록의 「일시 | 사람」 한 줄 — 상세의 등록일시 · 최종수정일시와 같은 모양. 사람은 이름(없으면 아이디), 시스템이 넣은 행은 「시스템」 */
export function WhenWho({ at, actor }: { at: string; actor: Actor }) {
  return (
    <span className="truncate">
      {formatDateTime(at)} <span className="text-erp-label">| {actorOf(actor)}</span>
    </span>
  );
}
