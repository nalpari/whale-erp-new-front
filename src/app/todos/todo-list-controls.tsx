"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Button, Pagination, Select } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";
import { toTodoListSearch, withFilter, type TodoListQuery } from "./todo-list-query";

/** 낙관적 쿼리로 URL 을 바꾼다(직원 목록 staff-list-controls 와 같은 방식) */
function useTodoListNavigation(query: TodoListQuery) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: TodoListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/todos${toTodoListSearch(next)}`, { scroll: false });
    });
  return { current, navigate };
}

// 페이지당 건수. 바꾸면 1쪽으로 돌아간다.
export function TodoPageSize({ query }: { query: TodoListQuery }) {
  const { current, navigate } = useTodoListNavigation(query);
  return (
    <div className="w-[80px] shrink-0">
      <Select
        aria-label="페이지당 건수"
        value={String(current.pageSize)}
        onChange={(e) => navigate(withFilter(current, { pageSize: Number(e.target.value) as PageSize }))}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function TodoPagination({ query, totalPages }: { query: TodoListQuery; totalPages: number }) {
  const { current, navigate } = useTodoListNavigation(query);
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}

// 「TO-DO 등록」 — 등록 권한일 때만 보인다. 막는 것은 api 다.
export function TodoCreateButton({ href }: { href: string }) {
  const canCreate = useMenuRole(MENU_CODE.todos, "create");
  return canCreate ? <Button href={href}>TO-DO 등록</Button> : null;
}
