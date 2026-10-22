// 공통코드 패널 저장의 순서와 결과 — 수정(PUT) → 삭제(DELETE, 상세 코드만) → 등록(POST). server action(src/app/code-groups/actions.ts ·
// src/app/bp-code-groups/actions.ts)에서 뺀 순수 함수라 api 호출 · 오류 해석 · 화면 무효화를 받아 쓰고, node --test 로 검사한다(code-save.test.ts).
// 등록을 마지막에 둔다 — 앞 단계가 실패하면 새 행은 보내지 않고 화면에 남는다(입력을 잃지 않는다).

/** 저장 한 단계. 이 순서로 보낸다. */
export type SaveStep = "수정" | "삭제" | "등록";

/** 실패 한 건. status 가 없으면 예상하지 못한 실패(5xx · 연결 실패)이고 message 는 일반 문구다. */
export type SaveFailure = { status?: number; message: string };

/**
 * anySaved: 실패한 단계 앞에서 무언가(수정이든 삭제든) 저장됐다 — saved 에 그 단계들, failed 는 실패한 단계, skipped 는 실패 때문에
 * 보내지 않은 뒤 단계다. refreshed: 화면 무효화(revalidatePath)를 마쳤다 — 무언가 저장됐는데 false 면 화면이 직접 다시 받아야 한다(router.refresh).
 */
export type SaveResult =
  | { ok: true; refreshed: boolean }
  | ({ ok: false; anySaved: boolean; saved: SaveStep[]; failed: SaveStep; skipped: SaveStep[]; refreshed: boolean } & SaveFailure);

/** 실패한 저장 결과. */
export type SaveFailed = Extract<SaveResult, { ok: false }>;

/** 서버 로그에 붙이는 앞 단계 저장 표시 — 「(수정 · 삭제분은 저장됨)」. 저장된 것이 없으면 빈 문자열. */
export const savedNote = (saved: readonly SaveStep[]) => (saved.length ? `(${saved.join(" · ")}분은 저장됨)` : "");

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
  /** saved — 이 실패 앞에서 이미 저장된 단계(서버 로그에 남긴다, savedNote). */
  failureOf: (error: unknown, what: SaveStep, saved: readonly SaveStep[]) => SaveFailure;
  refresh: () => boolean;
}): Promise<SaveResult> {
  const steps: [SaveStep, Run][] = [
    ["수정", update],
    ["삭제", remove],
    ["등록", create],
  ];
  const saved: SaveStep[] = [];
  for (const [n, [what, run]] of steps.entries()) {
    if (!run) continue;
    try {
      await run();
      saved.push(what);
    } catch (error) {
      const anySaved = saved.length > 0;
      const skipped = steps.slice(n + 1).flatMap(([step, later]) => (later ? [step] : []));
      return { ...failureOf(error, what, [...saved]), ok: false, anySaved, saved, failed: what, skipped, refreshed: anySaved ? refresh() : false };
    }
  }
  return saved.length ? { ok: true, refreshed: refresh() } : { ok: true, refreshed: false };
}

/**
 * 앞 단계는 저장되고 뒤 단계가 실패했다는 안내. 수정 → 삭제 → 등록 순서라 saved 는 그 앞부분이다.
 * 삭제가 실패해 등록을 보내지 않았으면(skipped) 새 행도 저장되지 않았다고 덧붙인다 — 화면에 남은 새 행을 저장된 것으로 오해하지 않게.
 */
export function partialSaved(saved: readonly SaveStep[], failed: SaveStep, skipped: readonly SaveStep[] = []): string {
  const done = saved.includes("수정") ? (saved.includes("삭제") ? "기존 행 수정과 삭제는" : "기존 행 수정은") : "행 삭제는";
  const notDone = failed === "등록" ? "새 행은 등록하지 못했습니다." : "지울 행은 삭제하지 못했습니다.";
  const notSent = skipped.includes("등록") ? " 새 행도 등록하지 않았습니다." : "";
  return `${done} 저장했습니다. ${notDone}${notSent}`;
}

/**
 * 실패를 화면에 어떻게 보일지. 409(중복)는 그 칸 아래 오류(conflict)로, 그 밖은 표 위 띠(band)로 보인다.
 * 앞 단계가 저장된 실패면 띠에 그 사실을 먼저 적는다 — 「저장하지 못했습니다」만 보이면 저장된 것도 날아간 줄 안다.
 */
export function failureView(result: SaveFailed): { band: string | null; conflict: string | null } {
  const conflict = result.status === 409 ? result.message : null;
  if (result.anySaved) {
    const partial = partialSaved(result.saved, result.failed, result.skipped);
    return { band: conflict ? partial : `${partial} ${result.message}`, conflict };
  }
  return { band: conflict ? null : result.message, conflict };
}
