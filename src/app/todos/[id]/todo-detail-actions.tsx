"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, Select, useToast } from "@/components/common";
import { useMenuPermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import { useFailure } from "../../staff-members/[id]/use-action-failure";
import { changeTodoStatusAction, deleteTodoAction } from "../actions";
import type { TodoStatus } from "../todo-list-query";
import { deletePreview, deleteResultMessage, type TodoDetail } from "../todo-row";

// 상세 제목 줄 오른쪽 — 수정(수정 권한) · 삭제(삭제 권한, 지울 대기 행이 있을 때) · 목록. 권한은 로그인 정보의 메뉴 권한으로 미리 가리고 막는 것은 api 다.
export function TodoDetailActions({ detail, listHref }: { detail: TodoDetail; listHref: string }) {
  const can = useMenuPermission(MENU_CODE.todos);
  const [open, setOpen] = useState(false);
  const { pending } = deletePreview(detail);

  return (
    <>
      {can.update && (
        <Button variant="soft" href={`/todos/${detail.todoId}/edit`}>
          수정
        </Button>
      )}
      {can.delete && pending > 0 && (
        <Button variant="soft" onClick={() => setOpen(true)}>
          삭제
        </Button>
      )}
      <Button href={listHref}>목록</Button>
      {open && <DeleteTodoDialog detail={detail} listHref={listHref} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 삭제 확인창(T-2). 그룹이면 대기인 행만 지우고 진행 중 · 완료는 남는다고 미리 알리고, 지운 뒤 api 가 준 건수로 다시 알린다 */
function DeleteTodoDialog({ detail, listHref, onClose }: { detail: TodoDetail; listHref: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
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
          // 들어올 때의 목록 조건으로 돌아간다
          router.push(listHref);
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

  return (
    <ConfirmDialog open title="이 TO-DO 를 삭제하시겠습니까?" confirmLabel={busy ? "삭제 중" : "삭제"} confirmVariant="danger" busy={busy} onConfirm={handleConfirm} onCancel={onClose}>
      <p>
        「{detail.title}」을 지웁니다. 배정된 직원 근무 앱에서도 사라집니다.
        {group && ` 같이 배정한 ${pending + remaining}건 가운데 대기 ${pending}건만 지우고${remaining ? `, 진행 중 · 완료 ${remaining}건은 남깁니다` : ""}.`}
      </p>
      {error && (
        <p role="alert" className="mt-[12px] text-erp-off">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}

/** 관리자가 직원 대신 상태를 바꾼다(T-1). 그룹이면 이 행만 바뀐다. 수정 권한이 없으면 그리지 않는다 */
export function TodoStatusControl({ todoId, status, labels }: { todoId: number; status: TodoStatus; labels: EnumValue[] }) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const can = useMenuPermission(MENU_CODE.todos);
  const [next, setNext] = useState<TodoStatus>(status);
  const [error, setError] = useState("");
  const [busy, startChanging] = useTransition();
  if (!can.update) return null;

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
        if (message) setError(message);
        if (result.status === 409 || result.status === 404) router.refresh();
      } catch (e) {
        console.error("TO-DO 상태 변경 실패", e);
        setError("상태 변경 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
      }
    });

  return (
    <span className="flex items-center gap-[6px]">
      <span className="w-[120px]">
        <Select aria-label="바꿀 상태" value={next} disabled={busy} onChange={(e) => setNext(e.target.value as TodoStatus)}>
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
