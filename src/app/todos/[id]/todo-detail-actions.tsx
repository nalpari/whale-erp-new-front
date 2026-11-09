"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button, ConfirmDialog, Select, useToast } from "@/components/common";
import { useCurrentBp, useMenuPermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import type { EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import { useFailure } from "../../staff-members/[id]/use-action-failure";
import { changeTodoStatusAction, deleteTodoAction } from "../actions";
import { withBack, type TodoStatus } from "../todo-list-query";
import { deletePreview, deleteResultMessage, type TodoDetail } from "../todo-row";

// 상세 제목 줄 오른쪽 — 수정(수정 권한) · 삭제(삭제 권한, 지울 대기 행이 있을 때) · 목록. 권한은 로그인 정보의 메뉴 권한으로 미리 가리고 막는 것은 api 다.
// listHref 는 옛 경로다 — 링크 · 이동에서 탭 BP 를 붙인다(/bp/{id}/todos)
export function TodoDetailActions({ detail, listHref }: { detail: TodoDetail; listHref: string }) {
  const can = useMenuPermission(MENU_CODE.todos);
  const bp = useCurrentBp().bpCodeId;
  const [open, setOpen] = useState(false);
  const { pending } = deletePreview(detail);

  // 버튼 순서는 [삭제] [수정] [목록](2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 수정 · 삭제 · 목록)
  return (
    <>
      {can.delete && pending > 0 && (
        <Button variant="soft" onClick={() => setOpen(true)}>
          삭제
        </Button>
      )}
      {can.update && (
        <Button variant="soft" href={bpPath(bp, withBack(`/todos/${detail.todoId}/edit`, listHref))}>
          수정
        </Button>
      )}
      <Button href={bpPath(bp, listHref)}>목록</Button>
      {open && <DeleteTodoDialog detail={detail} listHref={listHref} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 삭제 확인창(T-2). 그룹이면 대기인 행만 지우고 진행 중 · 완료는 남는다고 미리 알리고, 지운 뒤 api 가 준 건수로 다시 알린다 */
function DeleteTodoDialog({ detail, listHref, onClose }: { detail: TodoDetail; listHref: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const bp = useCurrentBp().bpCodeId;
  const [busy, startDeleting] = useTransition();
  const [error, setError] = useState("");
  const { pending, remaining } = deletePreview(detail);
  const group = detail.groupTodos.length > 0;

  const handleConfirm = () =>
    startDeleting(async () => {
      setError("");
      try {
        const result = await deleteTodoAction(detail.todoId);
        if (result.ok) {
          toast(deleteResultMessage(result));
          // 들어올 때의 목록 조건으로 돌아간다 — TO-DO 하나를 지워도 점포 조건은 틀어지지 않아 점포 검색도 그대로 둔다(2026-10-22 재영)
          router.push(bpPath(bp, listHref));
          return;
        }
        const message = onFailure(result);
        if (message) setError(message);
        // 404(그사이 지워졌거나 범위 밖)는 다시 받아 404 화면으로, 409(지울 대기 행이 없음 — 그사이 상태가 바뀜)는 문구와 함께 지금 상태를 다시 받는다
        if (result.status === 404 || result.status === 409) router.refresh();
      } catch (e) {
        console.error("TO-DO 삭제 실패", e);
        setError("삭제 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
      }
    });

  // 다른 화면 삭제 확인창과 같게 — 기본 버튼 · 「…를 삭제하시겠습니까?」(2026-11-06 사용자 지정, 전엔 빨간 버튼 · 「이 TO-DO 를」)
  return (
    <ConfirmDialog open title="TO-DO를 삭제하시겠습니까?" confirmLabel={busy ? "삭제 중" : "삭제"} busy={busy} onConfirm={handleConfirm} onCancel={onClose}>
      {/* 경우마다 한 문장 — 한 명 · 모두 대기 · 일부만 대기. 진행 중 · 완료가 지워지지 않는다는 말은 놓치면 안 돼 줄을 나눈다.
          「남습니다 · 사라집니다」 대신 「삭제되며 · 확인할 수 없습니다 · 삭제되지 않습니다」(2026-11-09 사용자 지정) */}
      <p>
        {!group
          ? "직원에게 배정된 TO-DO가 삭제되며, 직원 근무 앱에서도 확인할 수 없습니다."
          : remaining
            ? `직원에게 배정된 TO-DO 중 대기 ${pending}건이 삭제되며, 직원 근무 앱에서도 확인할 수 없습니다.`
            : `직원에게 배정된 TO-DO ${pending}건이 모두 삭제되며, 직원 근무 앱에서도 확인할 수 없습니다.`}
      </p>
      {group && remaining > 0 && <p className="mt-[6px]">단, 진행 중이거나 완료된 TO-DO {remaining}건은 삭제되지 않습니다.</p>}
      {error && (
        <p role="alert" className="mt-[12px] text-erp-off">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}

/**
 * 관리자가 직원 대신 상태를 바꾼다(T-1, 그룹이면 이 행만). 상태 선택칸 + [상태 변경]이고 직원별 상태 표의 줄마다도 쓴다.
 * name 은 직원 이름 — 화면 낭독용(「서지안 바꿀 상태」)이고, 줄 안 칸은 좁아 실패 문구를 옆에 두지 않고 「서지안: …」 토스트로 알린다.
 * fallback 은 수정 권한이 없을 때 대신 보일 지금 상태다.
 */
export function TodoStatusControl({
  todoId,
  status,
  labels,
  name,
  fallback,
}: {
  todoId: number;
  status: TodoStatus;
  labels: EnumValue[];
  name?: string;
  fallback: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const can = useMenuPermission(MENU_CODE.todos);
  const [next, setNext] = useState<TodoStatus>(status);
  const [error, setError] = useState("");
  const [busy, startChanging] = useTransition();
  // 새로 받은 상태로 선택칸을 맞춘다 — key 로 다시 그리면 409 문구까지 지워져, 그리는 중에 맞춘다(실패 문구는 남긴다)
  const [seen, setSeen] = useState(status);
  if (seen !== status) {
    setSeen(status);
    setNext(status);
  }
  if (!can.update) return <>{fallback}</>;
  const fail = (message: string) => (name ? toast(`${name}: ${message}`) : setError(message));

  const handleChange = () =>
    startChanging(async () => {
      setError("");
      try {
        const result = await changeTodoStatusAction(todoId, next);
        if (result.ok) {
          toast("updated");
          router.refresh();
          return;
        }
        // 409(다른 직원이 먼저 완료 · 그사이 상태가 바뀜)는 문장을 보이고 지금 상태를 다시 받는다. 404(그사이 지움 · 범위 밖)는 다시 받아 404 화면으로
        const message = onFailure(result);
        if (message) fail(message);
        if (result.status === 409 || result.status === 404) router.refresh();
      } catch (e) {
        console.error("TO-DO 상태 변경 실패", e);
        fail("상태 변경 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
      }
    });

  return (
    <span className="flex items-center gap-[6px]">
      <span className="w-[120px]">
        <Select aria-label={name ? `${name} 바꿀 상태` : "바꿀 상태"} value={next} disabled={busy} onChange={(e) => setNext(e.target.value as TodoStatus)}>
          {labels.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </span>
      <Button variant="soft" onClick={handleChange} disabled={busy || next === status}>
        {busy ? "바꾸는 중" : "상태 변경"}
      </Button>
      {error && (
        <span role="alert" className="text-erp-off">
          {error}
        </span>
      )}
    </span>
  );
}
