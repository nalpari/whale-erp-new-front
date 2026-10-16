// 플랫폼 권한 수정 폼(권한명 · 설명)의 기준값 맞추기. 화면 없이 node --test 로 바로 돌린다(next/* 를 import 하지 않는다).
// 폼은 「기준값」(마지막으로 맞춘 서버 값 + 그때의 updatedAt)을 쥐고, 저장은 기준값의 updatedAt 으로 보낸다 — 그래야 그 사이
// 다른 사람이 고쳤을 때 api 가 409 로 알린다. 새 서버 값이 오면 아래 규칙으로 기준값 · 칸을 맞춘다.

export type RoleFormValues = { name: string; description: string };
export type RoleFormBase = RoleFormValues & { updatedAt: string };

const sameValues = (a: RoleFormValues, b: RoleFormValues) => a.name === b.name && a.description === b.description;

/** 저장할 값(앞뒤 공백을 지운 것) — 기준값과 견줄 때도 이 모양으로 본다 */
export const trimmedOf = (f: RoleFormValues): RoleFormValues => ({ name: f.name.trim(), description: f.description.trim() });

/** 고친 것이 있는가 — 없으면 [저장]을 막는다 */
export const isDirty = (base: RoleFormValues, form: RoleFormValues) => !sameValues(trimmedOf(base), trimmedOf(form));

/**
 * 새 서버 값이 왔을 때.
 * - 권한명 · 설명은 그대로이고 updatedAt 만 바뀌었다(메뉴 권한 저장 · 내 저장): 기준 updatedAt 만 올리고 칸은 그대로.
 * - 서버 값이 바뀌었고 칸을 손대지 않았다: 새 값으로 칸을 다시 채운다.
 * - 서버 값이 바뀌었는데 칸을 고치던 중이다: 기준값을 그대로 둔다 — 저장하면 옛 updatedAt 이라 api 가 409 로 알린다.
 * - reload(409 뒤 최신 정보를 받은 것): 고치던 중이어도 새 값으로 다시 채운다.
 */
export function syncRoleForm(
  base: RoleFormBase,
  form: RoleFormValues,
  server: RoleFormBase,
  reload = false,
): { base: RoleFormBase; form: RoleFormValues } {
  if (server.updatedAt === base.updatedAt && !reload) return { base, form };
  const fresh = { name: server.name, description: server.description };
  if (reload) return { base: server, form: fresh };
  if (sameValues(base, server)) return { base: { ...base, updatedAt: server.updatedAt }, form };
  if (!isDirty(base, form)) return { base: server, form: fresh };
  return { base, form };
}

/**
 * 동시 수정 409 를 받았을 때. 마지막으로 받은 서버 값(server)으로 바로 다시 채운다 — refresh 를 기다리면, 고치던 중에 최신 값을
 * 이미 받아 둔 경우 새로 오는 값의 updatedAt 이 이미 본 값과 같아 다시 채우기가 돌지 않고 저장이 계속 409 가 된다.
 * 받아 둔 값이 기준과 같은 updatedAt 이면(아직 남의 변경을 못 받았다) waitForRefresh — refresh 로 올 새 값으로 한 번 더 맞춘다.
 */
export function afterConflict(base: RoleFormBase, form: RoleFormValues, server: RoleFormBase): { base: RoleFormBase; form: RoleFormValues; waitForRefresh: boolean } {
  if (server.updatedAt === base.updatedAt) return { base, form, waitForRefresh: true };
  return { ...syncRoleForm(base, form, server, true), waitForRefresh: false };
}

/** 권한명 1~20자(필수) · 설명 100자 — api DTO(CreatePlatformRoleGroupDto)와 같은 규칙. 앞뒤 공백을 지우고 센다 */
export const ROLE_NAME_MAX = 20;
export const ROLE_DESCRIPTION_MAX = 100;
export type RoleFormErrors = Partial<Record<keyof RoleFormValues, string>>;

export function validateRoleForm(f: RoleFormValues): RoleFormErrors {
  const errors: RoleFormErrors = {};
  const { name, description } = trimmedOf(f);
  if (!name) errors.name = "권한명을 입력해 주세요.";
  else if (name.length > ROLE_NAME_MAX) errors.name = `권한명은 ${ROLE_NAME_MAX}자까지입니다.`;
  if (description.length > ROLE_DESCRIPTION_MAX) errors.description = `설명은 ${ROLE_DESCRIPTION_MAX}자까지입니다.`;
  return errors;
}

/**
 * api 거절 문구를 붙일 칸 — 이름 중복(409) · 권한명 형식은 권한명 칸, 설명 형식은 설명 칸, 그 밖(동시 수정 · 고정 권한 · 권한 없음)은 null(띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다.
 */
export function roleFieldOf(message: string): keyof RoleFormValues | null {
  if (message.includes("같은 이름") || message.startsWith("권한명")) return "name";
  if (message.startsWith("설명")) return "description";
  return null;
}

/** 이 409 가 「그 사이 다른 사람이 고쳤다」(동시 수정)인가 — 그때만 최신 값으로 칸을 다시 채운다. api 문구 CHANGED_MEANWHILE */
export const isChangedMeanwhile = (message: string) => message.includes("먼저 수정했습니다");
