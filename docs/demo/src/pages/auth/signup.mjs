// 사업자 회원가입. 앱 디자인 샘플 src/app/design/guest/sign-up(기획 시안 + Figma 폼 규격)을 옮겼다.
// 동작(중복 확인·사업자 인증·약관 동의·제출)은 assets/guest.js 의 「회원가입」 블록이 맡는다.
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

const REQUIRED = `<span aria-hidden="true" class="text-[#e93737]"> *</span><span class="sr-only">(필수)</span>`;

const field = (label, body, required = false) =>
  `<label class="flex flex-col gap-[10px]"><span class="${g.LABEL}">${label}${required ? REQUIRED : ""}</span>${body}</label>`;
const box = (input) => `<span class="${g.INPUT_BOX}">${input}</span>`;

const passwordField = (A, label, name, placeholder) =>
  field(
    label,
    `<span class="${g.INPUT_BOX}"><input name="${name}" type="password" required minlength="8" maxlength="20" autocomplete="new-password" placeholder="${placeholder}" class="${g.INPUT}">${g.eyeButton(A, label)}</span>`,
    true,
  );

// 아이디·이메일 중복 확인 칸. 판정 결과 두 줄을 미리 그려 두고 guest.js 가 하나만 보인다.
const TAKEN_MESSAGE = { loginId: "이미 사용 중인 아이디입니다.", email: "이미 가입된 이메일입니다." };
const checkedInput = (A, kind, attrs) =>
  `${box(`<input ${attrs} name="${kind}" data-check="${kind}" aria-describedby="${kind}-status" class="${g.INPUT}">`)}<span id="${kind}-status" aria-live="polite" hidden class="-mt-[2px] flex items-center gap-[4px] text-[14px] leading-[1.5] empty:hidden"><span data-check-ok hidden class="flex items-center gap-[4px] text-[#5e8ce9]"><svg aria-hidden="true" class="size-[12px]" viewBox="0 0 12 9" fill="currentColor"><path d="M4.33 8.316a.64.64 0 0 1-.462-.188L.99 5.251a.64.64 0 0 1 .925-.926l2.43 2.415L10.114.985a.64.64 0 0 1 .926.926L4.808 8.128a.7.7 0 0 1-.477.188Z"/></svg>사용가능합니다.</span><span data-check-taken hidden class="text-[#e93737]">${TAKEN_MESSAGE[kind]}</span></span>`;

// 묶음 사이는 테두리 없이 바깥 form 의 gap-[40px] 만으로 나눈다(2026-10-16 — 사업자정보·약관동의 앞에
// 있던 border-t 는 중복이라 뺐다). badge 는 제목 줄 오른쪽에 하나만 두는 상태 표시(예: 사업자정보의 "인증완료").
const section = (title, note, body, badge = "") =>
  `<section class="flex flex-col gap-[24px]"><h2 class="text-[20px] leading-[1.4] font-semibold text-[#111]">${title}${note ? `<span class="ml-[10px] text-[15px] font-normal text-[#767676]">${note}</span>` : ""}${badge}</h2>${body}</section>`;

// ── 약관 본문(앱 sign-up/terms.tsx v0.7 초안). [ ] 는 확정 전 자리값이다. ──
const articles = (list) =>
  list
    .map(
      ([title, items]) =>
        `<section class="flex flex-col gap-[6px]"><h3 class="font-semibold">${title}</h3>${items.length === 1 ? `<p>${items[0]}</p>` : `<ol class="list-decimal pl-[20px]">${items.map((i) => `<li>${i}</li>`).join("")}</ol>`}</section>`,
    )
    .join("");

