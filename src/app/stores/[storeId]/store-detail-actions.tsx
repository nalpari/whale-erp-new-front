"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, Radio, useToast } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formOfStore, toUpdateStoreInput } from "@/lib/store-form";
import type { StoreDetail, StoreStatus, StoreTransitions } from "@/lib/store-types";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { withoutStoreSearch } from "@/lib/store-scope";
import { closeBlockText, finalEuro, nextStatuses } from "@/lib/store-view";
import { deleteStoreAction, getStoreTransitionsAction, updateStoreAction, type ActionFailure } from "../actions";
import { StoreStatusBadge } from "../store-parts";
import { withBack } from "../stores-query";

/** 막힌 버튼의 이유. 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 감싸는 칸에 단다 */
function Blocked({ reason, children }: { reason?: string; children: React.ReactNode }) {
  return (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  );
}

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
  const can = usePagePermission();
  // 화면 주소는 탭 BP 를 붙인다. backHref 는 옛 경로(목록 쿼리)다
  const bp = useCurrentBp().bpCodeId;
  const at = (path: string) => bpPath(bp, path);
  const statusLabel = useCodeLabel("STORE_STATUS");
  const [dialog, setDialog] = useState<"status" | "delete" | null>(null);
  const [target, setTarget] = useState<StoreStatus | null>(null);
  const [transitions, setTransitions] = useState<StoreTransitions>(store.transitions);
  const [failure, setFailure] = useState<string | null>(null);
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
      ? "미운영 점포만 삭제할 수 있습니다. 운영을 끝내려면 상태 변경에서 폐점하세요."
      : !transitions.canDelete
        ? (closeBlockText(transitions) ?? "삭제 조건을 채우지 못했습니다.")
        : undefined);

  /** 실패를 팝업에 보인다. 결과를 모르거나 그 사이 바뀌었으면(404 · 409) 화면을 새로 받고, 결과를 모르면 확인해 달라고 덧붙인다 */
  const fail = (status: number | undefined, message: string) => {
    setFailure(status === undefined ? `${message} 화면을 다시 불러왔으니 처리됐는지 확인한 뒤 다시 시도해 주세요.` : message);
    if (status === undefined || status === 404 || status === 409) router.refresh();
  };

  const handleStatusOpen = () => {
    setFailure(null);
    setTarget(targets[0] ?? null);
    setDialog("status");
    // 조건은 그 사이 바뀌었을 수 있어 지금 기준으로 다시 받는다(진행 중 근로계약 등)
    startBusy(async () => {
      const result = await getStoreTransitionsAction(store.storeId).catch(UNKNOWN("상태 확인"));
      if (result.ok) setTransitions(result);
      else setFailure(result.message);
    });
  };

  const allowed =
    target === "OPERATING" ? !transitions.missingForOperation.length : target === "CLOSED" ? transitions.canClose : false;

  const handleStatusChange = () =>
    startBusy(async () => {
      if (!target) return;
      const input = toUpdateStoreInput({ ...formOfStore(store), storeStatus: target }, store.updatedAt);
      const result = await updateStoreAction(store.storeId, input).catch(UNKNOWN("상태 변경"));
      if (!result.ok) return fail(result.status, result.message);
      setDialog(null);
      toast(`점포상태를 ${statusLabel(target)}${finalEuro(statusLabel(target))} 바꿨습니다.`);
      router.refresh();
    });

  // 삭제 뒤 목록은 점포 검색을 「전체」로 비운다(지운 점포가 고른 점포 조건에 남지 않게). 다른 조건 · 보기는 그대로다(쪽은 1로 돌린다)
  const handleDelete = () =>
    startBusy(async () => {
      const result = await deleteStoreAction(store.storeId).catch(UNKNOWN("삭제"));
      // 이미 없는 점포(404)면 다시 받아도 404 화면만 남는다. 결과를 모르면 지워졌을 수도 있어 상세에 두지 않는다 — 둘 다 목록으로 보내고 알린다
      if (!result.ok && (result.status === undefined || result.status === 404)) {
        setDialog(null);
        toast(result.status === 404 ? "이미 지워진 점포입니다." : "삭제 결과를 확인하지 못했습니다. 목록에서 확인해 주세요.");
        return router.push(at(withoutStoreSearch(backHref)));
      }
      if (!result.ok) return fail(result.status, result.message);
      setDialog(null);
      toast("deleted");
      router.push(at(withoutStoreSearch(backHref)));
    });

  return (
    <>
      {!closed && (
        <>
          {can.update && targets.length > 0 && (
            <Blocked reason={blockedReason}>
              <Button variant="soft" onClick={handleStatusOpen} disabled={bpInactive}>
                상태 변경
              </Button>
            </Blocked>
          )}
          {can.delete && (
            <Blocked reason={deleteReason}>
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
              <Blocked reason={blockedReason}>
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
          onConfirm={handleStatusChange}
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
              // 부가서비스 구독 · 정산 대기 금액은 1차 범위 밖이라 뺐다 — 그 기능을 만들 때 다시 더한다.
              // 폐점일 안내 문구도 같이 뺐다(2026-10-19 점검 — 실사용자 확인).
              <div className="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]">
                <p className="font-semibold">폐점 조건</p>
                <ul className="mt-[6px] list-disc pl-[18px]">
                  <li className={transitions.inProgressContractCount ? "text-erp-off" : undefined}>
                    진행 중인 근로계약 <b className="font-semibold">{transitions.inProgressContractCount.toLocaleString("ko-KR")}건</b>
                    {transitions.inProgressContractCount ? " — 정리해야 할 근로계약이 있습니다" : ""}
                  </li>
                </ul>
              </div>
            )}
            {failure && <p role="alert" className="text-erp-off">{failure}</p>}
          </div>
        </ConfirmDialog>
      )}

      {can.delete && !closed && (
        <ConfirmDialog
          open={dialog === "delete"}
          title="점포를 삭제하시겠습니까?"
          confirmLabel="삭제"
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
            <p>삭제한 점포는 복구할 수 없습니다.</p>
          </div>
          {failure && <p role="alert" className="mt-[10px] text-erp-off">{failure}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
