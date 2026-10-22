// 공통코드 패널 저장의 순서와 결과 — 수정(PUT) → 삭제(DELETE, 상세 코드만) → 등록(POST). server action(src/app/code-groups/actions.ts ·
// src/app/bp-code-groups/actions.ts)에서 뺀 순수 함수라 api 호출 · 오류 해석 · 화면 무효화를 받아 쓰고, node --test 로 검사한다(code-save.test.ts).
// 등록을 마지막에 둔다 — 앞 단계가 실패하면 새 행은 보내지 않고 화면에 남는다(입력을 잃지 않는다).

/** 저장 한 단계. 이 순서로 보낸다. */
export type SaveStep = "수정" | "삭제" | "등록";

/** 실패 한 건. status 가 없으면 예상하지 못한 실패(5xx · 연결 실패)이고 message 는 일반 문구다. */
export type SaveFailure = { status?: number; message: string };

/**
 * updatesSaved: 실패한 단계 앞에서 무언가 저장됐다(saved 에 그 단계들, failed 는 실패한 단계). refreshed: 화면 무효화(revalidatePath)를
 * 마쳤다 — 무언가 저장됐는데 false 면 화면이 직접 다시 받아야 한다(router.refresh).
 */
export type SaveResult =
  | { ok: true; refreshed: boolean }
  | ({ ok: false; updatesSaved: boolean; saved: SaveStep[]; failed: SaveStep; refreshed: boolean } & SaveFailure);

type Run = (() => Promise<void>) | null;

/** 보낼 api. 비어 있는 쪽은 null 이다 — api 는 행이 하나도 없는 본문을 받지 않는다. 그룹 패널에는 삭제가 없다. */
export type SavePlan = { update: Run; create: Run; remove?: Run };

/**
 * 패널 저장 내용을 api 에 잇는다 — updates 는 수정, creates 는 등록에 { items } 로, deletes 는 삭제에 { itemCodes } 로 싼다.
 * 상세 코드는 두 본문의 행 모양이 같아 서로 바꿔 이어도 타입 검사가 잡지 못하므로 여기 한 곳에서 잇고 테스트한다.
 */
export function planSave<U, C>(
  input: { updates: U[]; creates: C[]; deletes?: string[] },
  api: {
    update: (body: { items: U[] }) => Promise<void>;
    create: (body: { items: C[] }) => Promise<void>;
    remove?: (body: { itemCodes: string[] }) => Promise<void>;
  },
): SavePlan {
  const { remove } = api;
  const deletes = input.deletes ?? [];
  return {
    update: input.updates.length ? () => api.update({ items: input.updates }) : null,
    create: input.creates.length ? () => api.create({ items: input.creates }) : null,
    remove: remove && deletes.length ? () => remove({ itemCodes: deletes }) : null,
  };
}

/**
 * 한 트랜잭션이 아니다 — 한 단계가 실패하면 뒤 단계는 보내지 않고, 앞 단계에서 저장한 것은 그대로 남는다.
 * 하나라도 저장했을 때만 refresh 로 화면을 새로 받는다(refresh 는 던지지 않고 마쳤는지만 돌려준다). 보낼 것이 없으면 아무것도 하지 않는다.
 */
export async function saveInOrder({
  update,
  remove = null,
  create,
  failureOf,
  refresh,
}: SavePlan & {
  failureOf: (error: unknown, what: SaveStep) => SaveFailure;
  refresh: () => boolean;
}): Promise<SaveResult> {
  const steps: [SaveStep, Run][] = [
    ["수정", update],
    ["삭제", remove],
    ["등록", create],
  ];
  const saved: SaveStep[] = [];
  for (const [what, run] of steps) {
    if (!run) continue;
    try {
      await run();
      saved.push(what);
    } catch (error) {
      const updatesSaved = saved.length > 0;
      return { ...failureOf(error, what), ok: false, updatesSaved, saved, failed: what, refreshed: updatesSaved ? refresh() : false };
    }
  }
  return saved.length ? { ok: true, refreshed: refresh() } : { ok: true, refreshed: false };
}

/** 앞 단계는 저장되고 뒤 단계가 실패했다는 안내. 수정 → 삭제 → 등록 순서라 saved 는 그 앞부분이다. */
export function partialSaved(saved: readonly SaveStep[], failed: SaveStep): string {
  const done = saved.includes("수정") ? (saved.includes("삭제") ? "기존 행 수정과 삭제는" : "기존 행 수정은") : "행 삭제는";
  const notDone = failed === "등록" ? "새 행은 등록하지 못했습니다." : "지울 행은 삭제하지 못했습니다.";
  return `${done} 저장했습니다. ${notDone}`;
}

export const PARTIAL_SAVED = partialSaved(["수정"], "등록");

/**
 * 실패를 화면에 어떻게 보일지. 409(중복)는 그 칸 아래 오류(conflict)로, 그 밖은 표 위 띠(band)로 보인다.
 * 앞 단계가 저장된 실패면 띠에 그 사실을 먼저 적는다 — 「저장하지 못했습니다」만 보이면 저장된 것도 날아간 줄 안다.
 */
export function failureView(
  result: SaveFailure & { updatesSaved: boolean; saved?: readonly SaveStep[]; failed?: SaveStep },
): { band: string | null; conflict: string | null } {
  const conflict = result.status === 409 ? result.message : null;
  if (result.updatesSaved) {
    const partial = partialSaved(result.saved ?? ["수정"], result.failed ?? "등록");
    return { band: conflict ? partial : `${partial} ${result.message}`, conflict };
  }
  return { band: conflict ? null : result.message, conflict };
}
