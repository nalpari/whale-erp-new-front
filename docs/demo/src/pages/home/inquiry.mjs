// 도입문의(비로그인). 목업 docs/mockup/home/inquiry.html.
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const who = ui.formGroup(
    "문의자 정보",
    p.row(ui.field("이름", ui.textField({ placeholder: "홍길동" })), ui.field("업종", ui.select(["카페·음료", "음식점", "베이커리·디저트", "주점", "기타"], { "aria-label": "업종" }))),
    p.row(ui.field("전화번호", ui.textField({ placeholder: "02-000-0000" })), ui.field("이메일", ui.textField({ type: "email", placeholder: "name@company.com" }) + p.help("접수 확인 메일을 이 주소로 보냅니다."))),
  );
  const what = ui.formGroup(
    "도입 문의 내용",
    p.row(
      ui.field("관심 서비스", ui.select(["매장운영", "재무관리", "프랜차이즈", "기타"], { "aria-label": "관심 서비스" })),
      ui.field("도입 예정 시기", ui.select(["1개월 안", "3개월 안", "6개월 안", "아직 정하지 않음"], { "aria-label": "도입 예정 시기" })),
    ),
    ui.field("어떤 점이 궁금하신가요", ui.textarea({ rows: 6, placeholder: "지금 쓰고 계신 방식과 불편한 점을 적어 주시면 그에 맞춰 안내해 드립니다." })),
  );
  const consent = ui.formGroup(
    "개인정보 수집·이용 동의",
    p.note(
      "문의 응대를 위해 이름·업종·전화번호·이메일과 문의 내용을 받습니다. 사업자등록번호나 점포 수는 받지 않습니다. <b class=\"font-semibold text-erp-ink\">상담이 끝난 날로부터 1년간 보관</b>한 뒤 파기합니다. 동의를 거부하시면 접수가 되지 않습니다.",
    ),
    ui.checkbox(A, "개인정보 수집·이용에 동의합니다"),
    ui.checkbox(A, "마케팅 정보 수신에 동의합니다 (선택)"),
  );
  const main = `<div class="mx-auto flex w-[860px] flex-col gap-[24px] px-[24px] py-[48px]"><div class="flex flex-col gap-[6px]"><h1 class="text-[22px] font-semibold">도입문의</h1><p class="text-[14px] text-erp-label">가입하지 않아도 남기실 수 있습니다. 담당자가 확인한 뒤 알려주신 전화번호나 이메일로 회신합니다.</p></div>${who}${what}${consent}<div class="flex items-center gap-[18px]"><div class="flex-1">${p.note(
    "같은 전화번호나 이메일로 짧은 시간에 여러 번 보내면 잠시 접수가 막힙니다.",
  )}</div>${ui.button("문의 접수하기")}</div></div>`;
  const foot = p.siteFoot(`<span class="flex-1">${p.BIZ}</span>`, p.quietLink("홈으로", link(R, "home/index.html")), p.quietLink("공지사항", link(R, "home/notices.html")));
  return { title: "도입문의", html: p.sitePage(A, R, { current: "inquiry", main, foot }) };
};
