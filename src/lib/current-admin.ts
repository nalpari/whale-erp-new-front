// 지금 로그인한 관리자. 관리자 웹 로그인(1팀)이 아직 없어, api 에 싣는 접속 토큰(세션 · 개발 토큰)의 sub 를 읽는다.
// 화면이 버튼을 미리 숨기고 흐리게 하는 데만 쓴다 — 서명은 확인하지 않는다. 막는 것은 늘 api 다(마스터 보호 · 본인 보호).
// TODO(로그인): 로그인 세션이 사용자 id · 권한 유형을 주면 이 파일을 그것으로 바꾼다.
import { ApiError, authHeaders } from "./api";
import { getPlatformAdmin, type PlatformRoleGroup } from "./platform-admins";

export type CurrentAdmin = { adminAccountId: number; roleTypeCode: PlatformRoleGroup["roleTypeCode"] };

/** 토큰 가운데 조각(payload)의 sub. 토큰이 없거나 모양이 다르면 null. */
function subOf(authorization: string | undefined): number | null {
  const payload = authorization?.replace(/^Bearer /, "").split(".")[1];
  if (!payload) return null;
  try {
    const sub = (JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown }).sub;
    return typeof sub === "number" && Number.isInteger(sub) && sub > 0 ? sub : null;
  } catch (error) {
    // 개발 토큰을 잘못 넣으면 원인을 찾기 어려워 개발 중에만 알린다
    if (process.env.NODE_ENV === "development") console.warn("접속 토큰의 sub 를 읽지 못했습니다", error);
    return null;
  }
}

/** 로그인한 플랫폼 관리자와 권한 유형. 모르면 null — 화면은 아무것도 미리 숨기지 않고 api 판정에 맡긴다. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const id = subOf((await authHeaders()).Authorization);
  if (!id) return null;
  try {
    const me = await getPlatformAdmin(id);
    return { adminAccountId: me.adminAccountId, roleTypeCode: me.roleGroup.roleTypeCode };
  } catch (error) {
    // 플랫폼 관리자가 아니거나(BP 쪽 토큰 → 404) 조회 권한이 없으면(403) 모르는 것으로 둔다 — 예상한 경우라 남기지 않는다.
    // 그 밖(만료 · 5xx · 연결 실패 · 응답 모양 변경)도 화면은 열되, 본인 · 마스터 보호 숨김이 꺼지므로 원인을 남긴다.
    if (!(error instanceof ApiError && (error.status === 403 || error.status === 404))) console.error("현재 관리자 조회 실패", id, error);
    return null;
  }
}
