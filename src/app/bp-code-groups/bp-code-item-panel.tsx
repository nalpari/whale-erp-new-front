"use client";

import { OwnerTag } from "@/components/site/code-editor/owner-tag";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, DataTable, TextField, Toggle, useToast, type Column } from "@/components/common";
import { CodePanel, DoneNotice, FieldErrors, GroupHead, SaveFailedBand, UNKNOWN_RESULT } from "@/components/site/code-editor/code-panel";
import { useUnsavedChanges } from "@/components/site/code-editor/unsaved-changes";
import { useRowReorder } from "@/components/site/code-editor/use-row-reorder";
import { DeletePending, DeleteToggle, Struck } from "@/components/site/code-editor/delete-mark";
import { useCodeLabel } from "@/components/site/code-label";
import { useAccount, usePagePermission } from "@/components/site/session-gate";
import { bpCodePanelAccess, bpDeletable, bpPanelLock, newBpItemDraft, toBpItemDraft, type BpItemDraft } from "@/lib/bp-code-drafts";
import type { BpCodeGroup, BpCodeItem } from "@/lib/bp-codes";
import {
  buildSaveItemsInput,
  conflictCode,
  dropCreatedAdded,
  followSameRows,
  hasPending,
  itemsDirty,
  renumberAdded,
  savedToast,
  unusableCodeMessage,
  withKeptPending,
} from "@/lib/code-drafts";
import { failureView } from "@/lib/code-save";
import { codeFormatError, duplicateCodes, normalizeCode } from "@/lib/code-validation";
import { saveBpCodeItemsAction } from "./actions";

// 오른쪽 상세 코드 — 고른 그룹의 이 BP 상세 코드(플랫폼고정은 플랫폼 원본, 플랫폼제공은 이 BP 에 복사된 행 · BP전용 — 회원가입 · [BP에 적용] 때 복사된다). okf/config.md 공통코드.
// 플랫폼 공통코드 상세 코드 패널(src/app/code-groups/code-item-panel.tsx)과 같은 틀이다 — 기존 코드는 코드명 · 사용 상태 · 표시 순서만 고치고,
// [추가]마다 맨 끝에 새 행이 생기며, [저장] 한 번으로 바뀐 행 · 지울 행 · 새 행을 함께 보낸다(수정 → 삭제 → 등록). 표시 순서는 손잡이로 끌거나 ↑ · ↓ 로 옮긴다.
// BP 에만 있는 것:
//  · 관리 주체 칸 — 플랫폼이 등록한 코드는 그룹의 관리 주체, 이 BP 가 더한 코드는 BP전용(새 행도 api 가 BP전용으로 저장한다).
//  · 막힌 그룹 — 플랫폼 사용자는 조회만(띠, 버튼 없음), 플랫폼고정 그룹은 조회만(이동 칸 없음). 사용중지 그룹은 api 가 보내지 않는다.
//  · [삭제]는 플랫폼제공 · BP전용 코드에 있다(2026-10-22). 사용 상태도 자유롭게 켜고 끈다.
// 막는 것은 api 다(403 · 409) — 화면은 미리 숨기거나 잠그고 이유를 띠로 알린다.

type Draft = BpItemDraft;

