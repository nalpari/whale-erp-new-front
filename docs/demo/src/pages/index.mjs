// 데모 입구. 영역별로 만든 화면을 모두 늘어놓는다. 목록은 build.mjs 가 넘겨준다(pages).
import * as ui from "../ui.mjs";

const AREAS = [
  ["home", "홈", "3팀"],
  ["auth", "로그인 · 가입", "1팀"],
  ["mypage", "MY PAGE", "1팀"],
  ["stores", "점포관리", "1팀"],
  ["staff", "직원관리", "3팀"],
  ["config", "환경설정", "1팀"],
  ["support", "고객지원 · 커뮤니티관리", "3팀"],
  ["notify", "운영 알림", "3팀"],
  ["bp", "BP 마스터 계정 관리 (플랫폼)", "1팀"],
  ["system", "시스템관리 (플랫폼)", "1팀"],
];

export default ({ pages }) => {
  const sections = AREAS.map(([dir, label, team]) => {
    const list = pages
      .filter((p) => p.rel.startsWith(`${dir}/`))
      .map((p) => `<li class="flex h-[34px] items-center justify-between gap-[12px] border-b border-erp-divider">${ui.link(p.rel.endsWith("-master.html") ? `${p.title} · 플랫폼 마스터` : p.title, p.rel)}<span class="text-[13px] text-erp-label">${p.rel}</span></li>`)
      .join("");
    return `<section class="flex flex-col gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]"><div class="flex items-baseline gap-[10px]"><h2 class="text-[18px] font-semibold text-erp-ink">${label}</h2><span class="text-[13px] text-erp-label">${team}</span></div><ul class="text-[14px]">${list}</ul></section>`;
  }).join("");
  const count = pages.filter((p) => !p.rel.startsWith("_check/")).length;
  return {
    title: "화면 목록",
    html: `<div class="${ui.ERP_THEME} min-h-[100dvh] bg-erp-thead-bg! px-[24px] py-[40px]"><div class="mx-auto flex max-w-[1200px] flex-col gap-[24px]"><div class="flex flex-col gap-[6px]"><h1 class="text-[22px] font-semibold text-erp-ink">Whale ERP 데모 · 화면 ${count}장</h1><p class="text-[14px] text-erp-label">목업을 1팀 디자인 가이드(DESIGN.md) 생김새로 옮긴 정적 화면입니다. 값은 바뀌지 않고, 저장·검색은 흉내만 냅니다.</p></div><div class="grid grid-cols-2 gap-[12px]">${sections}</div></div></div>`,
  };
};
