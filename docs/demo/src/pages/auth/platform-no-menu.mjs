// 플랫폼 권한 요청 안내. 플랫폼관리 사이트는 홈이 없어 로그인하면 GNB 순서상 첫 메뉴로 들어가는데(2026-10-28 재영),
// 접근할 플랫폼 메뉴가 하나도 없는 계정은 이 안내에 머문다(S-XJDKSI). 앱 src/app/platform/no-menu-notice.tsx 와 같은 모양이다.
// 메뉴가 있는 플랫폼 계정은 이 화면을 보지 않는다 — 로그인 직후 bp/index.html(BP 마스터 계정 관리)로 간다.
import * as ui from "../../ui.mjs";
import { platformHeader } from "../../site.mjs";

const LOCK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2"></rect><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"></path><path d="M12 14.5v2.5"></path></svg>`;

export default ({ A, R }) => {
  // ReadonlyCard(제목 바 · 테두리) 와 같은 마크업
  const account = `<div class="w-full text-left"><h3 class="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">계정 정보</h3><div class="flex flex-col gap-[18px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[20px]"><div class="flex gap-[18px]">${ui.readonlyField("아이디", "platjiyoung", true)}${ui.readonlyField("사용자 권한", "플랫폼 관리자")}</div></div></div>`;
  const notice = `<section aria-labelledby="no-menu-title" class="flex w-[420px] flex-col items-center gap-[24px] text-center"><span aria-hidden="true" class="flex size-[64px] items-center justify-center rounded-[4px] border border-erp-panel-line bg-erp-thead-bg text-erp-brand">${LOCK}</span><div class="flex flex-col gap-[10px]"><h2 id="no-menu-title" class="text-[18px] font-semibold text-erp-ink">접근할 수 있는 메뉴가 없습니다.</h2><p class="text-[14px] leading-[1.6] whitespace-nowrap text-erp-label">이 계정에는 아직 플랫폼관리 메뉴 권한이 없습니다. 아래 계정 정보로 관리자에게 권한을 요청해 주세요.</p></div>${account}<div class="flex gap-[6px]">${ui.button("내정보 관리", { variant: "soft", "aria-controls": "platform-mypage-panel", "aria-expanded": "false" })}${ui.button("로그아웃", { variant: "off", href: `${R}auth/login.html` })}</div></section>`;
  const body = `<div class="flex min-h-0 flex-1 p-[24px]"><main class="flex flex-1 items-center justify-center overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">${notice}</main></div>`;
  return { title: "플랫폼 권한 요청 안내", html: ui.erpFrame({ header: platformHeader(A, R, { noMenu: true }), title: "플랫폼관리", body }) };
};