const SERVICE_TERMS = [
  ["제1조 (목적)", ["이 약관은 주식회사 인터플러그(이하 “회사”)가 제공하는 웨일ERP 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 사이의 권리, 의무 및 책임사항과 그 밖에 필요한 사항을 정합니다."]],
  [
    "제2조 (정의)",
    [
      "“서비스”란 회사가 클라우드 방식으로 제공하는 점포·직원·근태·급여 관리 등 웨일ERP 의 모든 기능을 말합니다.",
      "“회원”이란 이 약관에 동의하고 회사와 이용계약을 체결한 사업자를 말합니다.",
      "“BP”란 서비스에서 회원을 식별하는 사업자 단위를 말하며, 하나의 BP 는 여러 점포를 둘 수 있습니다.",
      "“BP 마스터”란 BP 를 대표하여 이용계약을 체결하고 BP 안의 권한을 관리하는 계정을 말합니다.",
      "“이용자”란 회원이 서비스에 등록하여 이용하게 한 관리자와 직원을 말합니다.",
      "“계정”이란 이용자를 식별하기 위한 아이디와 비밀번호의 조합을 말합니다.",
      "“회원 데이터”란 회원과 이용자가 서비스에 입력하거나 서비스 이용 중 생성한 모든 정보를 말합니다.",
    ],
  ],
  [
    "제3조 (약관의 게시와 개정)",
    [
      "회사는 이 약관을 서비스 초기 화면과 홈페이지에 게시합니다.",
      "회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 적용일 7일 전부터 공지합니다. 회원에게 불리한 개정은 적용일 30일 전부터 공지하고 등록된 이메일로 따로 알립니다.",
      "회원이 적용일까지 거부 의사를 밝히지 않으면 개정 약관에 동의한 것으로 봅니다. 동의하지 않는 회원은 이용계약을 해지할 수 있습니다.",
    ],
  ],
  [
    "제4조 (이용계약의 성립)",
    [
      "이용계약은 가입 신청자가 이 약관과 개인정보 수집·이용에 동의하고 가입을 신청한 뒤 회사가 승낙하면 성립합니다.",
      "회사나 회원이 대신 등록한 계정은 이용자가 최초 로그인 때 이 약관에 동의하면 그 이용자에게 효력이 생깁니다.",
      "회사는 타인의 명의나 허위 정보로 신청한 경우, 이전에 이 약관 위반으로 계약이 해지된 경우, 그 밖에 관련 법령을 위반한 경우 승낙하지 않거나 사후에 이용계약을 해지할 수 있습니다.",
    ],
  ],
  ["제5조 (회원 정보의 변경)", ["회원은 등록한 정보가 바뀌면 지체 없이 서비스에서 수정해야 합니다. 수정하지 않아 생긴 불이익은 회원이 부담합니다."]],
  [
    "제6조 (회사의 의무)",
    [
      "회사는 관련 법령과 이 약관이 금지하는 행위를 하지 않으며, 서비스를 안정적으로 제공하기 위해 노력합니다.",
      "회사는 회원 데이터를 보호하기 위해 보안 체계를 갖추고, 개인정보처리방침을 공개하고 지킵니다.",
      "회사는 회원의 정당한 의견이나 불만을 신속히 처리하고 처리 결과를 알립니다.",
    ],
  ],
  [
    "제7조 (회원과 이용자의 의무)",
    [
      "회원과 이용자는 계정을 제3자에게 알리거나 빌려주어서는 안 되며, 계정 관리 소홀로 생긴 책임을 집니다.",
      "회원은 서비스에 직원 등 제3자의 개인정보를 입력할 때 관련 법령에 따른 동의나 법적 근거를 스스로 갖추어야 합니다.",
      "회원과 이용자는 허위 정보 등록, 서비스의 역설계·무단 복제, 서비스 운영 방해, 타인의 권리 침해, 그 밖에 법령에 어긋나는 행위를 해서는 안 됩니다.",
    ],
  ],
  ["제8조 (서비스의 제공과 변경)", ["회사는 연중무휴 1일 24시간 서비스를 제공하는 것을 원칙으로 합니다.", "회사는 서비스의 내용을 바꿀 수 있으며, 회원에게 중대한 영향을 주는 변경은 7일 전에 공지합니다."]],
  [
    "제9조 (서비스의 중단)",
    ["회사는 설비 점검·교체·장애, 통신 두절, 천재지변 등 부득이한 사유가 있으면 서비스를 일시 중단할 수 있습니다.", "계획된 중단은 미리 공지하고, 미리 알릴 수 없는 경우에는 사후에 알립니다."],
  ],
  [
    "제10조 (이용 요금)",
    [
      "서비스의 요금과 결제 방법은 홈페이지의 요금 안내에 따릅니다. [요금 체계·결제 방식은 아직 확정 전이며, 부가서비스 구독·정산 기능도 1차 범위에 포함되지 않습니다.]",
      "회사가 무료로 제공하던 서비스를 유료로 바꾸는 경우 적용일 30일 전에 공지하고 개별 통지합니다. 회원은 유료 전환에 동의하지 않으면 이용계약을 해지할 수 있습니다.",
    ],
  ],
  [
    "제11조 (이용 제한)",
    [
      "회사는 회원이나 이용자가 제7조를 위반하면 경고, 일시 정지, 이용계약 해지의 순서로 이용을 제한할 수 있습니다.",
      "명백한 불법 행위나 보안 위협이 있는 경우에는 즉시 제한할 수 있습니다.",
      "회사는 제한 사유와 기간을 알리고, 회원은 이의를 제기할 수 있습니다.",
    ],
  ],
  ["제12조 (계약 해지)", ["BP 마스터는 언제든지 MY PAGE 의 회원 탈퇴로 이용계약을 해지할 수 있습니다.", "회사는 제4조 제3항이나 제11조에 해당하면 이용계약을 해지할 수 있습니다."]],
  [
    "제13조 (회원 데이터의 소유와 처리)",
    [
      "회원 데이터의 권리는 회원에게 있습니다.",
      "회원 데이터 가운데 개인정보에 대해서는 회원이 개인정보처리자이고, 회사는 회원의 위탁을 받아 서비스 제공에 필요한 범위에서만 처리하는 수탁자입니다. 세부 사항은 개인정보 처리위탁 계약에 따릅니다.",
      "회사는 개인을 알아볼 수 없도록 가공한 통계 정보를 서비스 개선에 쓸 수 있습니다.",
      "이용계약이 끝나면 회원은 [30]일 동안 회원 데이터를 내려받을 수 있으며, 회사는 그 기간이 지나면 회원 데이터를 파기합니다. 다만 법령이 보존을 요구하는 정보는 정해진 기간 동안 분리 보관합니다.",
    ],
  ],
  [
    "제14조 (개인정보 처리위탁)",
    [
      "회원이 서비스에 등록한 이용자(직원 등)의 개인정보에 대하여, 회사는 회원의 위탁을 받아 근태·근무스케줄·급여명세서 등 인사 정보의 저장·관리를 포함한 서비스 제공에 필요한 범위의 업무를 처리합니다.",
      "회사는 위탁받은 업무의 범위를 넘어 개인정보를 이용하거나 제3자에게 제공하지 않습니다.",
      "회사는 위탁받은 업무를 제3자에게 재위탁하지 않습니다. 다만 클라우드 인프라 등 서비스 운영에 반드시 필요한 처리를 위해 재위탁하는 경우에는 개인정보처리방침에 그 사실을 알립니다.",
      "회사는 위탁받은 개인정보를 안전하게 처리하기 위해 접근 권한 제한, 암호화, 접속 기록 보관 등 안전성 확보조치를 취합니다.",
      "회사가 위탁받은 업무를 처리하는 과정에서 고의 또는 과실로 개인정보를 분실·도난·유출·위조·변조 또는 훼손한 경우 회원과 이용자에게 생긴 손해를 배상하며, 배상 범위는 제17조를 따릅니다.",
      "회원과 회사가 개인정보 처리위탁에 관해 별도로 계약을 체결한 경우에는 그 계약을 우선합니다.",
    ],
  ],
  ["제15조 (개인정보 보호)", ["회사는 관련 법령과 개인정보처리방침에 따라 이용자의 개인정보를 보호합니다."]],
  ["제16조 (지식재산권)", ["서비스와 관련된 소프트웨어, 디자인, 상표 등 지식재산권은 회사에 있습니다. 회원은 이 약관이 허용한 범위에서만 서비스를 이용할 수 있습니다."]],
  [
    "제17조 (손해배상)",
    [
      "회사나 회원이 이 약관을 위반하여 상대방에게 손해를 입히면 그 손해를 배상합니다.",
      "회사의 고의나 중대한 과실로 인한 손해가 아니면, 회사의 배상액은 손해가 발생하기 전 [12]개월 동안 회원이 낸 이용 요금 합계를 넘지 않습니다.",
    ],
  ],
  [
    "제18조 (면책)",
    [
      "회사는 다음 사유로 생긴 손해에 대해서는 책임지지 않습니다. 다만 회사에 고의나 중대한 과실이 있으면 그렇지 않습니다.",
      "천재지변이나 이에 준하는 불가항력",
      "회원이나 이용자의 귀책사유로 인한 이용 장애",
      "회원이 입력한 정보의 오류",
      "제3자가 제공하는 서비스(국세청 사업자등록정보 진위확인 등)의 장애",
      "회원 사이, 회원과 이용자 사이의 분쟁",
    ],
  ],
  [
    "제19조 (통지)",
    [
      "회사는 회원이 등록한 이메일과 서비스 안 알림으로 회원에게 통지합니다. 회원에게 가는 통지는 1차 범위에서 문자메시지를 쓰지 않습니다.",
      "전체 회원에 대한 통지는 서비스 공지사항에 7일 이상 게시하는 것으로 갈음할 수 있습니다.",
    ],
  ],
  ["제20조 (양도 금지)", ["회원은 이용계약상의 지위나 권리·의무를 회사의 동의 없이 제3자에게 양도하거나 담보로 제공할 수 없습니다."]],
  ["제21조 (분리 가능성)", ["이 약관의 일부가 무효가 되어도 나머지 조항은 효력을 유지합니다."]],
  ["제22조 (준거법과 관할)", ["이 약관은 대한민국 법률에 따르며, 분쟁에 관한 소송은 민사소송법에 따른 관할 법원에 제기합니다."]],
  ["제23조 (문의)", ["서비스 문의: [고객센터 이메일] · [전화번호]"]],
  ["부칙", ["이 약관은 [2026년 0월 0일]부터 시행합니다."]],
];

