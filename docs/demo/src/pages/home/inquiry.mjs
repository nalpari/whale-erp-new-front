// 도입문의(비로그인). 목업 docs/mockup/home/inquiry.html 의 항목을 비로그인 디자인(Figma 로그인전 폼 규격, 회원가입과 같은 틀)으로 그렸다.
// 데모라 접수 요청은 보내지 않는다. 필수 칸이 차면 접수 안내만 보인다(guest.js 「데모 접수」).
import * as g from "../../guest.mjs";

const REQUIRED = `<span aria-hidden="true" class="text-[#e93737]"> *</span><span class="sr-only">(필수)</span>`;
const field = (label, body, { required = false, help = "" } = {}) =>
  `<label class="flex flex-col gap-[10px]"><span class="${g.LABEL}">${label}${required ? REQUIRED : ""}</span>${body}${help ? `<span class="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">${help}</span>` : ""}</label>`;
const input = (attrs) => `<span class="${g.INPUT_BOX}"><input ${attrs} class="${g.INPUT}"></span>`;
// 고르는 칸. 입력칸과 같은 껍데기에 오른쪽 화살표를 둔다. 펼친 목록은 assets/base.css 의 select.guest-select 가 그리고, 열리면 화살표가 뒤집힌다.
// select 는 칸의 여백까지 덮어 56px 칸 어디를 눌러도 열린다. 화살표는 그 위에 겹치고 클릭을 통과시킨다.
const CHEVRON = `<svg aria-hidden="true" class="pointer-events-none absolute right-[16px] size-[16px] text-[#767676] transition-[rotate] duration-150 motion-reduce:transition-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>`;
const select = (name, options, required = false) =>
  `<span class="${g.INPUT_BOX} relative [&:has(select:open)_svg]:rotate-180"><select name="${name}"${required ? " required" : ""} class="guest-select ${g.INPUT} -mx-[16px] cursor-pointer appearance-none self-stretch pr-[42px] pl-[16px] has-[option[value='']:checked]:text-[#999]"><option value="" hidden selected>선택해 주세요</option>${options.map((o) => `<option class="text-guest-ink">${o}</option>`).join("")}</select>${CHEVRON}</span>`;
const TEXTAREA = `min-h-[180px] w-full resize-none rounded-[6px] border border-[#ebebeb] bg-white p-[16px] text-[15px] leading-[1.6] text-guest-ink outline-none! placeholder:text-[#999] focus:border-guest-navy ${g.HOVER}`;
const section = (title, note, body) =>
  `<section class="flex flex-col gap-[24px] border-t border-[#ebebeb] pt-[32px]"><h2 class="text-[20px] leading-[1.4] font-semibold text-[#111]">${title}${note ? `<span class="ml-[10px] text-[15px] font-normal text-[#767676]">${note}</span>` : ""}</h2>${body}</section>`;
const grid = (...c) => `<div class="grid grid-cols-2 gap-[16px]">${c.join("")}</div>`;

