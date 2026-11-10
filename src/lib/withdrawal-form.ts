// 회원 탈퇴(마이페이지) 순수 로직 — manyfast S-JHQQNR 「회원 탈퇴」. api 를 부르는 쪽(withdrawal.ts)과
// 갈라 둔다 — api.ts 가 next/headers 를 써서 node --test 가 플레인으로 풀 수 없기 때문이다
// (my-password-form.ts 가 my-password.ts 와 갈라진 것과 같은 이유).
import { ApiError } from "./api-error.ts";
import type { components } from "./api-types.generated.ts";
import { bpPath, isBpPathScreen } from "./bp-path.ts";
import { closingBlockOf, STORE_CLOSING_TIMEOUT, type StoreClosingCounts } from "./store-closing.ts";

/** 탈퇴 전 확인 — closing 은 폐점 안 한 점포 전부의 폐점 확인(점포 관리 폐점과 같은 값). 막는 조건은 closing.isBlocked 하나뿐이다
 * (퇴근 기록이 없는 출근, api 2026-11-05 ponyta — 전엔 진행 중 근로계약이 막았다). */
export type WithdrawEligibility = components["schemas"]["WithdrawEligibilityResponseDto"];
type ClosingStore = WithdrawEligibility["closing"]["stores"][number];

/** link 는 본문 아래 붙는 이동 버튼 — 탈퇴 전에 할 일을 하는 화면으로 보낸다(직원 자료 일괄 저장, WHALEERP-339).
 * closing 이면 본문 아래 폐점 시 함께 처리될 것(점포 전체 합계)을 붙인다 — 점포 관리 폐점 확인 창과 같은 목록이다. */
export type WithdrawWarningBlock = string | { head: string; text?: string; link?: { href: string; label: string }; closing?: true };

/** api 가 거절한 이유를 붙일 칸. 400 만 본다 — 401 등(세션 만료 · 연결 실패)은 칸이 아니라 띠로 보인다.
 * 폐점이 막은 409(퇴근 기록이 없는 출근 등)도 특정 칸을 가리킬 수 없어 띠로 보인다. */
export function withdrawFormField(status: number | undefined, message: string): "currentPassword" | "reasonDetail" | null {
  if (status !== 400) return null;
  if (message.includes("현재 비밀번호가 올바르지")) return "currentPassword";
  if (message.includes("상세를 입력")) return "reasonDetail";
  return null;
}

export type WithdrawVerifyFailure = { ok: false; status?: 400 | 401; message: string };

/** 탈퇴 1단계 비밀번호 확인이 던진 것을 화면 결과로(S-JHQQNR, 2026-10-29 재영). 확인하지 못한 경우(경로가 없는 404 · 5xx ·
 * 연결 실패)는 통과가 아니라 실패다 — 비밀번호를 모르는 사람이 탈퇴 화면을 보지 않게 하는 단계라서다. */
