"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge, Button, DataTable, Pagination, Select, Tag, TextField, Toggle, useToast, type Column } from "@/components/common";
import { buildSaveGroupsInput, groupChanged, type GroupDraft } from "@/lib/code-drafts";
import { codeFormatError, duplicateCodes, normalizeCode } from "@/lib/code-validation";
import type { CodeGroup, ManageOwnerCode } from "@/lib/codes";
import { usePagePermission } from "@/components/site/session-gate";
import { applyCodeGroupToBpsAction, saveCodeGroupsAction } from "./actions";
import { BpApplyDialog } from "./bp-apply-dialog";
import { CodePanel, DoneNotice, FieldErrors, SaveFailedBand, UNREACHABLE } from "./code-panel";
import { codesHref } from "./codes-href";
import { GuardedLink, useUnsavedChanges } from "./unsaved-changes";

// 왼쪽 공통코드 그룹 목록. 그룹 코드를 누르면 오른쪽에 그 그룹의 상세 코드가 선다(?group=).
// 기존 그룹은 그룹명 · 사용 상태만 고치고(코드 · 관리 주체는 바꾸지 않는다), [추가]는 맨 끝에 입력 행 하나를 붙인다.
// 저장은 행마다가 아니라 이 패널에서 한 번이다. 그룹 순서는 화면에서 바꾸지 않는다(2026-10-12) — 표시 순서대로 보이기만 한다.
// 플랫폼제공 그룹은 [BP 적용]으로 사용 중인 모든 BP 에 복사한다 — BP 에 이미 있는 상세 코드는 건너뛰고 없는 것만 넣는다(2026-10-12).
// 저장한 값으로 적용하므로 두 패널(이 패널 · 오른쪽 상세 코드) 어디든 저장하지 않은 변경이 있으면 막는다.

type Draft = GroupDraft;

const toDraft = (g: CodeGroup): Draft => ({ ...g, added: false });
const OWNERS: ManageOwnerCode[] = ["PLATFORM_FIXED", "PLATFORM_PROVIDED"];

