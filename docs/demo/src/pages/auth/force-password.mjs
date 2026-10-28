// 강제 비밀번호 변경. 목업 docs/mockup/auth/force-password.html 은 로그인 직후 홈 위에 닫을 수 없는 팝업이다.
// 데모는 가운데 카드로 그린다(초기화 비밀번호 계정 기준).
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import * as f from "../../biz-form.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  // 앱 force-password-dialog.tsx 와 같다(2026-10-28 사용자 지정): 폭 520, 안내 15px, 남은 시간 상자(시계 · 큰 시간 · 한 줄 안내),
  // 라벨 먹색 + 빨간 *, 눈 아이콘 칸, 조건 줄 · 「현재 비밀번호는…」 없음, 약관동의 「모두 동의합니다.」 들여쓰기 없음 · 전문 보기 파랑, 버튼 가운데
  const ink = (html) => html.replace("text-erp-label", "text-erp-ink"); // pwField 라벨만 먹색
  const clock = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-[28px] shrink-0 text-erp-brand" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 3h5"/></svg>`;
  const remaining = `<div class="flex items-center gap-[12px] rounded-[4px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px]">${clock}<div class="flex min-w-0 flex-col gap-[2px]"><p class="flex items-baseline gap-[8px] text-[14px]"><span class="text-erp-label">남은 시간</span><b class="text-[18px] font-semibold tabular-nums text-erp-ink">57:55</b></p><p class="text-[14px] text-erp-label">시간 안에 새 비밀번호로 변경해 주세요.</p></div></div>`;
  const termsRow = (id, label) => `<div class="flex items-center justify-between">${ui.checkbox(A, label, false, { id })}<span class="text-[14px] text-erp-link underline underline-offset-2">전문 보기</span></div>`;
  const terms =
    `<fieldset class="flex flex-col gap-[12px] border-t border-erp-divider pt-[18px]"><legend class="sr-only">약관동의</legend><p><b class="text-[16px] font-semibold">약관동의</b></p>` +
    ui.checkbox(A, "모두 동의합니다.", false, { id: "fp-all" }) +
    termsRow("fp-use", "이용약관 동의 (필수)") +
    termsRow("fp-policy", "개인정보 수집·이용 동의 (필수)") +
    `</fieldset>`;
  const card =
    p.cardTitle("새 비밀번호 설정", "서비스 이용을 위해 새로운 비밀번호를 설정해 주세요.").replace('<p class="text-[14px] text-erp-label">', '<p class="text-[15px] text-erp-label">') +
    remaining +
    ink(f.pwField(A, "새 비밀번호", "", "off", { placeholder: "영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요." })) +
    ink(f.pwField(A, "새 비밀번호 확인", "", "off")) +
    terms +
    `<div class="flex justify-center gap-[6px]">${ui.button("로그아웃", { variant: "off", href: link(R, "home/index.html") })}${ui.button("변경", { href: link(R, "home/signed-in.html") })}</div>`;
  return { title: "새 비밀번호 설정", html: p.authPage(A, R, { card, width: "w-[520px]" }) };
};
