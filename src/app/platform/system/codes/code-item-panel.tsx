"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, DataTable, TextField, Toggle, useToast, type Column } from "@/components/common";
import { buildSaveItemsInput, conflictCode, itemChanged, type ItemDraft } from "@/lib/code-drafts";
import { codeFormatError, duplicateCodes, normalizeCode } from "@/lib/code-validation";
import type { CodeGroup, CodeItem } from "@/lib/codes";
import { MENU_CODE } from "@/lib/menus";
import { useMenuPermission } from "@/components/site/session-gate";
import { saveCodeItemsAction } from "./actions";
import { CodePanel, FieldErrors, SaveFailedBand, UNREACHABLE } from "./code-panel";
import { useUnsavedChanges } from "./unsaved-changes";
import { useRowReorder } from "./use-row-reorder";

// 오른쪽 상세 코드 목록 — 고른 그룹의 플랫폼 원본 상세 코드. BP전용 코드는 api 가 빼고 준다.
// 상세 코드에는 관리 주체 칸이 없다 — 소속 그룹을 따른다(PL-VOCZCE). SERVICE 그룹이면 상세 코드가 서비스 코드, 코드명이 서비스명이다.
// 기존 코드는 코드명 · 사용 상태만 고친다. 서비스 코드 사용 끄기도 확인창 없이 저장할 때 반영한다.
// [추가]를 누를 때마다 맨 끝에 입력 행이 하나씩 생기고, [저장] 한 번에 모두 저장한다(2026-10-12).
// 새 코드는 기존 코드와도, 다른 새 행과도 겹칠 수 없다. 새 행은 저장 전에 [빼기]로 지울 수 있다.
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
  // 메뉴 권한(로그인 정보)으로 보인다 — 막는 것은 api 다. api 는 패널 저장을 늘 수정으로 보고, 새 행이 있으면 등록까지 요구한다.
  // 그래서 고치기 · 순서 옮기기 · 저장은 수정 권한, [추가]는 수정과 등록 권한이 둘 다 있을 때만.
  const can = useMenuPermission(MENU_CODE.platformCodes);
  const manage = can.update && !loadFailed;
  const canAdd = manage && can.create;
  const isService = group?.groupCode === "SERVICE";
  const toast = useToast();
  const { setDirty } = useUnsavedChanges();
  const [drafts, setDrafts] = useState(() => items.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const nextId = useRef(1);

  // 저장 뒤 서버가 새 목록을 주면 그 값으로 다시 시작한다.
  // 왼쪽 패널이 저장해 화면 전체가 다시 그려진 것뿐이면(상세 코드 값이 같으면) 고치던 값을 그대로 둔다.
  const [shown, setShown] = useState(items);
  if (items !== shown) {
    const sameRows = JSON.stringify(items) === JSON.stringify(shown);
    setShown(items);
    if (!sameRows) {
      setDrafts(items.map(toDraft));
      setErrors({});
      setFailure(null);
    }
  }

  const original = new Map(items.map((i) => [i.itemCode, i]));
  const changed = (d: Draft) => itemChanged(d, original.get(d.itemCode));
  const addedRows = drafts.filter((d) => d.added);
  const dirty = addedRows.length > 0 || drafts.some(changed);

  useEffect(() => setDirty("items", dirty), [dirty, setDirty]);
  // 그룹을 바꾸면 이 패널은 새로 그려진다. 사라질 때 변경 표시를 지운다.
  useEffect(() => () => setDirty("items", false), [setDirty]);

  const update = (key: string, patch: Partial<Draft>) => setDrafts((rows) => rows.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  /** 새 행은 저장된 행 뒤에 이어 붙고, 마지막 저장된 순서 다음부터 차례로 번호를 받는다. */
  const renumberAdded = (rows: Draft[]): Draft[] => {
    let next = Math.max(0, ...rows.filter((r) => !r.added).map((r) => r.sortOrder));
    return rows.map((r) => (r.added ? { ...r, sortOrder: ++next } : r));
  };

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
    for (const d of rows) if (!d.label.trim()) next[`label:${d.key}`] = `${rowName(d, rows)} — ${labelName}을 입력해 주세요.`;

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
    startSaving(async () => {
      // 요청 자체가 실패하면(연결 끊김 · 재배포로 action 을 못 찾음) 오류 화면으로 넘기지 않고 띠로 알린다 — 입력값은 그대로 둔다
      const result = await saveCodeItemsAction(group.groupCode, input).catch((error: unknown) => {
        console.error("상세 코드 저장 요청 실패", group.groupCode, error);
        return { ok: false as const, status: undefined, message: UNREACHABLE };
      });
      if (result.ok) {
        // 저장한 값으로 이 패널을 마무리한다. 다시 그린 목록이 이전과 같아 위 재설정이 돌지 않아도(공백만 고친 경우 등) 변경 표시가 남지 않게 한다.
        setDrafts((rows) => rows.map((d) => ({ ...d, label: d.label.trim() })));
        setErrors({});
        setFailure(null);
        // 새로 만든 것이 있으면 ‘저장되었습니다.’, 고치기만 했으면 ‘수정되었습니다.’(공통 토스트)
        return toast(input.creates.length ? "saved" : "updated");
      }
      // 상세 코드가 겹치면(이 화면에 안 보이는 BP 행 · BP전용 코드 포함) 그 새 행의 칸 오류로, 그 밖은 띠로 알린다.
      if (result.status === 409) {
        const code = conflictCode(result.message);
        const row = addedRows.find((d) => normalizeCode(d.itemCode) === code);
        setErrors({ [`code:${row?.key ?? "server"}`]: result.message });
      } else setFailure(result.message);
    });
  };

  const invalid = (key: string) => (key in errors ? true : undefined);
  const reorder = useRowReorder({ rows: drafts, setRows: setDrafts, keyOf: (d) => d.key, labelOf: (d) => d.itemCode });

  const columns: Column<Draft>[] = [
    ...(manage
      ? [
          {
            header: "이동",
            width: "w-[60px]",
            // 기존 행은 끌기 손잡이(아이콘이 없어 글자 기호, 데모와 같다). 새 행은 저장한 뒤에 옮기고, 대신 빼기 버튼을 둔다.
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
              ) : (
                reorder.handle(d)
              ),
          } satisfies Column<Draft>,
        ]
      : []),
    {
      header: "상세 코드",
      width: "w-[220px]",
      align: "left",
      cell: (d) =>
        d.added ? (
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
      align: "left",
      cell: (d) =>
        manage ? (
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
      header: "사용 상태",
      width: "w-[120px]",
      cell: (d) =>
        manage ? (
          <Toggle
            label="사용"
            checked={d.status === "ACTIVE"}
            onChange={(e) => update(d.key, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
            aria-label={`${rowName(d)} 사용 상태`}
          />
        ) : (
          <Badge tone={d.status === "ACTIVE" ? "on" : "off"}>{d.status === "ACTIVE" ? "사용" : "미사용"}</Badge>
        ),
    },
  ];

  return (
    <CodePanel
      title="상세 코드"
      wide
      sub={group && [group.groupCode, group.groupName, ownerLabel].filter(Boolean).join(" · ")}
      actions={
        manage &&
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
