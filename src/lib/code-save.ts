// 공통코드 패널 저장의 순서와 결과 — 수정(PUT) → 등록(POST). server action(src/app/code-groups/actions.ts)에서 뺀
// 순수 함수라 api 호출 · 오류 해석 · 화면 무효화를 받아 쓰고, node --test 로 검사한다(code-save.test.ts).

/** 실패 한 건. status 가 없으면 예상하지 못한 실패(5xx · 연결 실패)이고 message 는 일반 문구다. */
export type SaveFailure = { status?: number; message: string };

/**
 * updatesSaved: 수정 요청은 성공했고 등록에서 실패했다. refreshed: 화면 무효화(revalidatePath)를 마쳤다 —
 * 무언가 저장됐는데 false 면 화면이 직접 다시 받아야 한다(router.refresh).
 */
export type SaveResult = { ok: true; refreshed: boolean } | ({ ok: false; updatesSaved: boolean; refreshed: boolean } & SaveFailure);

/** 보낼 api 두 개. 비어 있는 쪽은 null 이다 — api 는 행이 하나도 없는 본문을 받지 않는다. */
export type SavePlan = { update: (() => Promise<void>) | null; create: (() => Promise<void>) | null };

/**
 * 패널 저장 내용을 api 두 개에 잇는다 — updates 는 수정, creates 는 등록, 둘 다 { items } 로 싼다.
 * 상세 코드는 두 본문의 행 모양이 같아 서로 바꿔 이어도 타입 검사가 잡지 못하므로 여기 한 곳에서 잇고 테스트한다.
 */
export function planSave<U, C>(
  input: { updates: U[]; creates: C[] },
  api: { update: (body: { items: U[] }) => Promise<void>; create: (body: { items: C[] }) => Promise<void> },
): SavePlan {
  return {
    update: input.updates.length ? () => api.update({ items: input.updates }) : null,
    create: input.creates.length ? () => api.create({ items: input.creates }) : null,
  };
}

/**
 * 두 번이라 한 트랜잭션이 아니다 — 수정이 실패하면 등록은 보내지 않고, 등록만 실패하면 수정분은 저장된 채로 남는다.
 * 하나라도 저장했을 때만 refresh 로 화면을 새로 받는다(refresh 는 던지지 않고 마쳤는지만 돌려준다). 둘 다 없으면 아무것도 하지 않는다.
 */
export async function saveUpdateThenCreate({
  update,
  create,
  failureOf,
  refresh,
}: SavePlan & {
  failureOf: (error: unknown, what: "수정" | "등록") => SaveFailure;
  refresh: () => boolean;
}): Promise<SaveResult> {
  if (!update && !create) return { ok: true, refreshed: false };
  if (update) {
    try {
      await update();
    } catch (error) {
      return { ...failureOf(error, "수정"), ok: false, updatesSaved: false, refreshed: false };
    }
  }
  if (create) {
    try {
      await create();
    } catch (error) {
      return { ...failureOf(error, "등록"), ok: false, updatesSaved: Boolean(update), refreshed: update ? refresh() : false };
    }
  }
  return { ok: true, refreshed: refresh() };
}

export const PARTIAL_SAVED = "기존 행 수정은 저장했습니다. 새 행은 등록하지 못했습니다.";

/**
 * 실패를 화면에 어떻게 보일지. 409(중복)는 그 칸 아래 오류(conflict)로, 그 밖은 표 위 띠(band)로 보인다.
 * 수정분이 저장된 실패면 띠에 그 사실을 먼저 적는다 — 「저장하지 못했습니다」만 보이면 수정분도 날아간 줄 안다.
 */
export function failureView(result: SaveFailure & { updatesSaved: boolean }): { band: string | null; conflict: string | null } {
  const conflict = result.status === 409 ? result.message : null;
  if (result.updatesSaved) return { band: conflict ? PARTIAL_SAVED : `${PARTIAL_SAVED} ${result.message}`, conflict };
  return { band: conflict ? null : result.message, conflict };
}