const COLLECTION_ROWS = [
  ["회원 식별, 가입 의사 확인, 로그인", "아이디, 비밀번호, 이름, 휴대전화번호, 이메일", "회원 탈퇴 시까지"],
  ["BP 생성과 관리", "상호명", "회원 탈퇴 시까지"],
  ["계정 찾기, 임시 비밀번호 발송, 서비스 안내", "이메일", "회원 탈퇴 시까지"],
  ["부정 이용 방지, 보안 감사", "접속 일시, 접속 IP, 로그인 기록 (서비스 이용 중 자동 생성)", "[1년]"],
];
const CELL = "border border-[#ebebeb] px-[12px] py-[8px] text-left align-top";

const PRIVACY_TERMS = [
  ["사업자정보 인증 시", ["사업자정보 인증을 하는 경우 사업자등록번호, 대표자명, 개업일자를 국세청 진위확인에 쓰고 회원 탈퇴 시까지 보관합니다."]],
  [
    "선택 입력 항목",
    [
      "대표자 연락처, 대표자 이메일, 사업장 주소, 업태, 종목은 사업장 정보 관리와 정산·신고 서류 작성을 위해 회원이 직접 입력한 경우에만 수집하며, 회원 탈퇴 시까지 보관합니다. 입력하지 않아도 회원가입과 기본 서비스 이용에 제한이 없고, MY PAGE 에서 언제든지 지울 수 있습니다.",
    ],
  ],
  ["법령에 따른 보존", ["전자상거래법에 따른 계약·결제 기록: 5년", "전자상거래법에 따른 소비자 불만·분쟁 처리 기록: 3년", "통신비밀보호법에 따른 접속 기록: 3개월"]],
  ["동의를 거부할 권리", ["귀하는 동의를 거부할 권리가 있습니다. 다만 필수 항목에 동의하지 않으면 회원가입과 서비스 이용이 불가합니다."]],
];

