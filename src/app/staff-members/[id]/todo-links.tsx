"use client";

import Link from "next/link";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";

// 직원 상세 TO-DO 영역의 링크. 직원 상세는 「직원 정보 관리」 권한으로 열리고 TO-DO 화면은 「TO-DO 리스트 관리」(MN000026) 조회 권한이라,
// 그 권한이 없는 관리자를 공통 틀이 막는 곳으로 보내지 않게 링크를 글자로 바꾼다. 막는 것은 공통 틀과 api 다.

/** 영역 머리의 「관리」. 조회 권한이 없으면 흐리게 두고 누를 수 없게 한다(화면이 없을 때의 「관리」와 같은 모양) */
export function TodoManageLink({ href }: { href: string }) {
  const canRead = useMenuRole(MENU_CODE.todos, "read");
  return canRead ? (
    <Link href={href} className="text-erp-link hover:underline">
      관리
    </Link>
  ) : (
    <span aria-disabled="true" title="TO-DO 리스트 관리 조회 권한이 없습니다." className="cursor-default text-erp-muted">
      관리
    </span>
  );
}

/** TO-DO 제목. 조회 권한이 없으면 글자만 */
export function TodoTitleLink({ todoId, title }: { todoId: number; title: string }) {
  const canRead = useMenuRole(MENU_CODE.todos, "read");
  return canRead ? (
    <Link href={`/todos/${todoId}`} className="min-w-0 flex-1 truncate text-erp-link hover:underline">
      {title}
    </Link>
  ) : (
    <span className="min-w-0 flex-1 truncate">{title}</span>
  );
}