export default ({ A, R }) => {
  const who = section(
    "문의자 정보",
    `(<span class="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)`,
    grid(
      field("이름", input('name="name" required autocomplete="name" placeholder="홍길동"'), { required: true }),
      field("전화번호", input('name="phone" type="tel" required inputmode="numeric" autocomplete="tel" placeholder="숫자만 입력해 주세요"'), { required: true, help: "점포 번호를 적어도 됩니다. 중복 접수는 이 번호와 이메일로 가립니다." }),
      // 업종에서 「기타」를 고르면 아래에 직접 입력 칸이 열린다(LEAD-1 · #297, api industryDetail 1~50자). 닫혀 있는 동안은 검사·전송에서 빠진다.
      field("업종", select("industry", ["카페·음료", "음식점", "베이커리·디저트", "주점", "기타"], true).replace("<select ", "<select data-other-select "), { required: true }),
      field("이메일", input('name="email" type="email" data-email-format="이메일 형식이 올바르지 않습니다." required autocomplete="email" placeholder="example@company.com"'), { required: true, help: "접수 확인 메일을 이 주소로 보냅니다." }),
      `<div data-other-wrap hidden class="col-start-1">${field("업종 직접 입력", input('name="industryOther" data-other-input required disabled maxlength="50" placeholder="업종을 직접 입력해 주세요"'), { required: true })}</div>`,
    ),
  );
  const what = section(
    "도입 문의 내용",
    "",
    // 관심 서비스는 하나 이상 여러 개(api interests 배열) — 하나도 안 고르면 guest.js 「하나 이상 고르기」가 제출을 막는다.
    `<fieldset data-check-group="관심 서비스를 하나 이상 골라 주세요." class="flex flex-col gap-[10px]"><legend class="${g.LABEL} mb-[10px]">관심 서비스${REQUIRED}</legend><div class="flex h-[56px] items-center gap-[32px] text-[16px] leading-[1.5]">${["매장운영", "재무관리", "프랜차이즈", "기타"]
      .map((t) => `<label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" name="interests" value="${t}" class="${g.CHECKBOX}">${t}</label>`)
      .join("")}</div><span class="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">하나 이상 고릅니다. 여러 개 골라도 됩니다.</span></fieldset>` +
      // 도입 예정 시기는 선택(api planPeriodCode 없어도 됨).
      grid(field("도입 예정 시기", select("timing", ["1개월 안", "3개월 안", "6개월 안", "아직 정하지 않음"]))) +
      field("어떤 점이 궁금하신가요", `<textarea name="message" rows="6" required maxlength="2000" placeholder="지금 쓰고 계신 방식과 불편한 점을 적어 주시면 그에 맞춰 안내해 드립니다. (2,000자까지)" class="${TEXTAREA}"></textarea>`, { required: true }),
  );
  const consent = section(
    "개인정보 수집·이용 동의",
    "",
    `<p class="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy">문의 응대를 위해 이름·업종·전화번호·이메일과 문의 내용을 받습니다. 사업자등록번호나 점포 수는 받지 않습니다.<br><strong class="font-semibold">상담이 끝난 날로부터 1년간 보관</strong>한 뒤 파기합니다. 동의를 거부하시면 접수가 되지 않습니다.</p><div class="flex flex-col gap-[16px] text-[16px] leading-[1.5]"><label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" name="privacy" required class="${g.CHECKBOX}">개인정보 수집·이용에 동의합니다 (필수)</label><label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" name="marketing" class="${g.CHECKBOX}">마케팅 정보 수신에 동의합니다 (선택)</label></div>`,
  );
  // 중복 접수(429) 문구는 운영 정책 CNT-03 · 04 · 08 · 10 · 14 (2026-10-13).
  // 접수가 끝나면 완료와 담당자 연락 일정을 팝업으로 알린다(#298, 2026-10-20 김창수). [확인]은 폼을 비운다.
  const done = `<dialog data-demo-done aria-labelledby="inquiry-done-title" class="m-auto w-[480px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40"><h2 id="inquiry-done-title" class="text-[22px] leading-[1.4] font-bold">문의가 접수되었습니다</h2><p class="mt-[12px] text-[16px] leading-[1.6] text-guest-sub">담당자가 영업일 기준 1~2일 안에 알려주신 전화번호나 이메일로 연락드립니다.</p><div class="mt-[24px] flex justify-end"><button type="button" data-dialog-close class="w-[180px] ${g.SUBMIT}">확인</button></div></dialog>`;
  const submit = `<div class="flex flex-col gap-[16px]">${done}<button type="submit" class="${g.SUBMIT}">문의 접수하기</button><p class="text-[15px] leading-[1.5] text-[#767676]">같은 전화번호나 이메일로 짧은 시간에 여러 번 보내면 잠시 접수가 막히고 「이미 접수된 문의가 있습니다. 담당자가 영업일 기준 1~2일 안에 연락드립니다」를 보입니다. 접수에 실패하면 적은 내용은 그대로 두고 오류를 알려 드리니, 잠시 후 다시 [문의 접수하기]를 눌러 주세요.</p></div>`;

  const main = `<section class="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">도입문의</h1><p class="text-[16px] leading-[1.5]">가입하지 않아도 남기실 수 있습니다. 담당자가 확인한 뒤 알려주신 전화번호나 이메일로 회신합니다.</p></div><form data-demo-submit data-guest-validate class="flex flex-col gap-[40px]">${who}${what}${consent}${submit}</form></section>`;

  return { title: "도입문의", head: g.head(A), html: g.page(A, R, { current: "home/inquiry.html", main }) };
};