export function BpCodeItemPanel({ group, items, loadFailed }: { group?: BpCodeGroup; items: BpCodeItem[]; loadFailed?: boolean }) {
  const isPlatform = useAccount().bp.isPlatform;
  const permission = usePagePermission();
  const lock = bpPanelLock(group, isPlatform);
  const { manage, canAdd, canDelete, canSave } = bpCodePanelAccess({ lock, ...permission, loadFailed });
  // 플랫폼고정 그룹이면 버튼은 두되 잠근다(목업) — 이유는 띠가 말한다. 플랫폼 사용자 · 권한 없음 · 불러오기 실패면 버튼이 없다.
  const showButtons = Boolean(group) && !loadFailed && !isPlatform && (permission.update || permission.create || permission.delete);
  const ownerLabel = useCodeLabel("MANAGE_OWNER");
  const router = useRouter();
  const toast = useToast();
  const { setDirty } = useUnsavedChanges();
  const [drafts, setDrafts] = useState(() => items.map(toBpItemDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  // 저장을 시작한 목록 — 뒤 단계가 실패했거나 결과를 모를 때 다음에 오는 목록 뒤에 새 행을 이어 두고 지울 행 표시도 다시 얹는다(플랫폼 패널과 같다).
  const [savingFrom, setSavingFrom] = useState<BpCodeItem[] | null>(null);
  const nextId = useRef(1);

  // 저장 뒤 서버가 새 목록을 주면 그 값으로 다시 시작한다. 같은 내용이 새 참조로 오면 고치던 값을 그대로 둔다.
  const [shown, setShown] = useState(items);
  if (items !== shown) {
    const sameRows = JSON.stringify(items) === JSON.stringify(shown);
    setShown(items);
    if (sameRows) setSavingFrom(followSameRows(savingFrom, shown, items));
    else {
      const next = renumberAdded(withKeptPending(items.map(toBpItemDraft), drafts, savingFrom === shown));
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
  const reordered = drafts.some((d) => !d.added && !d.deleted && d.sortOrder !== original.get(d.itemCode)?.sortOrder);

  useEffect(() => setDirty("items", dirty), [dirty, setDirty]);
  useEffect(() => () => setDirty("items", false), [setDirty]);

  const update = (key: string, patch: Partial<Draft>) => setDrafts((rows) => rows.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const handleAdd = () => setDrafts((rows) => renumberAdded([...rows, newBpItemDraft(`new-${nextId.current++}`)]));

  const handleRemove = (key: string) => {
    const rows = renumberAdded(drafts.filter((r) => r.key !== key));
    setDrafts(rows);
    if (Object.keys(errors).length) setErrors(validate(rows));
  };

  /** 오류 문구에서 행을 가리키는 이름 — 새 행은 입력한 코드, 비었으면 몇 번째 새 행인지. */
  const rowName = (d: Draft, rows = drafts) =>
    d.added ? (d.itemCode ? `새 상세 코드 ${d.itemCode}` : `새 행 ${rows.filter((r) => r.added).indexOf(d) + 1}`) : d.itemCode;

  const validate = (rows: Draft[] = drafts): Record<string, string> => {
    const next: Record<string, string> = {};
    const added = rows.filter((d) => d.added);
    for (const d of rows) if (!d.deleted && !d.label.trim()) next[`label:${d.key}`] = `${rowName(d, rows)} — 코드명을 입력해 주세요.`;

    // 이 그룹에 보이는 코드(플랫폼 코드 · BP전용)와 겹치는 것, 새 행끼리 겹치는 것을 한 번에 찾는다.
    // 이 BP 가 받지 않은 플랫폼 코드 · 지운 행과의 겹침은 화면이 몰라 저장할 때 api 가 409 로 알린다.
    const codes = added.map((d) => normalizeCode(d.itemCode));
    const repeated = duplicateCodes(
      items.map((i) => i.itemCode),
      codes,
    );
    added.forEach((d, n) => {
      const code = codes[n];
      const formatError = codeFormatError(code);
      if (formatError) next[`code:${d.key}`] = `${rowName(d, rows)} — ${formatError}`;
      else if (repeated.has(code)) {
        const same = original.get(code);
        next[`code:${d.key}`] = !same
          ? `새로 추가한 행끼리 상세 코드가 겹칩니다 — ${code}. 한 행만 남겨 주세요.`
          : same.manageOwnerCode === "BP_ONLY"
            ? `이 그룹에 이미 있는 상세 코드입니다 — ${code} ${same.label} (${ownerLabel(same.manageOwnerCode)} · 표시 순서 ${same.sortOrder}). 다른 코드를 입력해 주세요.`
            : `플랫폼이 등록한 상세 코드와 겹칩니다 — ${code} ${same.label} (${ownerLabel(same.manageOwnerCode)} · 표시 순서 ${same.sortOrder}). 다른 코드를 입력해 주세요.`;
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
      // 요청 자체가 끊기면 서버에서는 저장됐을 수 있다 — 목록을 다시 받아 띠로 알린다(플랫폼 패널과 같다).
      const result = await saveBpCodeItemsAction(group.groupCode, input).catch((error: unknown) => {
        console.error("BP 상세 코드 저장 요청 실패", group.groupCode, error);
        return null;
      });
      if (!result) {
        router.refresh();
        return setFailure(UNKNOWN_RESULT);
      }
      if ((result.ok || result.anySaved) && !result.refreshed) router.refresh();
      if (result.ok) {
        setSavingFrom(null);
        setDrafts((rows) => dropCreatedAdded(rows, input.creates.map((c) => c.itemCode)).map((d) => ({ ...d, label: d.label.trim() })));
        setErrors({});
        setFailure(null);
        return toast(savedToast(input));
      }
      // 앞 단계(수정 · 삭제)가 저장됐으면 새 행 · 지울 행 표시는 다시 받은 목록에 남는다(savingFrom)
      if (!result.anySaved) setSavingFrom(null);
      // 409 — 겹친 코드(지운 코드 포함) · 플랫폼고정 그룹. 문구가 「…: CODE」 꼴이면 그 새 행의 칸 오류로, 아니면 표 아래 한 줄로 보인다.
      const view = failureView(result);
      if (view.conflict) {
        const code = conflictCode(view.conflict);
        const row = addedRows.find((d) => normalizeCode(d.itemCode) === code);
        // 지운 코드 · 이 BP 가 받지 않은 플랫폼 코드와 겹쳤으면 「이 그룹에서 사용할 수 없는 상세 코드입니다」로 보인다
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
    // 플랫폼고정 그룹은 순서를 바꿀 수 없어 이동 칸 자체를 두지 않는다(목업)
    ...(lock !== "fixed" && (manage || canAdd)
      ? [
          {
            header: "이동",
            width: "w-[60px]",
            // 기존 행은 끌기 손잡이(수정 권한). 새 행은 저장한 뒤에 옮기고, 대신 빼기 버튼을 둔다.
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
      header: "상세 코드",
      width: "w-[230px]", // 코드명 칸을 오른쪽으로 옮겨 상세 코드가 잘리지 않게(2026-10-27 사용자 지정, 전엔 150)
      align: "left",
      cell: (d) =>
        d.deleted ? (
          <Struck>{d.itemCode}</Struck>
        ) : d.added ? (
          <TextField
            value={d.itemCode}
            onChange={(e) => update(d.key, { itemCode: e.target.value.toUpperCase() })}
            placeholder="상세 코드"
            maxLength={20}
            aria-label={`${rowName(d)} 상세 코드`}
            aria-invalid={invalid(`code:${d.key}`)}
            autoFocus
          />
        ) : (
          <span title="등록한 코드 값은 바꿀 수 없습니다">{d.itemCode}</span>
        ),
    },
    {
      header: "코드명",
      align: "left",
      cell: (d) =>
        d.deleted ? (
          <Struck>{d.label}</Struck>
        ) : manage || d.added ? (
          <TextField
            value={d.label}
            onChange={(e) => update(d.key, { label: e.target.value })}
            placeholder={d.added ? "코드명" : undefined}
            maxLength={50}
            aria-label={`${rowName(d)} 코드명`}
            aria-invalid={invalid(`label:${d.key}`)}
          />
        ) : (
          d.label
        ),
    },
    { header: "표시 순서", width: "w-[90px]", cell: (d) => d.sortOrder },
    {
      header: "사용여부",
      width: "w-[110px]",
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
    {
      header: "관리주체",
      width: "w-[110px]",
      // 새 행은 BP전용으로 저장된다(api 가 정한다)
      cell: (d) => <OwnerTag code={d.manageOwnerCode}>{ownerLabel(d.manageOwnerCode)}</OwnerTag>,
    },
    // 플랫폼제공 · BP전용 코드를 지운다(삭제 권한, bpDeletable) — 새 행에는 버튼이 없다(이동 칸의 [×]로 뺀다)
    ...(canDelete
      ? [
          {
            header: "삭제",
            width: "w-[70px]",
            cell: (d: Draft) =>
              bpDeletable(d) ? (
                <DeleteToggle deleted={Boolean(d.deleted)} name={d.itemCode} onToggle={() => update(d.key, { deleted: !d.deleted })} />
              ) : null,
          } satisfies Column<Draft>,
        ]
      : []),
  ];

  return (
    <CodePanel
      title="상세 코드"
      wide
      sub={
        group && (
          <GroupHead
            groupCode={group.groupCode}
            groupName={group.groupName}
            owner={
              <OwnerTag code={group.manageOwnerCode}>
                {ownerLabel(group.manageOwnerCode)}
              </OwnerTag>
            }
          />
        )
      }
      actions={
        showButtons && (
          <>
            {permission.create && (
              <Button variant="soft" onClick={handleAdd} disabled={!canAdd || saving}>
                추가
              </Button>
            )}
            <Button onClick={handleSave} disabled={!canSave || !dirty || saving}>
              저장
            </Button>
          </>
        )
      }
    >
      {lock === "platform-user" && <DoneNotice message="플랫폼 사용자는 BP 공통코드를 조회만 할 수 있습니다." />}
      {group && lock === "fixed" && <DoneNotice message="플랫폼고정 그룹이라 조회만 할 수 있습니다." />}
      {reordered && <DoneNotice message="표시 순서를 바꿨습니다 — 저장을 눌러야 반영됩니다." />}
      {failure && <SaveFailedBand message={failure} />}
      <DataTable
        // 열 이름 줄까지 고정하고 그 아래만 스크롤한다(2026-10-26 사용자 지정)
        scroll
        columns={columns}
        rows={drafts}
        rowKey={(d) => d.key}
        rowState={(d) => (d.added ? "added" : reorder.dragging === d.key ? "selected" : undefined)}
        rowProps={manage ? reorder.rowProps : undefined}
        empty={
          loadFailed
            ? "상세 코드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            : group
              ? "이 그룹에 상세 코드가 없습니다."
              : "왼쪽 목록에서 공통코드 그룹을 고르면 상세 코드가 여기에 나옵니다."
        }
      />
      <FieldErrors messages={Object.values(errors)} />
      {reorder.liveRegion}
    </CodePanel>
  );
}
