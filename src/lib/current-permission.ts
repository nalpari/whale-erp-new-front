// 지금 사용자의 메뉴 권한. 관리자 웹 로그인 · 권한 조회가 아직 없어 임시로 여기 한 곳에서 정한다.
// 로그인이 생기면 이 함수 몸통만 실제 권한 조회(권한 그룹의 메뉴별 등록·수정 / 조회)로 바꾼다 — 화면은 이 함수만 본다.

/** manage = 등록·수정, view = 조회만. */
export type Permission = "manage" | "view";

/**
 * 플랫폼 공통코드 관리 권한. 개발 중에는 주소에 `?permission=view` 를 붙여 조회만 권한을 볼 수 있다.
 * Next 16 의 searchParams 는 Promise 라, 페이지가 await 한 값을 넘긴다.
 */
export function getCodePermission(searchParams: Record<string, string | string[] | undefined>): Permission {
  // TODO(로그인): 실제 권한 조회로 바꾸고 ?permission 은 지운다.
  return searchParams.permission === "view" ? "view" : "manage";
}

/** 플랫폼 관리자 관리 권한. manage = 등록 · 수정 · 삭제 · 비밀번호 초기화. 공통코드와 같이 `?permission=view` 로 조회만을 본다. */
export function getPlatformAdminPermission(searchParams: Record<string, string | string[] | undefined>): Permission {
  // TODO(로그인): 실제 권한 조회(메뉴 MN000213 의 등록 · 수정 · 삭제 따로)로 바꾸고 ?permission 은 지운다.
  return searchParams.permission === "view" ? "view" : "manage";
}
