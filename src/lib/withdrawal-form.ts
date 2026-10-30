// 회원 탈퇴(마이페이지) 순수 로직 — manyfast S-JHQQNR 「회원 탈퇴」. api 를 부르는 쪽(withdrawal.ts)과
// 갈라 둔다 — api.ts 가 next/headers 를 써서 node --test 가 플레인으로 풀 수 없기 때문이다
// (my-password-form.ts 가 my-password.ts 와 갈라진 것과 같은 이유).
import { ApiError } from "./api-error.ts";
import { bpPath, isBpPathScreen } from "./bp-path.ts";

export type WithdrawEligibility = {
  bpName: string;
  adminCount: number;
  storeCount: number;
  hasInProgressContract: boolean;
};

/** link 는 본문 아래 붙는 이동 버튼 — 탈퇴 전에 할 일을 하는 화면으로 보낸다(직원 자료 일괄 저장, WHALEERP-339). */
export type WithdrawWarningBlock = string | { head: string; text?: string; link?: { href: string; label: string } };

/** api 가 거절한 이유를 붙일 칸. 400 만 본다 — 401 등(세션 만료 · 연결 실패)은 칸이 아니라 띠로 보인다.
 * 진행 중인 근로계약이 있어 막힌 경우도 특정 칸을 가리킬 수 없어 띠로 보인다. */
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

/** 탈퇴를 막는 「진행 중」 근로계약 — api IN_PROGRESS_CONTRACT_STATUSES(whale-erp-api src/stores/store-format.ts)와 같다. */
export const IN_PROGRESS_CONTRACT_STATUSES = ["DRAFT", "PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED", "SIGNED"] as const;

/** 근로계약 관리 화면 경로(쿼리 없음). [근로계약 확인] 주소의 앞부분이다. */
export const CONTRACTS_PATH = "/contracts";

/** [근로계약 확인]이 여는 주소 — 근로계약 목록을 진행 중 상태로만 거른다(목록은 status 를 여러 번 받는다).
 * 빈 storeIds 로 점포를 「전체」로 연다 — 없으면 목록이 헤더 범위(점포 하나 · 직영만 등)로 채워져, 탈퇴를 막은 다른 점포의
 * 계약이 안 보일 수 있다(탈퇴 조건은 BP 전체를 본다). 빈 storeIds 는 헤더 범위를 바꾸지 않는다(src/app/contracts/contract-list.ts 의 storesCleared). */
export const IN_PROGRESS_CONTRACTS_HREF = `${CONTRACTS_PATH}?storeIds=&${IN_PROGRESS_CONTRACT_STATUSES.map((s) => `status=${s}`).join("&")}`;

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