const privacyTerms = () =>
  `<p>주식회사 인터플러그는 웨일ERP 회원가입과 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.</p><section class="flex flex-col gap-[6px]"><h3 class="font-semibold">수집·이용 내역</h3><table class="w-full border-collapse text-[14px]"><thead class="bg-guest-card text-guest-navy"><tr>${["수집 목적", "수집 항목", "보유·이용 기간"].map((t) => `<th class="${CELL} font-medium">${t}</th>`).join("")}</tr></thead><tbody>${COLLECTION_ROWS.map((row) => `<tr>${row.map((c) => `<td class="${CELL}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></section>${articles(PRIVACY_TERMS)}`;

// 약관 내용 보기. 네이티브 dialog 라 Esc 닫기와 바깥 포커스 막기는 브라우저가 맡는다.
const termsDialog = (key, title, body) =>
  `<dialog data-terms="${key}" aria-label="${title}" class="m-auto w-[860px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40"><h2 class="text-[22px] leading-[1.4] font-bold">${title}</h2><p class="mt-[4px] text-[14px] text-[#767676]">v0.7 · 시행일 미정 (초안)</p><div class="mt-[20px] flex max-h-[60dvh] flex-col gap-[16px] overflow-y-auto pr-[10px] text-[15px] leading-[1.6]">${body}</div><div class="mt-[24px] flex justify-end"><button type="button" data-dialog-close class="w-[180px] ${g.SUBMIT}">확인</button></div></dialog>`;

const AGREEMENTS = [
  ["service", "이용약관 동의", "웨일ERP 서비스 이용약관", () => articles(SERVICE_TERMS)],
  ["privacy", "개인정보 수집·이용 동의", "[필수] 개인정보 수집·이용 동의", privacyTerms],
];

export default ({ A, R }) => {
  const PHONE = [
    ["앞자리", "[0-9]{2,3}", 3, "010"],
    ["가운데자리", "[0-9]{3,4}", 4, "0000"],
    ["끝자리", "[0-9]{3,4}", 4, "0000"],
  ];
  const basic = section(
    "기본정보",
    `(<span class="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)`,
    `<div class="grid grid-cols-2 gap-x-[16px] gap-y-[24px]">
${field("아이디", checkedInput(A, "loginId", `required pattern="(?=.*[A-Za-z])[A-Za-z0-9]{4,20}" title="영문 또는 영문·숫자 조합 4~20자" autocomplete="username" placeholder="영문 또는 영문·숫자 조합 4~20자"`), true)}
${field("이름", box(`<input name="name" required minlength="2" maxlength="20" autocomplete="name" placeholder="한글 또는 영문 2~20자" class="${g.INPUT}">`), true)}
${passwordField(A, "비밀번호", "password", "영문·숫자·특수문자 조합 8~20자")}
${passwordField(A, "비밀번호 확인", "passwordConfirm", "비밀번호를 한 번 더 입력해 주세요")}
${field("이메일", checkedInput(A, "email", `type="email" required autocomplete="email" placeholder="example@company.com"`), true)}
<div class="flex flex-col gap-[10px]"><span id="phone-label" class="${g.LABEL}">연락처${REQUIRED}</span><div role="group" aria-labelledby="phone-label" class="grid grid-cols-3 gap-[8px]">${PHONE.map(([part, pattern, max, ph]) => box(`<input name="phone" aria-label="${part}" required inputmode="numeric" pattern="${pattern}" maxlength="${max}" placeholder="${ph}" class="${g.INPUT}">`)).join("")}</div></div>
${field("상호명", box(`<input name="companyName" required maxlength="50" autocomplete="organization" placeholder="50자 이내" class="${g.INPUT}">`), true)}
</div>`,
  );

  // 사업자정보는 선택이라 인증하기를 누를 때만 세 칸을 확인한다. 인증되면 칸을 잠근다. "인증완료" 뱃지는
  // 제목 줄에 하나만 둔다 — 안쪽에도 두면 한 화면에 두 번 보인다(2026-10-16). 빈 날짜 칸의 "연도. 월. 일."은
  // 브라우저가 그리는 글자라 placeholder 색(#999)을 webkit 의사 요소로 맞춘다.
  const biz = section(
    "사업자정보 인증",
    "(선택)",
    `<div data-biz class="flex flex-col gap-[24px]">
<div class="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-[16px]">
${field("사업자등록번호", box(`<input name="bizRegistrationNumber" inputmode="numeric" pattern="[0-9]{3}-?[0-9]{2}-?[0-9]{5}" placeholder="000-00-00000" class="${g.INPUT}">`))}
${field("대표자명", box(`<input name="bizCeoName" placeholder="대표자 이름" class="${g.INPUT}">`))}
${field("개업일자", box(`<input name="bizOpenDate" type="date" class="${g.INPUT} [&:placeholder-shown::-webkit-datetime-edit-fields-wrapper]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-text]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-year-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-month-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-day-field]:text-[#999]">`))}
<div class="flex gap-[8px]"><button type="button" data-biz-reverify hidden class="${g.FIELD_BUTTON}">재인증</button><button type="button" data-biz-clear hidden class="${g.FIELD_BUTTON}">사용안함</button><button type="button" data-biz-verify class="${g.FIELD_BUTTON}">인증하기</button></div>
</div></div>`,
    `<span data-biz-badge hidden class="ml-[10px] rounded-[4px] bg-guest-card px-[8px] py-[2px] align-middle text-[14px] font-normal text-guest-navy">인증완료</span>`,
  );

  const agree = section(
    "약관동의",
    "",
    `<div class="flex flex-col gap-[18px] text-[16px] leading-[1.5] font-medium text-[#5e697b]"><label class="flex items-center gap-[8px] text-guest-ink"><input type="checkbox" data-agree-all class="${g.CHECKBOX}">모두 동의합니다.</label><hr class="border-[#ebebeb]">${AGREEMENTS.map(
      ([key, label, title, body]) =>
        `<div class="flex items-center justify-between"><label class="flex items-center gap-[8px]"><input type="checkbox" data-agree class="${g.CHECKBOX}">${label} (필수)</label><button type="button" data-terms-open="${key}" class="text-[15px] text-guest-slate underline underline-offset-[3px] hover:text-guest-navy ${g.HOVER}">내용보기</button>${termsDialog(key, title, body())}</div>`,
    ).join("")}</div>`,
  );

  const main = `<section class="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">회원가입</h1><p class="text-[16px] leading-[1.5]">사업자 계정을 만들고 매장 관리를 시작하세요.</p></div>
<form data-signup-form data-done="${link(R, "auth/signup-done.html")}" class="flex flex-col gap-[40px]">
${basic}
${biz}
${agree}
<div class="flex flex-col gap-[16px]"><p data-signup-error role="alert" hidden class="text-[15px] text-[#e93737]"></p><button type="submit" class="${g.SUBMIT}">회원가입</button><p class="flex justify-center gap-[10px] text-[16px] leading-[1.5] text-[#767676]">이미 계정이 있나요?<a href="${link(R, "auth/login.html")}" class="font-semibold text-guest-ink hover:text-guest-navy ${g.HOVER}">로그인</a></p></div>
</form></section>`;

  return { title: "회원가입", head: g.head(A), html: g.page(A, R, { current: "auth/signup.html", main }) };
};
