"use client";

import { OwnerTag } from "@/components/site/code-editor/owner-tag";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, DataTable, TextField, Toggle, useToast, type Column } from "@/components/common";
import {
  buildSaveItemsInput,
  codePanelAccess,
  conflictCode,
  dropCreatedAdded,
  followSameRows,
  itemsDirty,
  hasPending,
  itemsDeletable,
  renumberAdded,
  savedToast,
  unusableCodeMessage,
  withKeptPending,
  type ItemDraft,
} from "@/lib/code-drafts";
import { failureView } from "@/lib/code-save";
import { codeFormatError, duplicateCodes, normalizeCode } from "@/lib/code-validation";
import type { CodeGroup, CodeItem } from "@/lib/codes";
import { usePagePermission } from "@/components/site/session-gate";
import { saveCodeItemsAction } from "./actions";
import { CodePanel, FieldErrors, GroupHead, SaveFailedBand, UNKNOWN_RESULT } from "@/components/site/code-editor/code-panel";
import { useUnsavedChanges } from "@/components/site/code-editor/unsaved-changes";
import { useRowReorder } from "@/components/site/code-editor/use-row-reorder";
import { DeletePending, DeleteToggle, Struck } from "@/components/site/code-editor/delete-mark";

// 오른쪽 상세 코드 목록 — 고른 그룹의 플랫폼 원본 상세 코드. BP전용 코드는 api 가 빼고 준다.
// 상세 코드에는 관리 주체 칸이 없다 — 소속 그룹을 따른다(PL-VOCZCE). SERVICE 그룹이면 상세 코드가 서비스 코드, 코드명이 서비스명이다.
// 기존 코드는 코드명 · 사용 상태만 고친다. 서비스 코드 사용 끄기도 확인창 없이 저장할 때 반영한다.
// 플랫폼제공 그룹의 기존 코드는 어느 것이든 [삭제]로 지울 행으로 표시해 두고(플랫폼고정 그룹은 사용 상태로만 관리 — 삭제 칸이 없다) [저장] 때 지운다(삭제 권한, 논리 삭제). 지운 코드를 다시 등록하면 api 가 그 행의 삭제를 풀어 되살린다(2026-10-22).
// [추가]를 누를 때마다 맨 끝에 입력 행이 하나씩 생기고, [저장] 한 번으로 바뀐 행 · 지울 행 · 새 행을 함께 보낸다(수정 → 삭제 → 등록, actions.ts).
// 새 코드는 기존 코드와도, 다른 새 행과도 겹칠 수 없다. 새 행은 저장 전에 이동 칸의 [×]로 뺄 수 있다.
// 표시 순서는 숫자로만 보이고 직접 입력하지 않는다. 손잡이로 끌거나 ↑ · ↓ 로 옮기면 1부터 다시 매긴다.

type Draft = ItemDraft;

const toDraft = (i: CodeItem): Draft => ({ ...i, key: i.itemCode, added: false });