export function withdrawVerifyFailureOf(error: unknown): WithdrawVerifyFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    // 400 은 현재 비밀번호 불일치 — api 문구(「현재 비밀번호가 올바르지 않습니다.」)를 그대로 쓴다.
    if (error.status === 400) return { ok: false, status: 400, message: error.message };
    // 429 는 @nestjs/throttler 기본 예외라 한글 문구가 없다(api 한도 10분 10번).
    if (error.status === 429) return { ok: false, message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요." };
    if (error.status === 403) return { ok: false, message: error.message };
  }
  return { ok: false, message: "비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

export type WithdrawFailure = { ok: false; status?: 400 | 401 | 409; message: string };

/** 회원 탈퇴 저장이 던진 것을 화면 결과로. api 가 판정한 거절이 아니면(5xx · 연결 실패) 탈퇴됐는지 모르므로 「확인하지 못했다」고 말한다. */
export function withdrawFailureOf(error: unknown): WithdrawFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    // 400 은 현재 비밀번호 불일치 · 상세 사유 누락 — api 문구를 그대로 쓴다(화면이 만들지 않는다).
    if (error.status === 400) return { ok: false, status: 400, message: error.message };
    // 409 는 함께 하는 폐점이 막혔다(확인 뒤 생긴 퇴근 기록 없는 출근 OPEN_CHECK_IN · 이미 폐점 · 교착) — 탈퇴 전체가 되돌아갔다.
    // api 문구는 폐점 이야기뿐이라 탈퇴 결과를 앞에 붙인다(2026-11-09 사용자 지정). 화면은 status 409 로 탈퇴 조건을 다시 받는다(출근이 막았으면 막힌 점포가 보인다).
    if (error.status === 409) return { ok: false, status: 409, message: `회원 탈퇴가 처리되지 않았습니다. ${error.message}` };
    // 폐점 시간 초과도 전체가 되돌아갔다 — 같은 503 이라도 code 가 없으면(게이트웨이) 결과를 모른다. 조건은 그대로라 다시 받지 않는다(status 없음).
    if (error.status === 503 && (error.body as { code?: unknown } | null)?.code === STORE_CLOSING_TIMEOUT)
      return { ok: false, message: `회원 탈퇴가 처리되지 않았습니다. ${error.message}` };
    // 429 는 @nestjs/throttler 기본 예외라 한글 문구가 없다 — changeMyPasswordAction 과 같은 이유로 바꾼다.
    if (error.status === 429) return { ok: false, message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요." };
    if (error.status < 500) return { ok: false, message: error.message };
  }
  return { ok: false, message: "회원 탈퇴 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

/** 함께 폐점할 점포 중 막힌 점포 — 선택 상자에 담는다(api 순서 그대로, storeId 오름차순) */
export function blockedStoresOf(eligibility: WithdrawEligibility): ClosingStore[] {
  return eligibility.closing.stores.filter((store) => closingBlockOf(store));
}

/** 「탈퇴 조건」 표의 퇴근 기록 없는 출근 칸 — 없으면 「-」, 막혔으면 점포 수와 건수(가려진 직원 것 포함)만 — 464px 패널의 세 칸 표라 「있음 · 」을 붙이면 두 자리 수에서 잘렸다(2026-11-09 사용자 지정) */
export function openCheckInConditionText(eligibility: WithdrawEligibility): string {
  const stores = blockedStoresOf(eligibility);
  if (!stores.length) return "-";
  const count = closingBlockOf(eligibility.closing.total)?.count ?? 0;
  return `점포 ${stores.length.toLocaleString("ko-KR")}개 ${count.toLocaleString("ko-KR")}건`;
}

/** 탈퇴 경고의 미확정 급여명세서 안내 — 탈퇴하면 그 BP 의 관리자 모두 로그인할 수 없어 점포 폐점 문구(「폐점 후에도 처리할 수 있습니다」)를 쓰면 틀린다(2026-11-09 사용자 지정). 없으면 null */
export function withdrawPayslipText(counts: Pick<StoreClosingCounts, "unconfirmedPayslips">): string | null {
  return counts.unconfirmedPayslips > 0 ? `확정되지 않은 급여명세서 ${counts.unconfirmedPayslips.toLocaleString("ko-KR")}건은 탈퇴 후 처리할 수 없습니다. 탈퇴 전에 확정해 주세요.` : null;
}

/** [회원 탈퇴]가 막힌 이유(말풍선). 막히지 않았으면 undefined */
export function withdrawBlockedReason(eligibility: WithdrawEligibility): string | undefined {
  const stores = blockedStoresOf(eligibility);
  return stores.length ? `퇴근 기록이 없는 출근이 있는 점포가 ${stores.length.toLocaleString("ko-KR")}개 있어 탈퇴할 수 없습니다.` : undefined;
}

/**
 * 이동 버튼이 쓸 두 주소. menuPath 는 메뉴 권한 판정(useCanOpen)용 — 메뉴 판정은 경로만 보므로 쿼리를 뗀다(붙이면 메뉴를 못 찾아
 * 버튼이 늘 숨는다). href 는 실제로 가는 주소 — 탭 BP 주소로 옮긴 화면(/contracts 등)은 admin-header 의 메뉴처럼 /bp/{id} 를
 * 씌우고 쿼리를 다시 붙인다(맨 경로로 가면 SessionGate 가 다시 준비하며 한 번 돌아간다).
 */
export function moveTargetOf(href: string, tabBp: number): { menuPath: string; href: string } {
  const [path, query] = href.split("?");
  const screen = isBpPathScreen(path) ? bpPath(tabBp, path) : path;
  return { menuPath: path, href: query ? `${screen}?${query}` : screen };
}

/** 탈퇴 경고 문구(데모 docs/demo/src/site.mjs 의 withdrawBody 가 같은 문구를 쓴다) — 실제 값으로 바뀌는 자리를
 * eligibility 로 채운다. `<br>` 대신 `\n` 을 쓴다 — 줄바꿈을 어떻게 그릴지는 컴포넌트(withdraw-panel.tsx) 몫이다.
 * 데모의 live()(굵게)에 해당하는 자리(BP 이름·관리자 수·점포 수)는 `**...**` 로 감싼다 — 이 파일은
 * React 를 안 쓰므로(node --test 로 돈다) 마크다운 굵게만 흉내 내고, 실제 굵게 렌더링은 컴포넌트가
 * `**` 를 갈라 맡는다(2026-10-27 사용자 지정 — BP 이름이 눈에 띄어야 한다. 밑줄은 2026-10-30 뺐다).
 * 관리자 계정 · 점포가 0개면 그 문장 · 블록을 뺀다 — 「0개도 미사용」「0개를 모두 폐점」처럼 없는 것을 처리한다고
 * 말하게 되어서다(2026-10-30 사용자 지정).
 * hasFranchiseStore 는 이 BP 에 직영이 아닌 점포가 있는가 — 본사 제공 동의로 가려지는 직원은 그런 점포에만 있다(api hidesPersonalData).
 * 없으면(직영만) 가맹마스터에게 알리라는 줄을 뺀다(2026-10-30 사용자 지정). */
export function withdrawWarningText(eligibility: WithdrawEligibility, hasFranchiseStore = true): WithdrawWarningBlock[] {
  const { bpName, adminCount, storeCount } = eligibility;
  return [
    {
      head: `「**${bpName}**」님의 서비스 이용이 종료됩니다.`,
      ...(adminCount > 0 && { text: `관리자 계정 **${adminCount}개**도 미사용 처리되어 로그인할 수 없습니다.` }),
    },
    ...(storeCount > 0
      ? [
          {
            head: `점포 **${storeCount}개**의 상태가 「폐점」으로 바뀝니다.`,
            text: "서비스상의 점포 상태로, 실제 매장 영업과는 관계없습니다.",
            closing: true as const,
          },
        ]
      : []),
    {
      head: "개인정보가 삭제됩니다.",
      text: "관리자 이름·연락처·이메일은 즉시 삭제되며 아이디는 보관됩니다.",
    },
    // 관리자 계정이 모두 미사용 처리되어 탈퇴 뒤에는 직원 자료를 볼 수 없으니 미리 내려받게 한다(3팀 WHALEERP-339,
    // 운영 정책 RET-09). 본사 제공에 동의하지 않은 가맹 점포 직원은 본사 파일에서 빠지고 이 경고는 BP 마스터만
    // 보므로, 그 가맹마스터에게 알리라는 말까지 둔다.
    {
      head: "직원 자료는 조회할 수 없습니다.",
      text: `필요한 자료는 탈퇴 전에 내려받아 주세요.${hasFranchiseStore ? "\n본사 제공에 동의하지 않은 가맹 점포 직원의 자료는 가맹마스터만 내려받을 수 있으니, 탈퇴 전에 가맹마스터에게 알려 주세요." : ""}`,
      link: { href: "/staff-members/export", label: "직원 자료 일괄 저장" },
    },
    // 「정말 탈퇴하시겠습니까?」는 두지 않는다 — [회원 탈퇴]를 누르면 뜨는 확인창이 묻는다(2026-10-30 사용자 지정).
    { head: "탈퇴한 계정은 복구할 수 없습니다." },
  ];
}
