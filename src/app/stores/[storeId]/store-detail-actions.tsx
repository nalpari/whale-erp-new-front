"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Blocked, Button, ConfirmDialog, Radio, useToast } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formOfStore, toUpdateStoreInput } from "@/lib/store-form";
import type { StoreDetail, StoreStatus, StoreTransitions } from "@/lib/store-types";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useCurrentBp, usePagePermission, useRefreshStores, useScope } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { withoutDeletedStore } from "@/lib/store-scope";
import { deleteBlockText, finalEuro, nextStatuses } from "@/lib/store-view";
import { CLOSING_UNKNOWN_RESULT_NOTE, OPEN_CHECK_IN, type StoreClosingResult } from "@/lib/store-closing";
import { deleteStoreAction, getStoreTransitionsAction, updateStoreAction, type ActionFailure } from "../actions";
import { StoreStatusBadge } from "../store-parts";
import { ClosingCheckList, ClosingCondition, ClosingResultDialog, hasClosingResult } from "../store-closing-parts";
import { WarnBand } from "@/components/site/side-parts";
import { withBack } from "../stores-query";
import { kstToday } from "@/lib/staff-members";

/** 확인창 안에서 어떤 점포인지 — platform-admins/admin-parts.tsx 의 WhoList 와 같은 모양(화면마다 로컬로 둔다). */
function WhoList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[60px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-erp-label">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** server action 호출 자체가 실패했다 — 결과를 모른다(status 없음). 다시 받을지는 부르는 쪽이 정한다 */
const UNKNOWN =
  (what: string) =>
  (error: unknown): ActionFailure => {
    console.error(`점포 ${what} 호출 실패`, error);
    return { ok: false, message: `${what} 결과를 확인하지 못했습니다.` };
  };

/**
 * 상세 제목 줄의 버튼 — [상태 변경] [삭제] [수정] [목록](데모 stores/detail).
 * 상태 변경 팝업은 열 때 운영 · 폐점 조건을 지금 기준으로 다시 받고, 갈 수 있는 상태만 보인다(미운영→운영 · 폐점, 운영→폐점).
 * 폐점은 되돌릴 수 없어 조건 팝업 다음에 확인 창을 한 번 더 거친다([이전]은 조건 팝업으로 돌아간다).
 * 폐점 조건은 퇴근하지 않은 출근 0건이다(근로계약은 막지 않는다). 확인 창에 폐점하면 함께 처리될 것(퇴직 · 대기 계약 종료)을 보이고,
 * 저장 뒤 처리한 것이 있으면 결과 창을 띄운다. 확인과 저장 사이에 출근이 생기면(409 OPEN_CHECK_IN) 조건 팝업으로 돌아간다.
 * 상태만 바꾸는 저장도 수정(PUT)으로 보낸다 — 화면 전체를 보내야 해서 상세 값을 그대로 싣고 상태만 바꾼다.
 * 폐점 점포는 수정 · 삭제 · 상태 변경이 없다. 소속 BP 가 미사용이면 쓰는 버튼을 막는다(api 도 409 로 막는다).
 * 메뉴 권한(로그인 정보)으로 상태 변경 · 수정은 update, 삭제는 delete 가 있을 때 보인다 — 막는 것은 api 다.
 */
export function StoreDetailActions({
  store,
  backHref,
  requirementLabels,
}: {
  store: StoreDetail;
  backHref: string;
  /** 운영 조건 한글(GET /enums/StoreOperationRequirement). 못 받았으면 빈 목록 — 값을 그대로 보인다 */
  requirementLabels: EnumValue[];
}) {
  const router = useRouter();
  const toast = useToast();
  // 상태 변경 · 삭제 뒤 헤더 범위 선택기 · 점포 고르기를 바로 맞춘다(폐점은 회색, 지운 점포는 빠진다)
  const refreshStores = useRefreshStores();
  const [scope] = useScope();
  const can = usePagePermission();
  // 화면 주소는 탭 BP 를 붙인다. backHref 는 옛 경로(목록 쿼리)다
  const bp = useCurrentBp().bpCodeId;
  const at = (path: string) => bpPath(bp, path);
  const statusLabel = useCodeLabel("STORE_STATUS");
  const [dialog, setDialog] = useState<"status" | "close-confirm" | "delete" | null>(null);
  const [target, setTarget] = useState<StoreStatus | null>(null);
  const [transitions, setTransitions] = useState<StoreTransitions>(store.transitions);
  const [failure, setFailure] = useState<string | null>(null);
  /** 폐점 저장 결과 — 처리한 것이 있을 때 결과 창을 연다 */
  const [closingResult, setClosingResult] = useState<StoreClosingResult | null>(null);
  /**
   * 폐점 결과를 모를 때(5xx · 연결 끊김)의 안내 — 폐점이 실제로 됐으면 화면을 다시 받으며 폐점 점포가 되어 상태 변경 창이 사라지므로,
   * 그 창 밖의 따로 띄우는 창으로 알린다(결과 창과 같은 자리)
   */
  const [closingUnknown, setClosingUnknown] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const closed = store.storeStatusCode === "CLOSED";
  const bpInactive = store.bpAccountStatusCode !== "ACTIVE";
  // 상세 위 안내와 같은 표현 — 상태(미사용 · 탈퇴)를 밝힌다(2026-10-28 사용자 지정)
  const accountStatus = useCodeLabel("ACCOUNT_STATUS");
  const blockedReason = bpInactive ? `이 점포가 속한 BP가 ${accountStatus(store.bpAccountStatusCode)} 상태로, 조회 기능만 이용할 수 있습니다.` : undefined;
  const targets = nextStatuses(store.storeStatusCode).filter((s) => s !== store.storeStatusCode);

  const deleteReason =
    blockedReason ??
    (store.storeStatusCode !== "NOT_OPERATING"
      ? "미운영 점포만 삭제할 수 있습니다. 점포 운영을 종료하려면 '상태 변경'에서 '폐점'으로 변경해 주세요."
      : !transitions.canDelete
        ? (deleteBlockText(transitions) ?? "삭제 조건을 충족하지 않아 삭제할 수 없습니다.")
        : undefined);

  /** 실패를 팝업에 보인다. 결과를 모르거나 그 사이 바뀌었으면(404 · 409) 화면을 새로 받고, 결과를 모르면 확인해 달라고 덧붙인다 */
  const fail = (status: number | undefined, message: string) => {
    setFailure(status === undefined ? `${message} 화면을 다시 불러왔으니 처리됐는지 확인한 뒤 다시 시도해 주세요.` : message);
    if (status === undefined || status === 404 || status === 409) {
      router.refresh();
      refreshStores();
    }
  };

  // 조건은 그 사이 바뀌었을 수 있어 지금 기준으로 다시 받는다(퇴근하지 않은 출근 · 폐점하면 처리될 것 등).
  // keep 은 먼저 보인 문구(409 OPEN_CHECK_IN 의 api 문구) — 다시 받기가 실패해도 지우지 않고 뒤에 잇는다.
  // 다시 받기가 실패하면 페이지를 불러올 때의 옛 값으로 되돌릴 수 없는 폐점을 하지 않게 폐점을 막고 옛 확인 값을 지운다(수정 화면 checkClose 와 같다)
  const reloadTransitions = (keep?: string) =>
    startBusy(async () => {
      const result = await getStoreTransitionsAction(store.storeId).catch(UNKNOWN("상태 확인"));
      if (result.ok) return setTransitions(result);
      setTransitions((t) => ({ ...t, canClose: false, closing: null }));
      setFailure(`${keep ? `${keep} ` : ""}${result.message} 조건을 확인하지 못해 폐점은 할 수 없습니다. 창을 닫고 다시 열어 주세요.`);
    });

  const handleStatusOpen = () => {
    setFailure(null);
    setTarget(targets[0] ?? null);
    setDialog("status");
    reloadTransitions();
  };

  /** 폐점 확인 창의 [이전] — 조건 팝업으로 돌아가며 조건을 다시 받는다. 폐점이 막혀(409 등) 돌아온 때 옛 조건을 보이지 않게 한다. 실패 문구 · 고른 상태는 둔다 */
  const handleBackToStatus = () => {
    setDialog("status");
    reloadTransitions();
  };

  const allowed =
    target === "OPERATING" ? !transitions.missingForOperation.length : target === "CLOSED" ? transitions.canClose : false;

  const handleStatusChange = () =>
    startBusy(async () => {
      if (!target) return;
      const input = toUpdateStoreInput({ ...formOfStore(store), storeStatus: target }, store.updatedAt);
      const result = await updateStoreAction(store.storeId, input).catch(UNKNOWN("상태 변경"));
      // 확인과 저장 사이에 퇴근하지 않은 출근이 생겼다 — 아무것도 저장되지 않았다. api 문구를 보이고 조건 팝업으로 돌아가 막힘을 다시 받는다.
      // 다시 받기가 실패해도 옛 「0건」 · 열린 버튼이 남지 않게, 받기 전에 막힘으로 두고 옛 확인 값을 지운다
      if (!result.ok && result.code === OPEN_CHECK_IN) {
        setFailure(result.message);
        setTransitions((t) => ({ ...t, canClose: false, closing: null }));
        setDialog("status");
        return reloadTransitions(result.message);
      }
      // 폐점 결과를 모르면 퇴직 · 계약 종료도 이미 끝났을 수 있다. 폐점됐으면 화면을 다시 받아 상태 변경 창이 사라지므로
      // 창 안 문구가 아니라 따로 띄우는 창으로 알린다
      if (!result.ok && target === "CLOSED" && result.status === undefined) {
        setDialog(null);
        setClosingUnknown(`${result.message} ${CLOSING_UNKNOWN_RESULT_NOTE}`);
        router.refresh();
        refreshStores();
        return;
      }
      if (!result.ok) return fail(result.status, result.message);
      setDialog(null);
      // 폐점으로 직원 퇴직 · 계약 종료를 했으면 결과 창으로 알린다. 그 밖에는 토스트 하나만 — 바꾼 상태는 화면에 보이고,
      // 헤더 점포 목록이 바뀐 것은 따로 알리지 않는다(2026-11-03 사용자 지정)
      if (hasClosingResult(result.closing)) setClosingResult(result.closing);
      else toast("점포상태가 변경되었습니다.");
      router.refresh();
      refreshStores({ quiet: true });
    });

  // 삭제 뒤 목록은 점포 검색이 헤더 범위와 어긋나지 않게 한다(2026-10-30 사용자 결정 — 전엔 「전체」로 비워 헤더 「직영 9개」 · 필터 「전체」로 갈렸다).
  // 목록에서 고른 점포가 있으면 지운 점포만 빼고, 없으면 헤더 범위로 다시 채운다(withoutDeletedStore). 다른 조건 · 보기는 그대로다(쪽은 1로 돌린다)
  const listAfterDelete = () => at(withoutDeletedStore(backHref, store.storeId, scope));
  const handleDelete = () =>
    startBusy(async () => {
      const result = await deleteStoreAction(store.storeId).catch(UNKNOWN("삭제"));
      // 이미 없는 점포(404)면 다시 받아도 404 화면만 남는다. 결과를 모르면 지워졌을 수도 있어 상세에 두지 않는다 — 둘 다 목록으로 보내고 알린다
      if (!result.ok && (result.status === undefined || result.status === 404)) {
        setDialog(null);
        toast(result.status === 404 ? "이미 지워진 점포입니다." : "삭제 결과를 확인하지 못했습니다. 목록에서 확인해 주세요.");
        refreshStores();
        return router.push(listAfterDelete());
      }
      if (!result.ok) return fail(result.status, result.message);
      setDialog(null);
      toast("deleted");
      refreshStores();
      router.push(listAfterDelete());
    });

  return (
    <>
      {!closed && (
        <>
          {can.update && targets.length > 0 && (
            <Blocked reason={blockedReason} place="bottom">
              <Button variant="soft" onClick={handleStatusOpen} disabled={bpInactive}>
                상태 변경
              </Button>
            </Blocked>
          )}
          {can.delete && (
            <Blocked reason={deleteReason} place="bottom">
              <Button
                variant="soft"
                onClick={() => {
                  setFailure(null);
                  setDialog("delete");
                }}
                disabled={Boolean(deleteReason)}
              >
                삭제
              </Button>
            </Blocked>
          )}
          {can.update &&
            (bpInactive ? (
              <Blocked reason={blockedReason} place="bottom">
                <Button variant="soft" disabled>
                  수정
                </Button>
              </Blocked>
            ) : (
              <Button variant="soft" href={at(withBack(`/stores/${store.storeId}/edit`, backHref))}>
                수정
              </Button>
            ))}
        </>
      )}
      <Button href={at(backHref)}>목록</Button>

      {can.update && !closed && targets.length > 0 && (
        <ConfirmDialog
          open={dialog === "status"}
          title="상태 변경"
          wide
          confirmLabel={target ? `${statusLabel(target)}${finalEuro(statusLabel(target))} 변경` : "변경"}
          busy={busy}
          confirmDisabled={!allowed}
          // 폐점은 되돌릴 수 없어 수정 화면처럼 확인 창을 한 번 더 거친다(2026-10-29 사용자 결정). 조건 팝업에는 폐점일 안내를 적지 않는다(10-19)
          // 넘어갈 때 앞 팝업의 실패 문구를 지운다 — 남으면 아직 누르지 않은 폐점이 실패한 것처럼 보인다(조건은 api 가 다시 본다)
          onConfirm={
            target === "CLOSED"
              ? () => {
                  setFailure(null);
                  setDialog("close-confirm");
                }
              : handleStatusChange
          }
          onCancel={() => setDialog(null)}
        >
          <div className="flex flex-col gap-[12px]">
            <p className="flex items-center gap-[6px]">
              현재 상태 <StoreStatusBadge status={store.storeStatusCode} />
            </p>
            {targets.length > 1 && (
              <div role="radiogroup" aria-label="바꿀 상태" className="flex gap-[18px]">
                {targets.map((s) => (
                  <Radio key={s} name="storeStatus" label={statusLabel(s)} checked={target === s} onChange={() => setTarget(s)} />
                ))}
              </div>
            )}
            {target === "OPERATING" && (
              // 라벨(타이틀)은 상태와 상관없이 기본 글자색 그대로 둔다 — 색은 뒤의 상태 글자에만 준다. 모자라면
              // 빨강, 다 갖췄으면 기본색 볼드로 "완료"를 강조한다(2026-10-19 점검 — 실사용자 확인). 라벨 한글은
              // 상세 화면과 같은 GET /enums/StoreOperationRequirement 출처를 쓴다. 목록에 없는 조건(BP_INACTIVE
              // 등)은 혼자 더 뜨는 모자란 조건 줄로 보여 체크리스트 밖에서 조용히 막히지 않게 한다.
              <div className="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]">
                <p className="font-semibold">운영 조건</p>
                <ul className="mt-[6px] list-disc pl-[18px]">
                  {(
                    [
                      { code: "BUSINESS_VERIFICATION", missingWord: "미인증" },
                      { code: "COORDINATES", missingWord: "미저장" },
                    ] as const
                  ).map(({ code, missingWord }) => {
                    const missing = transitions.missingForOperation.includes(code);
                    return (
                      <li key={code}>
                        {labelOf(requirementLabels, code)} - {missing ? <span className="text-erp-off">{missingWord}</span> : <b className="font-semibold">완료</b>}
                      </li>
                    );
                  })}
                  {transitions.missingForOperation
                    .filter((m) => m !== "BUSINESS_VERIFICATION" && m !== "COORDINATES")
                    .map((m) => (
                      <li key={m}>
                        {labelOf(requirementLabels, m)} - <span className="text-erp-off">미충족</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {target === "CLOSED" && (
              // 폐점 조건은 퇴근하지 않은 출근 0건 하나다 — 근로계약은 막지 않는다(api 2026-11-04). 부가서비스 구독 · 정산 대기 금액은
              // 1차 범위 밖이라 뺐다 — 그 기능을 만들 때 다시 더한다. 폐점일 안내 문구도 같이 뺐다(2026-10-19 점검 — 실사용자 확인).
              <ClosingCondition counts={transitions.closing?.total} />
            )}
            {failure && <p role="alert" className="text-erp-off">{failure}</p>}
          </div>
        </ConfirmDialog>
      )}

      {can.update && !closed && targets.includes("CLOSED") && (
        <ConfirmDialog
          open={dialog === "close-confirm"}
          title="폐점으로 변경할까요?"
          wide
          confirmLabel="폐점으로 변경"
          cancelLabel="이전"
          busy={busy}
          onConfirm={handleStatusChange}
          onCancel={handleBackToStatus}
        >
          {/* 폐점일 · 되돌릴 수 없음을 한 문장에 이어 어색했다 — 두 줄로 나누고 날짜를 적는다. BP 휴일 안내는 뺐다(2026-11-03 사용자 지정) */}
          <p>폐점으로 변경하면 되돌릴 수 없습니다.</p>
          <p>폐점일은 오늘({kstToday()})입니다.</p>
          {/* 폐점하면 함께 처리될 것 — 조건 팝업을 열 때 받은 확인 값이다. 그 사이 수가 바뀌어도 저장은 그대로 되고 실제 처리한 수는 결과 창이 보인다.
              그 사이 퇴근하지 않은 출근이 생겼을 때만 저장(PUT)이 막는다(409 OPEN_CHECK_IN). 확인 값이 없으면 목록 대신 무엇이 처리되는지 알린다 */}
          <ClosingCheckList counts={transitions.closing?.total ?? null} />
          {failure && <p role="alert" className="mt-[10px] text-erp-off">{failure}</p>}
        </ConfirmDialog>
      )}

      <ClosingResultDialog result={closingResult} onClose={() => setClosingResult(null)} />
      {/* 폐점 결과를 모를 때 — 폐점 점포가 되어도 남도록 !closed 조건 밖에 둔다 */}
      <ConfirmDialog
        open={Boolean(closingUnknown)}
        title="폐점 결과를 확인하지 못했습니다."
        wide
        cancelLabel={null}
        onConfirm={() => setClosingUnknown(null)}
        onCancel={() => setClosingUnknown(null)}
      >
        <p>{closingUnknown}</p>
        <p className="mt-[6px] text-erp-label">화면을 다시 불러왔습니다. 점포상태가 폐점이면 폐점된 것입니다.</p>
      </ConfirmDialog>

      {can.delete && !closed && (
        <ConfirmDialog
          open={dialog === "delete"}
          title="점포를 삭제하시겠습니까?"
          confirmLabel="삭제"
          // 1팀 화면은 빨간 버튼을 쓰지 않는다 — 되돌릴 수 없는 삭제도 기본 버튼(2026-11-03 사용자 지적, 전엔 2026-10-29 위험 색)
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        >
          <div className="flex flex-col gap-[12px]">
            <WhoList
              rows={[
                ["점포명", store.name],
                ["점포유형", <CodeLabel key="type" group="STORE_TYPE" value={store.storeTypeCode} />],
                ["점포코드", store.storeCode],
              ]}
            />
            {/* 삭제하면 어떻게 되는지까지 알린다 — 놓치면 안 되는 안내라 빨간 안내 상자(WarnBand)로 둔다(2026-11-03 사용자 지정) */}
            <WarnBand>{"점포를 삭제하면 점포 목록과 상단 점포 선택 항목에서 제외됩니다.\n삭제된 점포는 복구할 수 없습니다."}</WarnBand>
          </div>
          {failure && <p role="alert" className="mt-[10px] text-erp-off">{failure}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
