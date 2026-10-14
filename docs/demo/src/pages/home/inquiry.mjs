// 도입문의(비로그인). 목업 docs/mockup/home/inquiry.html 의 항목을 비로그인 디자인(Figma 로그인전 폼 규격, 회원가입과 같은 틀)으로 그렸다.
// 데모라 접수 요청은 보내지 않는다. 필수 칸이 차면 접수 안내만 보인다(guest.js 「데모 접수」).
import * as g from "../../guest.mjs";

const REQUIRED = `<span aria-hidden="true" class="text-[#e93737]"> *</span><span class="sr-only">(필수)</span>`;
const field = (label, body, { required = false, help = "" } = {}) =>
  `<label class="flex flex-col gap-[10px]"><span class="${g.LABEL}">${label}${required ? REQUIRED : ""}</span>${body}${help ? `<span class="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">${help}</span>` : ""}</label>`;
const input = (attrs) => `<span class="${g.INPUT_BOX}"><input ${attrs} class="${g.INPUT}"></span>`;
// 고르는 칸. 입력칸과 같은 껍데기에 오른쪽 화살표를 둔다.
const CHEVRON = `<svg aria-hidden="true" class="pointer-events-none size-[16px] shrink-0 text-[#767676]" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>`;
const select = (name, options) =>
  `<span class="${g.INPUT_BOX}"><select name="${name}" required class="${g.INPUT} appearance-none has-[option[value='']:checked]:text-[#999]"><option value="" hidden selected>선택해 주세요</option>${options.map((o) => `<option class="text-guest-ink">${o}</option>`).join("")}</select>${CHEVRON}</span>`;
const TEXTAREA = `min-h-[180px] w-full resize-y rounded-[6px] border border-[#ebebeb] bg-white p-[16px] text-[15px] leading-[1.6] text-guest-ink outline-none! placeholder:text-[#999] focus:border-guest-navy ${g.HOVER}`;
const section = (title, note, body) =>
  `<section class="flex flex-col gap-[24px] border-t border-[#ebebeb] pt-[32px]"><h2 class="text-[20px] leading-[1.4] font-semibold text-[#111]">${title}${note ? `<span class="ml-[10px] text-[15px] font-normal text-[#767676]">${note}</span>` : ""}</h2>${body}</section>`;
const grid = (...c) => `<div class="grid grid-cols-2 gap-[16px]">${c.join("")}</div>`;

export default ({ A, R }) => {
  const who = section(
    "문의자 정보",
    `(<span class="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)`,
    grid(
      field("이름", input('name="name" required autocomplete="name" placeholder="홍길동"'), { required: true }),
      field("전화번호", input('name="phone" type="tel" required inputmode="numeric" autocomplete="tel" placeholder="숫자만 입력해 주세요"'), { required: true }),
      // 업종에서 「직접입력」을 고르면 옆 칸이 열린다(목업은 기타 → 직접 적는 칸). 잠겨 있는 동안은 검사·전송에서 빠진다.
      field("업종", select("industry", ["카페·음료", "음식점", "베이커리·디저트", "주점", "직접입력"]).replace("<select ", "<select data-other-select "), { required: true }),
      field("업종 직접 입력", input('name="industryOther" data-other-input required disabled maxlength="50" placeholder="업종을 직접 입력해 주세요"')),
      field("이메일", input('name="email" type="email" required autocomplete="email" placeholder="example@company.com"'), { required: true, help: "접수 확인 메일을 이 주소로 보냅니다." }),
    ),
  );
  const what = section(
    "도입 문의 내용",
    "",
    grid(
      field("관심 서비스", select("service", ["매장운영", "재무관리", "프랜차이즈", "부가서비스", "기타"]), { required: true }),
      field("도입 예정 시기", select("timing", ["1개월 안", "3개월 안", "6개월 안", "아직 정하지 않음"])),
    ) + field("어떤 점이 궁금하신가요", `<textarea name="message" rows="6" placeholder="지금 쓰고 계신 방식과 불편한 점을 적어 주시면 그에 맞춰 안내해 드립니다." class="${TEXTAREA}"></textarea>`),
  );
  const consent = section(
    "개인정보 수집·이용 동의",
    "",
    `<p class="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy">문의 응대를 위해 이름·업종·전화번호·이메일과 문의 내용을 받습니다. 사업자등록번호나 점포 수는 받지 않습니다.<br><strong class="font-semibold">상담이 끝난 날로부터 1년간 보관</strong>한 뒤 파기합니다. 동의를 거부하시면 접수가 되지 않습니다.</p><div class="flex flex-col gap-[16px] text-[16px] leading-[1.5]"><label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" name="privacy" required class="${g.CHECKBOX}">개인정보 수집·이용에 동의합니다 (필수)</label><label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" name="marketing" class="${g.CHECKBOX}">마케팅 정보 수신에 동의합니다 (선택)</label></div>`,
  );
  // 중복 접수(429) 문구는 운영 정책 CNT-03 · 04 · 08 · 10 · 14 (2026-10-13).
  const submit = `<div class="flex flex-col gap-[16px]"><p data-demo-done role="status" hidden class="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy"><strong class="font-semibold">문의가 접수되었습니다.</strong><br>담당자가 영업일 기준 1~2일 안에 알려주신 전화번호나 이메일로 연락드립니다.</p><button type="submit" class="${g.SUBMIT}">문의 접수하기</button><p class="text-[15px] leading-[1.5] text-[#767676]">같은 전화번호나 이메일로 짧은 시간에 여러 번 보내면 잠시 접수가 막히고 「이미 접수된 문의가 있습니다. 담당자가 영업일 기준 1~2일 안에 연락드립니다」를 보입니다.</p></div>`;

  const main = `<section class="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">도입문의</h1><p class="text-[16px] leading-[1.5]">가입하지 않아도 남기실 수 있습니다. 담당자가 확인한 뒤 알려주신 전화번호나 이메일로 회신합니다.</p></div><form data-demo-submit class="flex flex-col gap-[40px]">${who}${what}${consent}${submit}</form></section>`;

  return { title: "도입문의", head: g.head(A), html: g.page(A, R, { current: "home/inquiry.html", main }) };
};