export function CodeGroupPanel({
  groups,
  total,
  page,
  pageSize,
  selected,
  ownerLabels,
}: {
  groups: CodeGroup[];
  total: number;
  page: number;
  pageSize: number;
  selected?: string;
  /** 관리 주체 한글 — 공통코드 MANAGE_OWNER 에서 읽은 값. */
  ownerLabels: Record<string, string>;
}) {
  // 메뉴 권한(로그인 정보)으로 보인다 — 막는 것은 api 다. api 는 패널 저장을 늘 수정으로 보고, 새 행이 있으면 등록까지 요구한다.
  // 그래서 고치기 · 저장 · BP 적용은 수정 권한, [추가]는 수정과 등록 권한이 둘 다 있을 때만.
  const can = usePagePermission();
  const manage = can.update;
  const canAdd = manage && can.create;
  const toast = useToast();
  const { setDirty, isDirty, navigate } = useUnsavedChanges();
  const [drafts, setDrafts] = useState(() => groups.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [applyTarget, setApplyTarget] = useState<Draft | null>(null);
  const [applying, startApplying] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // 저장 뒤 서버가 새 목록을 주면 그 값으로 다시 시작한다.
  // 다른 그룹으로 옮겨 가면(이동 전에 버릴지 물었다) 고치던 값도 버린다.
  // 오른쪽 패널이 저장해 화면 전체가 다시 그려진 것뿐이면(그룹 목록 값이 같으면) 고치던 값을 그대로 둔다.
  const [shown, setShown] = useState({ groups, selected });
  if (groups !== shown.groups || selected !== shown.selected) {
    const sameRows = selected === shown.selected && JSON.stringify(groups) === JSON.stringify(shown.groups);
    setShown({ groups, selected });
    if (!sameRows) {
      setDrafts(groups.map(toDraft));
      setErrors({});
      setFailure(null);
    }
  }

  const original = new Map(groups.map((g) => [g.groupCode, g]));
  const changed = (d: Draft) => groupChanged(d, original.get(d.groupCode));
  const added = drafts.find((d) => d.added);
  const dirty = drafts.some((d) => d.added || changed(d));
  // [BP 적용]은 고른 그룹의 상세 코드도 저장된 값으로 배포하므로 오른쪽 패널의 변경도 본다
  const applyBlocked = dirty || isDirty("items");

  useEffect(() => setDirty("groups", dirty), [dirty, setDirty]);
  // 다른 그룹 · 다른 쪽으로 가면 이 패널은 새로 그려진다. 사라질 때 변경 표시를 지운다.
  useEffect(() => () => setDirty("groups", false), [setDirty]);

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((rows) => rows.map((d) => (d.added ? key === "" : d.groupCode === key) ? { ...d, ...patch } : d));

  const handleAdd = () => {
    // 새 행은 마지막 다음 순서, 사용 상태로 시작한다.
    const last = Math.max(total, ...drafts.map((d) => d.sortOrder));
    setDrafts((rows) => [
      ...rows,
      { groupCode: "", groupName: "", manageOwnerCode: "", isBpApplied: false, status: "ACTIVE", sortOrder: last + 1, added: true },
    ]);
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    for (const d of drafts) {
      const label = d.added ? "새 그룹" : d.groupCode;
      if (!d.groupName.trim()) next[`name:${d.added ? "" : d.groupCode}`] = `${label} — 그룹명을 입력해 주세요.`;
    }
    if (added) {
      const code = normalizeCode(added.groupCode);
      const formatError = codeFormatError(code);
      if (formatError) next.code = `새 그룹 코드 — ${formatError}`;
      else if (duplicateCodes(groups.map((g) => g.groupCode), [code]).size) next.code = `이미 있는 그룹 코드입니다: ${code}`;
      if (!added.manageOwnerCode) next.owner = "새 그룹 — 관리 주체를 골라 주세요.";
    }
    return next;
  };

  const handleApply = () => {
    const target = applyTarget;
    if (!target) return;
    setNotice(null);
    setApplyError(null);
    startApplying(async () => {
      // 요청 자체가 실패하면(연결 끊김 · 재배포로 action 을 못 찾음) 오류 화면으로 넘기지 않고 띠로 알린다
      const result = await applyCodeGroupToBpsAction(target.groupCode).catch((error: unknown) => {
        console.error("BP 적용 요청 실패", target.groupCode, error);
        return { ok: false as const, message: UNREACHABLE };
      });
      setApplyTarget(null);
      if (!result.ok) return setApplyError(result.message);
      setNotice(
        `${target.groupCode} · ${target.groupName} — BP ${result.bpCount}곳에 적용했습니다. ${
          result.createdCount === 0 ? "모든 BP에 이미 있어 새로 넣은 상세 코드는 없습니다." : `새로 넣은 상세 코드 ${result.createdCount}건.`
        }`,
      );
    });
  };

  const handleSave = () => {
    setNotice(null);
    setApplyError(null);
    const found = validate();
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return;

    const input = buildSaveGroupsInput(drafts, groups);
    startSaving(async () => {
      // 요청 자체가 실패하면(연결 끊김 · 재배포로 action 을 못 찾음) 오류 화면으로 넘기지 않고 띠로 알린다 — 입력값은 그대로 둔다
      const result = await saveCodeGroupsAction(input).catch((error: unknown) => {
        console.error("공통코드 그룹 저장 요청 실패", error);
        return { ok: false as const, status: undefined, message: UNREACHABLE };
      });
      if (result.ok) {
        // 저장한 값으로 이 패널을 마무리한다. 새 그룹이 다음 쪽에 들어가 이 쪽 목록이 그대로여도(위 재설정이 돌지 않아도)
        // 입력 행이 남지 않게 한다. 다시 그린 목록이 먼저 와서 재설정됐으면 남은 새 행이 없어 그대로다.
        setDrafts((rows) => rows.filter((d) => !d.added).map((d) => ({ ...d, groupName: d.groupName.trim() })));
        setErrors({});
        setFailure(null);
        // 새로 만든 것이 있으면 ‘저장되었습니다.’, 고치기만 했으면 ‘수정되었습니다.’(공통 토스트)
        return toast(input.creates.length ? "saved" : "updated");
      }
      // 그룹 코드가 겹치면 칸 오류로, 그 밖은 띠로 알린다.
      if (result.status === 409) setErrors({ code: result.message });
      else setFailure(result.message);
    });
  };

  const invalid = (key: string) => (key in errors ? true : undefined);

  const columns: Column<Draft>[] = [
    {
      header: "그룹 코드",
      width: "w-[170px]",
      align: "left",
      cell: (d) =>
        d.added ? (
          <TextField
            value={d.groupCode}
            onChange={(e) => update("", { groupCode: e.target.value.toUpperCase() })}
            placeholder="그룹 코드"
            maxLength={20}
            aria-label="새 그룹 코드"
            aria-invalid={invalid("code")}
            autoFocus
          />
        ) : d.groupCode === selected ? (
          <b className="font-semibold" aria-current="true">
            {d.groupCode}
          </b>
        ) : (
          <GuardedLink href={codesHref({ page, group: d.groupCode })} className="text-erp-link hover:underline">
            {d.groupCode}
          </GuardedLink>
        ),
    },
    {
      header: "그룹명",
      align: "left",
      cell: (d) => {
        if (!manage) return d.groupName;
        const key = d.added ? "" : d.groupCode;
        return (
          <TextField
            value={d.groupName}
            onChange={(e) => update(key, { groupName: e.target.value })}
            placeholder={d.added ? "그룹명" : undefined}
            maxLength={50}
            aria-label={`${d.added ? "새 그룹" : d.groupCode} 그룹명`}
            aria-invalid={invalid(`name:${key}`)}
          />
        );
      },
    },
    {
      header: "관리 주체",
      // 새 행의 선택칸(글자 + 오른쪽 화살표 30)에 ‘플랫폼고정’이 잘리지 않는 폭
      width: "w-[140px]",
      cell: (d) =>
        d.added ? (
          <Select
            value={d.manageOwnerCode}
            onChange={(e) => update("", { manageOwnerCode: e.target.value as ManageOwnerCode })}
            aria-label="새 그룹 관리 주체"
            aria-invalid={invalid("owner")}
          >
            <option value="">선택</option>
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {ownerLabels[o] ?? o}
              </option>
            ))}
          </Select>
        ) : (
          <Tag>{ownerLabels[d.manageOwnerCode] ?? d.manageOwnerCode}</Tag>
        ),
    },
    {
      header: "BP 적용",
      width: "w-[130px]",
      // 플랫폼제공 그룹만 [BP 적용]. 이미 적용한 그룹도 다시 누를 수 있다(BP 에 없는 코드만 들어간다). 새 그룹은 저장 뒤에 적용한다.
      cell: (d) =>
        !d.added && d.manageOwnerCode === "PLATFORM_PROVIDED" && manage ? (
          // 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 이유 안내는 감싸는 칸에 단다
          <span title={applyBlocked ? "저장한 뒤 적용할 수 있습니다" : undefined} className="inline-flex">
            <Button variant="soft" onClick={() => setApplyTarget(d)} disabled={applyBlocked || saving || applying}>
              BP 적용
            </Button>
          </span>
        ) : (
          <span className="text-erp-muted">{d.added ? "" : "—"}</span>
        ),
    },
    {
      header: "사용 상태",
      width: "w-[100px]",
      cell: (d) =>
        manage ? (
          <Toggle
            label="사용"
            checked={d.status === "ACTIVE"}
            onChange={(e) => update(d.added ? "" : d.groupCode, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
            aria-label={`${d.added ? "새 그룹" : d.groupCode} 사용 상태`}
          />
        ) : (
          <Badge tone={d.status === "ACTIVE" ? "on" : "off"}>{d.status === "ACTIVE" ? "사용" : "미사용"}</Badge>
        ),
    },
  ];

  return (
    <CodePanel
      title="공통코드 그룹"
      sub={`${total}개`}
      actions={
        manage && (
          <>
            {/* 저장 전 새 행은 하나만 둔다 */}
            {canAdd && (
              <Button variant="soft" onClick={handleAdd} disabled={Boolean(added) || saving}>
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
      {applyError && <SaveFailedBand message={applyError} detail={null} />}
      {notice && <DoneNotice message={notice} />}
      <DataTable
        columns={columns}
        rows={drafts}
        rowKey={(d) => (d.added ? "__added" : d.groupCode)}
        rowState={(d) => (d.added ? "added" : d.groupCode === selected ? "selected" : undefined)}
      />
      <FieldErrors messages={Object.values(errors)} />
      {manage && <BpApplyDialog group={applyTarget} busy={applying} onConfirm={handleApply} onCancel={() => setApplyTarget(null)} />}
      <div className="pt-[14px]">
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / pageSize))}
          onPageChange={(next) => navigate(codesHref({ page: next }))}
        />
      </div>
    </CodePanel>
  );
}
