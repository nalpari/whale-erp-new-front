// 로그인 전 홈. 목업 docs/mockup/home/index.html. 위쪽 메뉴 넷은 이 페이지 안의 구획으로 내려간다.
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

const WRAP = "mx-auto w-[1200px] px-[24px]";
// 구획: 바탕은 흰색과 #f8f9fb 를 번갈아 쓴다.
const section = (id, soft, tag, title, lead, extra = "") =>
  `<section id="${id}" class="scroll-mt-[70px] border-t border-erp-bar-line ${soft ? "bg-erp-thead-bg" : "bg-white"} py-[48px]"><div class="${WRAP} flex flex-col gap-[24px]"><div class="flex max-w-[60ch] flex-col gap-[10px]"><p class="text-[14px] font-medium text-erp-label">${tag}</p><h2 class="text-[22px] font-semibold">${title}</h2><p class="text-[15px] leading-[1.6]">${lead}</p></div>${extra}</div></section>`;
// 소개 카드(그림자 없는 4px 카드)
const card = (title, desc, tag = "") =>
  `<div class="flex flex-col gap-[10px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]"><p class="flex items-center"><b class="flex-1 text-[16px] font-semibold">${title}</b>${tag ? `<span class="text-[13px] text-erp-label">${tag}</span>` : ""}</p><p class="text-[14px] leading-[1.6] text-erp-label">${desc}</p></div>`;
const tile = (t) => `<span class="flex h-[46px] items-center justify-center rounded-[4px] border border-erp-panel-line bg-white text-[14px] font-medium">${t}</span>`;

export default ({ A, R }) => {
  const hero = `<section class="bg-white py-[72px]"><div class="${WRAP} flex flex-col items-center gap-[18px] text-center"><p class="text-[14px] font-medium text-erp-label">다점포 · 프랜차이즈 점포 운영 플랫폼</p><h1 class="text-[22px] leading-[1.4] font-semibold">점포가 늘어도<br>관리는 한 곳에서</h1><p class="max-w-[54ch] text-[15px] leading-[1.6]">직원 채용부터 근무·급여까지, 점포마다 흩어지던 일을 하나의 기준으로 모읍니다. 직영과 가맹을 함께 운영해도 범위만 바꿔 같은 화면에서 봅니다.</p><div class="flex gap-[6px]">${ui.button("사업자 회원가입", { href: link(R, "auth/signup.html") })}${ui.button("도입문의", { variant: "soft", href: link(R, "home/inquiry.html") })}</div>${p.note("직원은 이 화면이 아니라 <b class=\"font-semibold text-erp-ink\">직원 전용 앱</b>으로 들어갑니다.")}</div></section>`;

  const main =
    hero +
    section(
      "ops",
      false,
      "매장운영",
      "사람과 근무를 한 화면에서",
      "근로계약서 초안을 쓰면 초대가 자동으로 나갑니다. 가입이 끝나는 순간 계약서가 발송되고, 근무스케줄과 출퇴근이 급여명세서 초안까지 이어집니다.",
      `<div class="grid grid-cols-3 gap-[12px]">${card("직원 · 근로계약", "근로계약서 초안이 채용의 시작점입니다. 상태는 발송 대기부터 종료까지 여섯 단계로 남습니다.")}${card("근무스케줄", "하루 근무를 시간축에 겹쳐 놓아 사람이 비는 시간과 몰리는 시간을 눈으로 찾습니다.")}${card("급여명세서", "계약과 출퇴근을 참조해 초안을 만듭니다. 검토가 필요한 건은 사유와 함께 따로 모입니다.")}</div>`,
    ) +
    section("finance", true, "재무관리", "들어온 돈과 나간 돈", "입출금과 거래를 등록하고 계정별로 현황을 봅니다. 부가서비스 구독으로 사용합니다.") +
    section(
      "franchise",
      false,
      "프랜차이즈",
      "본사가 정하면 가맹으로 내려갑니다",
      "가맹점을 초대하고 계약서를 관리합니다. 기초정보는 본사가 정한 것을 가맹이 그대로 씁니다.",
      `<div class="grid grid-cols-2 gap-[12px]">${card("본사 · BP Master", "기초정보와 계약서 템플릿을 만들고, 가맹점을 초대해 계약을 맺습니다.", "직접 관리")}${card("가맹 · 가맹 Master", "본사가 정한 기초정보는 보기만 하고, 자기 점포의 직원과 근무는 직접 관리합니다.", "조회 전용 일부")}</div>`,
    ) +
    section(
      "addons",
      true,
      "부가서비스",
      "필요한 것만 구독합니다",
      "POS·KIOSK·주문·예약처럼 점포마다 다른 기능은 구독으로 붙입니다.",
      `<div class="grid w-[720px] grid-cols-3 gap-[12px]">${["POS", "KIOSK", "QR 주문", "예약", "재고", "레시피"].map(tile).join("")}</div>${p.note("구독한 상품은 로그인 후 홈의 바로가기에 나타납니다.")}`,
    ) +
    `<section class="border-t border-erp-bar-line bg-white py-[48px]"><div class="${WRAP} flex items-center gap-[24px]"><div class="flex flex-1 flex-col gap-[10px]"><h2 class="text-[22px] font-semibold">먼저 물어보셔도 됩니다</h2><p class="text-[15px]">가입 전에 도입 상담을 받을 수 있습니다. 로그인은 필요하지 않습니다.</p></div>${ui.button("도입문의 남기기", { href: link(R, "home/inquiry.html") })}</div></section>`;

  const col = (title, items) =>
    `<div class="flex flex-col gap-[12px]"><h4 class="text-[14px] font-semibold text-erp-ink">${title}</h4><ul class="flex flex-col gap-[10px]">${items.map(([t, h]) => `<li>${p.quietLink(t, h)}</li>`).join("")}</ul></div>`;
  const home = link(R, "home/index.html");
  const login = link(R, "auth/login.html");
  const at = (h, id) => (h === "#" ? "#" : `${h}#${id}`);
  const foot = `<footer class="border-t border-erp-bar-line bg-erp-thead-bg"><div class="${WRAP} flex flex-col gap-[24px] py-[48px] text-[13px] text-erp-label"><div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[24px]"><div class="flex flex-col gap-[12px]">${p.brand(A, home)}<p>다점포·프랜차이즈 점포 운영 플랫폼.</p></div>${col("서비스", [
    ["매장운영", "#ops"],
    ["재무관리", "#finance"],
    ["프랜차이즈", "#franchise"],
    ["부가서비스", "#addons"],
  ])}${col("계정", [
    ["로그인", login],
    ["사업자 회원가입", link(R, "auth/signup.html")],
    ["아이디·비밀번호 찾기", link(R, "auth/find.html")],
  ])}${col("안내", [
    ["공지사항", link(R, "home/notices.html")],
    ["FAQ", at(link(R, "home/notices.html"), "faq")],
    ["도입문의", link(R, "home/inquiry.html")],
  ])}</div><div class="flex items-center gap-[18px] border-t border-erp-bar-line pt-[18px]"><span>${p.BIZ}</span><span class="flex-1">서울특별시 서대문구 연세로 5다길 22-3 발리빌딩 3층</span>${p.quietLink("이용약관", link(R, "auth/terms.html#use"))}${p.quietLink("개인정보처리방침", "#")}</div></div></footer>`;

  return { title: "점포 운영을 한 곳에서", html: p.sitePage(A, R, { main, foot }) };
};
