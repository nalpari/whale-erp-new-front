// node --test src/lib/notification-template-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fillSamples,
  isTeam1Mail,
  parseTemplateQuery,
  recipientLabel,
  templateInput,
  updatedLabel,
  validateTemplate,
  withPrefix,
  type TemplateForm,
  type TemplateInput,
} from "./notification-template-view.ts";

// 검사용 견본 — 근로계약 거부 운영 알림 꼴(거부 사유는 받지 않는다, WHALEERP-635). 제목에 필수 변수, 본문에 선택 변수 하나를 둔다.
const base = (over: Partial<TemplateInput> = {}): TemplateInput => ({
  channel: "NOTIFICATION",
  templateName: "근로계약 거부",
  templateCode: "NTF_CONTRACT_REJECTED",
  preferenceCategory: null,
  title: "#{직원이름} 님이 근로계약서 서명을 거부했습니다",
  body: "- 근무지: #{근무지}",
  kakaoTemplateCode: null,
  variables: [
    { name: "직원이름", label: "직원 이름", isRequired: true, sampleValue: "유하람" },
    { name: "근무지", label: "근무지 점포 이름", isRequired: false, sampleValue: "모리커피 연남점" },
  ],
  ...over,
});

test("withPrefix — 채널 접두를 채우고, 이미 붙은 접두는 바꾼다", () => {
  assert.equal(withPrefix("NOTIFICATION", ""), "NTF_");
  assert.equal(withPrefix("PUSH", "CONTRACT_SENT"), "PUSH_CONTRACT_SENT");
  assert.equal(withPrefix("ALIMTALK", "NTF_CONTRACT_SENT"), "TALK_CONTRACT_SENT");
  assert.equal(withPrefix("EMAIL", "PUSH"), "EMAIL_");
  assert.equal(withPrefix("NOTIFICATION", "TALK_"), "NTF_");
  // 접두로 시작하지만 접두가 아닌 단어는 그대로 둔다
  assert.equal(withPrefix("EMAIL", "PUSHY_THING"), "EMAIL_PUSHY_THING");
});

test("recipientLabel — 받는 사람은 채널로 정한다", () => {
  assert.equal(recipientLabel("NOTIFICATION"), "관리자");
  assert.equal(recipientLabel("PUSH"), "직원");
  assert.equal(recipientLabel("ALIMTALK"), "직원(가입 전 포함)");
  assert.equal(recipientLabel("EMAIL"), "-");
});

test("isTeam1Mail — 1팀 메일 8종", () => {
  for (const code of ["EMAIL_SIGNUP_DONE", "EMAIL_PASSWORD_RESET", "EMAIL_WITHDRAW_DONE"]) assert.equal(isTeam1Mail(code), true, code);
  for (const code of ["EMAIL_CHANGE_PIN", "NTF_SIGNUP_DONE"]) assert.equal(isTeam1Mail(code), false, code);
});

test("parseTemplateQuery — 이상한 값은 기본값(운영 알림 · 1쪽 · 20건)으로", () => {
  assert.deepEqual(parseTemplateQuery({}), { channel: "NOTIFICATION", page: 1, pageSize: 20 });
  assert.deepEqual(parseTemplateQuery({ channel: "ALIMTALK", page: "2", pageSize: "100" }), { channel: "ALIMTALK", page: 2, pageSize: 100 });
  assert.equal(parseTemplateQuery({ channel: "SMS" }).channel, "NOTIFICATION");
  assert.equal(parseTemplateQuery({ page: "0" }).page, 1);
  assert.equal(parseTemplateQuery({ pageSize: "30" }).pageSize, 20);
});

test("updatedLabel — 아무도 고치지 않았으면 「기본 문구」, 아니면 한국 시간과 이름", () => {
  assert.equal(updatedLabel(null, "2026-10-12T23:05:00.000Z"), "기본 문구");
  assert.equal(updatedLabel("이서준", "2026-10-12T23:05:00.000Z"), "10-13 08:05 이서준");
});

test("fillSamples — #{변수} 를 예시 값으로, 예시 값이 없으면 그대로", () => {
  const vars = [
    { name: "직원이름", label: "", isRequired: true, sampleValue: "유하람" },
    { name: "근무지", label: "", isRequired: false, sampleValue: "" },
  ];
  assert.equal(fillSamples("#{직원이름} 님 · #{근무지} · #{없음}", vars), "유하람 님 · #{근무지} · #{없음}");
});

test("validateTemplate — 맞는 템플릿은 통과", () => {
  assert.deepEqual(validateTemplate(base()), []);
});

