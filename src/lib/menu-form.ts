// 플랫폼 메뉴 수정 · 등록 폼(노출 메뉴명 · 메뉴 URL · 사용 상태)의 검사와 기준값 맞추기. 화면 없이 node --test 로 바로 돌린다
// (next/* 를 import 하지 않는다). 기준값은 권한 수정 폼(role-form-sync.ts)과 같은 규칙이다 — 마지막으로 맞춘 서버 값과 그때의
// updatedAt 을 쥐고 저장을 그 updatedAt 으로 보내, 그 사이 다른 사람이 고쳤으면 api 가 409 로 알린다. 옮기기는 updatedAt 만 바꾼다.

export type MenuStatus = "ACTIVE" | "INACTIVE";
export type MenuFormValues = { name: string; url: string; status: MenuStatus };
export type MenuFormBase = MenuFormValues & { updatedAt: string };

/** 저장할 값(앞뒤 공백을 지운 것) — 기준값과 견줄 때도 이 모양으로 본다 */
export const trimmedOf = (f: MenuFormValues): MenuFormValues => ({ name: f.name.trim(), url: f.url.trim(), status: f.status });

const sameValues = (a: MenuFormValues, b: MenuFormValues) => {
  const x = trimmedOf(a);
  const y = trimmedOf(b);
  return x.name === y.name && x.url === y.url && x.status === y.status;
};

/** 고친 것이 있는가 — 새 서버 값이 왔을 때 칸을 다시 채울지 가른다(sync…). [저장]은 막지 않는다(2026-10-30 재영) */
export const isDirty = (base: MenuFormValues, form: MenuFormValues) => !sameValues(base, form);

const valuesOf = (b: MenuFormBase): MenuFormValues => ({ name: b.name, url: b.url, status: b.status });

/**
 * 새 서버 값이 왔을 때.
 * - 값은 그대로이고 updatedAt 만 바뀌었다(옮기기 · 내 저장): 기준 updatedAt 만 올리고 칸은 그대로.
 * - 서버 값이 바뀌었고 칸을 손대지 않았다: 새 값으로 칸을 다시 채운다.
 * - 서버 값이 바뀌었는데 고치던 중이다: 기준값을 그대로 둔다 — 저장하면 옛 updatedAt 이라 api 가 409 로 알린다.
 * - reload(409 뒤 최신 정보를 받은 것): 고치던 중이어도 새 값으로 다시 채운다.
 */
export function syncMenuForm(base: MenuFormBase, form: MenuFormValues, server: MenuFormBase, reload = false): { base: MenuFormBase; form: MenuFormValues } {
  if (server.updatedAt === base.updatedAt && !reload) return { base, form };
  if (reload) return { base: server, form: valuesOf(server) };
  if (sameValues(base, server)) return { base: { ...base, updatedAt: server.updatedAt }, form };
  if (!isDirty(base, form)) return { base: server, form: valuesOf(server) };
  return { base, form };
}

/**
 * 동시 수정 409 를 받았을 때 — 받아 둔 서버 값(server)으로 바로 다시 채운다. 받아 둔 값이 기준과 같은 updatedAt 이면(아직 남의 변경을
 * 못 받았다) waitForRefresh — refresh 로 올 새 값으로 한 번 더 맞춘다(role-form-sync 의 afterConflict 와 같다).
 */
export function afterConflict(base: MenuFormBase, form: MenuFormValues, server: MenuFormBase): { base: MenuFormBase; form: MenuFormValues; waitForRefresh: boolean } {
  if (server.updatedAt === base.updatedAt) return { base, form, waitForRefresh: true };
  return { ...syncMenuForm(base, form, server, true), waitForRefresh: false };
}

/**
 * 노출 메뉴명 1~20자(필수), URL 은 선택 · 200자. URL 은 1뎁스 한 구간만 받는다 — '/' 하나로 시작하는 소문자 · 숫자 · '-'
 * (예: /staff/content 가 아니라 /staff-content). 등록과, 수정에서 URL 을 바꿀 때 건다 — keptUrl(수정 전 URL)과 같으면 건너뛴다.
 * 1팀 메뉴 10개는 2026-10-19(api 20261019144438), 3팀 커뮤니티 메뉴 넷은 2026-10-20(api 20261020161147)에 1뎁스로 옮겼다.
 * 사용중지 메뉴(/stores/contract-templates 등)는 아직 여러 구간이다 — 그 URL 을 그대로 둔 채 이름 · 상태를 고칠 수 있게 남겨 둔다.
 * api 서비스(platform-menus.service create · update)와 같은 규칙이다 — 화면에서 먼저 알리고, 화면을 거치지 않은 요청은 api 가 400 으로 막는다.
 */
export const MENU_NAME_MAX = 20;
export const MENU_URL_MAX = 200;
const MENU_URL_PATTERN = /^\/[a-z0-9-]+$/;
export type MenuFormErrors = Partial<Record<"name" | "url", string>>;

export function validateMenuForm(f: MenuFormValues, keptUrl?: string): MenuFormErrors {
  const errors: MenuFormErrors = {};
  const { name, url } = trimmedOf(f);
  // 화면 문구는 「메뉴명」(2026-10-26 사용자 지정). api 거절 문구는 아직 「노출 메뉴명」이라 아래 menuFieldOf 는 그 말로 가른다
  if (!name) errors.name = "메뉴명을 입력해 주세요.";
  else if (name.length > MENU_NAME_MAX) errors.name = `메뉴명은 ${MENU_NAME_MAX}자까지입니다.`;
  if (url.length > MENU_URL_MAX) errors.url = `메뉴 URL은 ${MENU_URL_MAX}자까지입니다.`;
  else if (url && url !== keptUrl?.trim() && !MENU_URL_PATTERN.test(url))
    errors.url = "메뉴 URL은 '/' 하나로 시작하는 1뎁스 경로만 됩니다 — 소문자 · 숫자 · '-'로, 구간은 '-'로 잇습니다(예: /staff-content).";
  return errors;
}

/** 저장 요청의 세 칸 — 빈 URL 은 null(비운다) */
export const bodyOf = (f: MenuFormValues) => {
  const { name, url, status } = trimmedOf(f);
  return { name, url: url || null, status };
};

/**
 * api 거절 문구를 붙일 칸 — 노출 메뉴명 형식은 이름 칸, URL 형식 · 겹침(409)은 URL 칸, 그 밖(동시 수정 · 상위 · 서비스)은 null(띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다(platform-menus DTO · assertUrlFree).
 */
export function menuFieldOf(message: string): "name" | "url" | null {
  if (message.startsWith("노출 메뉴명")) return "name";
  if (message.startsWith("메뉴 URL") || message.includes("겹치는 URL")) return "url";
  return null;
}

/** 이 409 가 「그 사이 다른 사람이 고쳤다」(동시 수정)인가 — 그때만 최신 값으로 칸을 다시 채운다. api 문구 CHANGED_MEANWHILE */
export const isChangedMeanwhile = (message: string) => message.includes("먼저 수정했습니다");
