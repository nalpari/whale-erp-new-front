// 탭 BP 를 담는 화면 주소 /bp/{bpCodeId}/... (탭 BP 경로 방식 전환 계획). 폴더는 그대로이고 proxy 가 /bp/{id} 를 떼어 옛 경로로 rewrite 한다.
// next/* 를 import 하지 않는다 — proxy · 클라이언트 · node --test 가 함께 쓴다.

/** proxy 가 rewrite 하며 붙이는 요청 헤더. 서버 쪽 api 호출(authHeaders)과 BFF 가 X-Bp-Code-Id 로 api 에 싣는다. */
export const BP_HEADER = "x-bp-code-id";

/**
 * /bp/{id} 주소로 옮긴 ERP 화면(메뉴 url). 헤더 메뉴가 이 주소에만 bpPath() 를 씌우고, SessionGate 가 BP 없이 들어온 이 주소를 탭 BP 로 보낸다.
 * 화면을 옮기면 한 줄 더한다 — 모두 옮기면 이 목록과 확인을 지운다.
 */
export const BP_PATH_SCREENS = ["/bp-role-groups"] as const;

const BP_PREFIX = /^\/bp\/(\d{1,9})(?=\/|$)/;

/** 주소의 탭 BP. /bp/{id} 가 아니거나 int4 양의 정수가 아니면 null. */
export function bpOfPath(pathname: string): number | null {
  const id = Number(BP_PREFIX.exec(pathname)?.[1] ?? 0);
  return id >= 1 ? id : null;
}

/** /bp/{id} 를 뗀 옛 경로(폴더 경로). 접두가 없으면 그대로. /bp/8 만이면 "/" */
export function stripBp(pathname: string): string {
  return pathname.replace(BP_PREFIX, "") || "/";
}

/** 탭 BP 를 붙인 화면 주소. path 는 / 로 시작하는 옛 경로다 — 늘 /bp/{숫자} 로 시작해 다른 사이트 주소(//host)가 되지 않는다. */
export function bpPath(bpCodeId: number, path: string): string {
  return `/bp/${bpCodeId}${path.startsWith("/") ? path : `/${path}`}`;
}

const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

/** 옮긴 화면의 옛 경로인가(접두를 뗀 주소로 본다). */
export const isBpPathScreen = (pathname: string) => BP_PATH_SCREENS.some((url) => isUnder(stripBp(pathname), url));