test("validateTemplate — 제목 필수(알림톡 제외), 알림톡은 카카오 템플릿 코드 필수", () => {
  assert.ok(validateTemplate(base({ title: " " })).includes("제목을 넣어 주세요."));
  const talk = validateTemplate(base({ channel: "ALIMTALK", templateCode: "TALK_X", title: null, body: "#{직원이름}" }));
  assert.deepEqual(talk, ["카카오 템플릿 코드를 넣어 주세요."]);
  assert.ok(validateTemplate(base({ templateName: "" })).includes("템플릿 이름을 넣어 주세요."));
  assert.ok(validateTemplate(base({ body: "" })).includes("본문을 넣어 주세요."));
  assert.ok(validateTemplate(base({ templateCode: "ntf_x" })).includes("템플릿 코드는 영문 대문자로 시작하고 대문자 · 숫자 · 밑줄만 씁니다."));
});

test("validateTemplate — 앱 푸시는 수신 설정 묶음 필수, 제목 40자 · 본문 100자", () => {
  const push = (over: Partial<TemplateInput>) => validateTemplate(base({ channel: "PUSH", preferenceCategory: "CONTRACT", ...over }));
  assert.deepEqual(push({}), []);
  assert.ok(push({ preferenceCategory: null }).includes("앱 푸시는 수신 설정 묶음을 골라 주세요."));
  assert.ok(push({ title: `#{직원이름}${"가".repeat(40)}` }).includes("제목은 40자를 넘을 수 없습니다(지금 47자)."));
  assert.ok(push({ body: "가".repeat(101) }).includes("본문은 100자를 넘을 수 없습니다(지금 101자)."));
});

test("validateTemplate — 변수 이름 필수 · 겹침 · # 중괄호 공백, 표시 이름 필수", () => {
  const errors = validateTemplate(
    base({
      variables: [
        { name: "직원이름", label: "직원 이름", isRequired: true, sampleValue: "" },
        { name: "", label: "a", isRequired: false, sampleValue: "" },
        { name: "직원 이름", label: "b", isRequired: false, sampleValue: "" },
        { name: "직원이름", label: "", isRequired: false, sampleValue: "" },
      ],
      body: "본문",
    }),
  );
  assert.deepEqual(errors, [
    "변수 목록 2번째 줄: 변수 이름을 넣어 주세요.",
    "변수 목록 3번째 줄: 변수 이름에 # · 중괄호 · 공백을 쓸 수 없습니다.",
    "변수 목록 4번째 줄: 변수 이름 직원이름 이 겹칩니다.",
    "변수 목록 4번째 줄: 표시 이름을 넣어 주세요.",
  ]);
});

test("validateTemplate — 목록에 없는 변수 · 닫히지 않은 #{ 는 몇째 줄인지 알린다", () => {
  const errors = validateTemplate(base({ body: "첫 줄\n#{종료일} 입니다\n#{직원이름" }));
  assert.deepEqual(errors, ["본문 2번째 줄: #{종료일} 는 변수 목록에 없습니다.", "본문 3번째 줄: 닫히지 않은 #{ 가 있습니다."]);
});

test("validateTemplate — 필수 변수는 제목 · 본문에 있어야 하고, 버튼 링크는 빠진다", () => {
  assert.deepEqual(validateTemplate(base({ title: "제목" })), ["필수 변수 #{직원이름} 가 제목 · 본문에 없습니다."]);
  const mail = base({
    channel: "EMAIL",
    templateCode: "EMAIL_X",
    variables: [...base().variables, { name: "계약링크", label: "계약 링크", isRequired: true, sampleValue: "", isButtonLink: true }],
  });
  assert.deepEqual(validateTemplate(mail), []);
  assert.ok(
    validateTemplate({ ...mail, channel: "NOTIFICATION", templateCode: "NTF_X" }).includes("변수 목록 3번째 줄: 버튼 링크는 메일 · 알림톡 변수에만 씁니다."),
  );
});

test("templateInput — 채널에 없는 칸은 비워서 보낸다", () => {
  const form: TemplateForm = {
    channel: "ALIMTALK",
    templateName: "가입 초대",
    templateCode: " TALK_STAFF_INVITATION ",
    preferenceCategory: "CONTRACT",
    title: "남은 제목",
    body: "본문",
    kakaoTemplateCode: " WHALE_INVITE_01 ",
    variables: [{ name: " 근무지 ", label: "근무지", isRequired: true, sampleValue: "", isButtonLink: true }],
  };
  assert.deepEqual(templateInput(form), {
    channel: "ALIMTALK",
    templateName: "가입 초대",
    templateCode: "TALK_STAFF_INVITATION",
    preferenceCategory: null,
    title: null,
    body: "본문",
    kakaoTemplateCode: "WHALE_INVITE_01",
    variables: [{ name: "근무지", label: "근무지", isRequired: true, sampleValue: "", isButtonLink: true }],
  });
  const push = templateInput({ ...form, channel: "PUSH" });
  assert.equal(push.title, "남은 제목");
  assert.equal(push.kakaoTemplateCode, null);
  assert.equal(push.preferenceCategory, "CONTRACT");
  assert.equal(push.variables[0].isButtonLink, false);
});
