# TO-DO 목록 담당직원 이름 검색 (front)

근거: WHALEERP-713, 2026-11-13 재영 결정(기획 세션 header 전달). api는 같은 이름의 api 계획 문서를 따른다. 명세 「TO-DO 관리」 변경 제안 P-20261113-145852-9f78.

## 고칠 것

- `src/app/todos/todo-filter.tsx`: 「담당직원」 칸에서 개인/전체 선택은 그대로 두고, 그 아래에 이름 검색칸(`SearchField`)을 더한다. 직원 목록의 이름 검색칸과 같은 방식으로, 엔터나 검색 버튼을 누르면 적용하고 초기화하면 비운다.
- `src/app/todos/todo-list-query.ts`: `assigneeName`을 주소(`?assigneeName=`)에 남기고 api 쿼리에 싣는다. 앞뒤 공백을 지우고 50자(api 상한)에서 자른다. 상세에 갔다 와도 `?back=` 규칙으로 유지된다.
- `src/lib/api-types.generated.ts`: api 브랜치의 openapi.json으로 다시 만든다.

## 검증

- todo-list-query 테스트, lint · tsc · build.
- 로컬 실화면 1440×900: 이름 검색 결과, 근무지 전체 배정 건이 걸리는 경우, 본사 계정에서 동의하지 않은 가맹 직원 이름으로 0건.