export function CodeItemPanel({
  group,
  items,
  ownerLabel,
  loadFailed,
}: {
  group?: CodeGroup;
  items: CodeItem[];
  ownerLabel?: string;
  /** 고른 그룹의 상세 코드를 불러오지 못했다. 그룹 목록은 그대로 쓰고 이 패널만 막는다. */
  loadFailed?: boolean;
}) {
  // 메뉴 권한(로그인 정보)으로 보인다 — 막는 것은 api 다. api 는 기존 행 수정(수정 권한) · 삭제(삭제 권한) · 새 행 등록(등록 권한)이 따로다.
  // 그래서 기존 행 고치기 · 순서 옮기기는 수정 권한, [추가]와 새 행 입력 · 빼기는 등록 권한, [삭제]는 삭제 권한, [저장]은 셋 중 하나만 있어도 보인다.
  // 플랫폼고정 그룹은 상세 코드를 지우지 않는다(사용 상태로만 관리 — api 가 409 로 막는다) — 삭제 칸을 두지 않는다
  const permission = usePagePermission();
  const { manage, canAdd, canDelete, canSave } = codePanelAccess({
    ...permission,
    delete: permission.delete && itemsDeletable(group?.manageOwnerCode),
    loadFailed,
  });
  const isService = group?.groupCode === "SERVICE";
  const router = useRouter();
  const toast = useToast();
  const { setDirty } = useUnsavedChanges();
  const [drafts, setDrafts] = useState(() => items.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  // 저장을 시작한 목록. 저장할 때마다 두고, 다음에 오는 목록이 바로 그 목록을 대신하면 아직 저장하지 못한 새 행을 그 뒤에
  // 이어 두고 지울 행 표시도 다시 얹는다(한 번 쓰고 지운다 — 뒤 단계가 실패했거나 결과를 모를 때 입력을 잃지 않게). 완전히 성공했으면 저장 처리가 등록한 새 행을
  // 걷어 낸다. 그룹을 바꾸면 패널이 새로 그려져 함께 사라진다(key=그룹 코드).
  const [savingFrom, setSavingFrom] = useState<CodeItem[] | null>(null);
  const nextId = useRef(1);

  // 저장 뒤 서버가 새 목록을 주면 그 값으로 다시 시작한다. 새 행 · 지울 행을 이어 둘 때(savingFrom)는 오류 · 띠도 남긴다.
  // 왼쪽 패널이 저장해 화면 전체가 다시 그려진 것뿐이면(상세 코드 값이 같으면) 고치던 값을 그대로 둔다.
  const [shown, setShown] = useState(items);
  if (items !== shown) {
    const sameRows = JSON.stringify(items) === JSON.stringify(shown);
    setShown(items);
    // 저장 중에 같은 내용의 목록이 새 참조로 오면(왼쪽 패널 저장 등) 저장 기준도 그 참조로 옮긴다(followSameRows)
    if (sameRows) setSavingFrom(followSameRows(savingFrom, shown, items));
    else {
      const next = renumberAdded(withKeptPending(items.map(toDraft), drafts, savingFrom === shown));
      setSavingFrom(null);
      setDrafts(next);
      if (!hasPending(next)) {
        setErrors({});
        setFailure(null);
      }
    }
  }

  const original = new Map(items.map((i) => [i.itemCode, i]));
  const addedRows = drafts.filter((d) => d.added);
  const dirty = itemsDirty(drafts, items);

  useEffect(() => setDirty("items", dirty), [dirty, setDirty]);
  // 그룹을 바꾸면 이 패널은 새로 그려진다. 사라질 때 변경 표시를 지운다.
  useEffect(() => () => setDirty("items", false), [setDirty]);

  const update = (key: string, patch: Partial<Draft>) => setDrafts((rows) => rows.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const handleAdd = () => {
    const key = `new-${nextId.current++}`;
    setDrafts((rows) => renumberAdded([...rows, { key, itemCode: "", label: "", status: "ACTIVE", sortOrder: 0, added: true }]));
  };

  const handleRemove = (key: string) => {
    const rows = renumberAdded(drafts.filter((r) => r.key !== key));
    setDrafts(rows);
    // 오류를 보이던 중이면 남은 행으로 다시 검사한다 — 겹치던 짝을 뺐으면 그 오류도 사라져야 한다.
    if (Object.keys(errors).length) setErrors(validate(rows));
  };

  const codeName = isService ? "서비스 코드" : "상세 코드";
  const labelName = isService ? "서비스명" : "코드명";
  /** 오류 문구에서 행을 가리키는 이름 — 새 행은 입력한 코드, 비었으면 몇 번째 새 행인지. */
  const rowName = (d: Draft, rows = drafts) =>
    d.added ? (d.itemCode ? `새 ${codeName} ${d.itemCode}` : `새 행 ${rows.filter((r) => r.added).indexOf(d) + 1}`) : d.itemCode;

  const validate = (rows: Draft[] = drafts): Record<string, string> => {
    const next: Record<string, string> = {};
    const addedRows = rows.filter((d) => d.added);
    for (const d of rows) if (!d.deleted && !d.label.trim()) next[`label:${d.key}`] = `${rowName(d, rows)} — ${labelName}을 입력해 주세요.`;

    // 기존 코드와 겹치는 것, 새 행끼리 겹치는 것을 한 번에 찾는다.
    const codes = addedRows.map((d) => normalizeCode(d.itemCode));
    const repeated = duplicateCodes(
      items.map((i) => i.itemCode),
      codes,
    );
    addedRows.forEach((d, n) => {
      const code = codes[n];
      const formatError = codeFormatError(code);
      if (formatError) next[`code:${d.key}`] = `${rowName(d, rows)} — ${formatError}`;
      else if (repeated.has(code)) {
        const same = original.get(code);
        next[`code:${d.key}`] = same
          ? `이 그룹에 이미 있는 상세 코드입니다 — ${code} · ${same.label} (표시 순서 ${same.sortOrder}). 다른 코드를 입력해 주세요.`
          : `새로 추가한 행끼리 ${codeName}가 겹칩니다 — ${code}. 한 행만 남겨 주세요.`;
      }
    });
    return next;
  };

  const handleSave = () => {
    if (!group) return;
    const found = validate();
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return;

    const input = buildSaveItemsInput(drafts, items);
    setSavingFrom(items);
    startSaving(async () => {
      // 요청 자체가 끊기면(연결 끊김 · 재배포로 action 을 못 찾음) 서버에서는 저장됐을 수 있다 — 오류 화면으로 넘기지 않고
      // 목록을 다시 받아 띠로 알린다. 저장 안 됐으면 목록이 같아 입력값이 그대로, 수정만 됐으면 새 행이 이어진다(savingFrom).
      const result = await saveCodeItemsAction(group.groupCode, input).catch((error: unknown) => {
        console.error("상세 코드 저장 요청 실패", group.groupCode, error);
        return null;
      });
      if (!result) {
        router.refresh();
        return setFailure(UNKNOWN_RESULT);
      }
      // 저장했는데 서버가 화면을 무효화하지 못했으면 직접 다시 받는다 — 새 목록이 와야 등록한 행 · 바뀐 값이 저장된 행으로 선다
      if ((result.ok || result.anySaved) && !result.refreshed) router.refresh();
      if (result.ok) {
        // 저장한 값으로 이 패널을 마무리한다. 다시 그린 목록이 이전과 같아 위 재설정이 돌지 않아도(공백만 고친 경우 등) 변경 표시가 남지 않게 한다.
        // 등록한 새 행은 뺀다 — 다시 그린 목록이 먼저 와서 이어 뒀으면 저장된 행과 겹치고, 아직 안 왔으면 곧 저장된 행으로 온다.
        setSavingFrom(null);
        setDrafts((rows) => dropCreatedAdded(rows, input.creates.map((c) => c.itemCode)).map((d) => ({ ...d, label: d.label.trim() })));
        setErrors({});
        setFailure(null);
        return toast(savedToast(input));
      }
      // 아무것도 저장되지 않았으면 이어 둘 일이 없다. 앞 단계(수정 · 삭제)가 저장됐으면 새 행 · 지울 행 표시는 다시 받은 목록에 남는다(savingFrom).
      if (!result.anySaved) setSavingFrom(null);
      // 상세 코드가 겹치면(이 화면에 안 보이는 BP 행 · BP전용 코드 포함) 그 새 행의 칸 오류로, 그 밖은 띠로 알린다.
      // 앞 단계가 저장됐으면 띠에 그 사실을 먼저 적는다(failureView).
      const view = failureView(result);
      if (view.conflict) {
        const code = conflictCode(view.conflict);
        const row = addedRows.find((d) => normalizeCode(d.itemCode) === code);
        // 화면에 없는 BP 행(BP전용 등)과 겹쳤으면 「이 그룹에서 사용할 수 없는 상세 코드입니다」로 보인다
        const message = unusableCodeMessage(
          view.conflict,
          items.map((i) => i.itemCode),
        );
        setErrors({ [`code:${row?.key ?? "server"}`]: message });
      }
      setFailure(view.band);
    });
  };

  const invalid = (key: string) => (key in errors ? true : undefined);
  const reorder = useRowReorder({ rows: drafts, setRows: setDrafts, keyOf: (d) => d.key, labelOf: (d) => d.itemCode });

  const columns: Column<Draft>[] = [
    ...(manage || canAdd
      ? [
          {
            header: "이동",
            width: "w-[60px]",
            // 기존 행은 끌기 손잡이(아이콘이 없어 글자 기호, 데모와 같다 · 수정 권한). 새 행은 저장한 뒤에 옮기고, 대신 빼기 버튼을 둔다.
            cell: (d: Draft) =>
              d.added ? (
                <button
                  type="button"
                  onClick={() => handleRemove(d.key)}
                  aria-label={`${rowName(d)} 빼기`}
                  title="이 새 행 빼기"
                  className="px-[6px] text-[16px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink"
                >
                  ×
                </button>
              ) : manage && !d.deleted ? (
                reorder.handle(d)
              ) : null,
          } satisfies Column<Draft>,
        ]
      : []),
    {
      header: "상세 코드", // 폭을 정하지 않는다 — 남는 폭을 받아 긴 코드가 잘리지 않게(삭제 칸이 붙는 그룹에서도, 2026-10-27 사용자 지정)
      align: "left",
      cell: (d) =>
        d.deleted ? (
          <Struck>{d.itemCode}</Struck>
        ) : d.added ? (
          <TextField
            value={d.itemCode}
            onChange={(e) => update(d.key, { itemCode: e.target.value.toUpperCase() })}
            placeholder={isService ? "서비스 코드 직접 입력" : "상세 코드"}
            maxLength={20}
            aria-label={`${rowName(d)} ${codeName}`}
            aria-invalid={invalid(`code:${d.key}`)}
            autoFocus
          />
        ) : (
          d.itemCode
        ),
    },
    {
      header: "코드명",
      width: "w-[160px]", // 그룹 목록의 그룹명 칸과 같은 폭 — 두 입력칸이 같은 크기로 칸을 채운다(2026-10-27 사용자 지정)
      align: "left",
      // 기존 행은 수정 권한, 새 행은 등록 권한으로 고친다(새 행은 등록 권한이 있어야 생긴다)
      cell: (d) =>
        d.deleted ? (
          <Struck>{d.label}</Struck>
        ) : manage || d.added ? (
          <TextField
            value={d.label}
            onChange={(e) => update(d.key, { label: e.target.value })}
            placeholder={d.added ? labelName : undefined}
            maxLength={50}
            aria-label={`${rowName(d)} ${labelName}`}
            aria-invalid={invalid(`label:${d.key}`)}
          />
        ) : (
          d.label
        ),
    },
    // 새 행은 맨 끝에 붙는다 — 저장한 뒤 끌어서 옮긴다
    { header: "표시 순서", width: "w-[90px]", cell: (d) => d.sortOrder },
    {
      header: "사용여부",
      width: "w-[100px]", // 표시 순서를 오른쪽으로 조금 옮겨 코드명 칸을 넓힌다(2026-10-27 사용자 지정, 전엔 120)
      cell: (d) =>
        d.deleted ? (
          <DeletePending />
        ) : manage || d.added ? (
          <Toggle
            label="사용"
            checked={d.status === "ACTIVE"}
            onChange={(e) => update(d.key, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
            aria-label={`${rowName(d)} 사용여부`}
          />
        ) : (
          <Badge tone={d.status === "ACTIVE" ? "on" : "off"}>{d.status === "ACTIVE" ? "사용" : "미사용"}</Badge>
        ),
    },
    // 플랫폼제공 그룹의 저장된 상세 코드는 어느 것이든 지운다(삭제 권한 — 플랫폼고정 그룹은 이 칸이 없다). 새 행은 이동 칸의 [×]로 뺀다.
    ...(canDelete
      ? [
          {
            header: "삭제",
            width: "w-[70px]",
            cell: (d: Draft) =>
              d.added ? null : <DeleteToggle deleted={Boolean(d.deleted)} name={d.itemCode} onToggle={() => update(d.key, { deleted: !d.deleted })} />,
          } satisfies Column<Draft>,
        ]
      : []),
  ];

  return (
    <CodePanel
      title="상세 코드"
      wide
      // 그룹 코드 · 그룹명(굵게) 뒤에 관리주체 띠지 — 그룹 목록의 관리주체 칸 · BP 공통코드와 같은 모양(2026-10-27 사용자 지정)
      sub={
        group && (
          <GroupHead
            groupCode={group.groupCode}
            groupName={group.groupName}
            owner={
              ownerLabel && (
                <OwnerTag code={group.manageOwnerCode}>
                  {ownerLabel}
                </OwnerTag>
              )
            }
          />
        )
      }
      actions={
        canSave &&
        group && (
          <>
            {canAdd && (
              <Button variant="soft" onClick={handleAdd} disabled={saving}>
                추가
              </Button>
            )}
            <Button onClick={handleSave} disabled={!dirty || saving}>
              저장
            </Button>
          </>
        )
      }
    >
      {failure && <SaveFailedBand message={failure} />}
      <DataTable
        // 열 이름 줄까지 고정하고 그 아래만 스크롤한다(2026-10-26 사용자 지정)
        scroll
        columns={columns}
        rows={drafts}
        rowKey={(d) => d.key}
        rowState={(d) => (d.added ? "added" : reorder.dragging === d.key ? "selected" : undefined)}
        rowProps={manage ? reorder.rowProps : undefined}
        empty={loadFailed ? "상세 코드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : group ? "데이터가 없습니다." : "왼쪽에서 공통코드 그룹을 고르세요."}
      />
      <FieldErrors messages={Object.values(errors)} />
      {reorder.liveRegion}
    </CodePanel>
  );
}
