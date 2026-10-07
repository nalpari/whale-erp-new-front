// 알림 템플릿 관리. 목업 docs/mockup/notify/templates.html. 플랫폼 운영자 전용이라 플랫폼 헤더로 그린다.
// 채널 탭 넷. 줄 이름을 누르면 그 채널의 수정 화면으로 간다(채널마다 한 장, src/template-edit.mjs).
// 템플릿은 채널 + 템플릿 이름 + 템플릿 코드로 구분한다(NOTIFY-11). TO-DO 배정은 푸시 없이 알림함에만 쌓인다(앱 NOTI-1). 알림톡도 본문을 화면에서 고치고(NOTIFY-8) 승인 상태는 두지 않는다(NOTIFY-6).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { platformHeader, link } from "../../site.mjs";

const OPS = [
  ["문의사항 접수", "플랫폼 마스터·관리자", "새 문의사항이 접수되었습니다"],
  ["도입문의 접수", "플랫폼 마스터·관리자", "새 도입문의가 접수되었습니다"],
  ["문의사항 답변", "문의를 등록한 관리자", "문의에 답변이 등록되었습니다"],
  ["도입문의 처리 상태 변경", "플랫폼 마스터·관리자", "도입문의가 #{상태}(으)로 바뀌었습니다"],
  ["근로계약 날인", "소속 범위 사업자 관리자", "#{직원이름} 님이 근로계약서에 날인했습니다"],
  ["근로계약 거부", "소속 범위 사업자 관리자", "#{직원이름} 님이 근로계약서를 거부했습니다", ["10-06 16:20", "이서준"]],
  ["근로계약 만료", "소속 범위 사업자 관리자", "#{직원이름} 님의 계약이 만료되었습니다"],
  ["가입 연결 보류", "근로계약서 초안을 쓴 관리자", "#{직원이름} 님의 가입 연결이 보류되었습니다"],
  ["소속 추가 확인 거절", "근로계약서 초안을 쓴 관리자", "#{직원이름} 님이 소속 추가를 거절했습니다"],
  ["계약 갱신 예정", "소속 범위 사업자 관리자", "#{직원이름} 님의 계약이 30일 뒤 끝납니다", null, false],
];
const PURPOSES = [
  ["비밀번호 찾기 핀", "본인", "[WHALE ERP] 비밀번호 재설정 인증번호"],
  ["관리자 초기화 재설정 링크", "직원", "[WHALE ERP] 비밀번호를 다시 정해 주세요"],
  ["로그인 이메일 변경 핀", "본인", "[WHALE ERP] 로그인 이메일 변경 인증번호"],
  ["도입문의 접수 확인", "도입문의를 남긴 사람", "[WHALE ERP] 도입문의를 받았습니다"],
];
// 1팀 화면에서 나가는 관리자 메일 8종. 1팀이 공통코드 MAIL_TYPE 을 빼고 메일 템플릿(이 화면)에서 관리한다(NOTIFY-9, 2026-10-07 재영).
const TEAM1_MAILS = [
  ["회원가입 완료", "가입한 BP 마스터", "[WHALE ERP] 회원가입이 완료되었습니다"],
  ["신규 BP 가입 알림", "플랫폼 운영자", "[WHALE ERP] 새 BP 가 가입했습니다"],
  ["BP 신규 등록", "등록된 BP 마스터", "[WHALE ERP] BP 가 등록되었습니다"],
  ["플랫폼 관리자 계정 생성", "새 플랫폼 관리자", "[WHALE ERP] 플랫폼 관리자 계정이 만들어졌습니다"],
  ["BP 관리자 계정 생성", "새 BP 관리자", "[WHALE ERP] 관리자 계정이 만들어졌습니다"],
  ["비밀번호 초기화", "관리자 본인", "[WHALE ERP] 비밀번호가 초기화되었습니다"],
  ["임시 비밀번호 발급", "관리자 본인", "[WHALE ERP] 임시 비밀번호를 보내 드립니다"],
  ["회원 탈퇴 완료", "탈퇴한 BP 마스터", "[WHALE ERP] 회원 탈퇴가 완료되었습니다"],
];
const PUSH = [
  ["근로계약서 발송", "근로계약서가 도착했습니다", ["10-07 09:41", "김하린"]],
  ["근무스케줄 주요 변경", "근무스케줄이 바뀌었습니다"],
  ["TO-DO 배정", "새 TO-DO 가 배정되었습니다", null, true],
  ["급여명세서 발송", "#{지급월} 급여명세서가 도착했습니다"],
];

import { CODES } from "../../template-codes.mjs";
const code = (channel, t) => `<span class="font-mono text-[13px]">${CODES[channel][t]}</span>`;

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const edited = (e) => (e ? `${e[0]} ${p.sub(e[1])}` : p.sub("기본 문구"));
  const name = (text, href, extra = "") => `<span class="flex items-center justify-center gap-[6px]">${ui.link(text, href)}${extra}</span>`;
  const cols = (first) => [
    { header: first, width: "w-[260px]" },
    { header: "템플릿 코드", width: "w-[280px]" },
    { header: "받는 사람", width: "w-[220px]" },
    { header: "제목", align: "left" },
    { header: "최근 수정", width: "w-[170px]" },
    { header: "사용 여부", width: "w-[100px]" },
  ];
  // 삭제 대신 사용 / 사용 안 함(NOTIFY-10). 사용 안 함은 줄을 흐리게.
  const use = (on = true) => (on ? "사용" : p.sub("사용 안 함"));
  const dim = (row, on = true) => (on ? row : row.map((c) => `<span class="opacity-50">${c}</span>`));
  const table = (first, rows) => ui.dataTable(cols(first), rows);

  const ops = table("템플릿 이름",
    OPS.map(([t, to, title, e, on = true]) => dim([name(t, L("notify/templates-edit.html")), code("NTF", t), to, title, edited(e), use(on)], on)),
  );
  const push = table("템플릿 이름",
    PUSH.map(([t, title, e, inboxOnly]) => [
      name(t, L(inboxOnly ? "notify/templates-edit-inbox.html" : "notify/templates-edit-push.html"), inboxOnly ? p.tag("quiet", "알림함에만, 푸시 없음") : ""),
      code("PUSH", t),
      "직원",
      title,
      edited(e),
      use(),
    ]),
  );
  const mail = table("템플릿 이름", [
    ...PURPOSES.map(([t, to, title]) => [name(t, L("notify/templates-edit-mail.html") ), code("EMAIL", t), to, title, edited(), use()]),
    ...TEAM1_MAILS.map(([t, to, title]) => [name(t, L("notify/templates-edit-mail.html"), p.tag("info", "1팀")), code("EMAIL", t), to, title, edited(), use()]),
    ...OPS.map(([t, to, title, e]) => [name(t, L("notify/templates-edit-mail.html")), code("EMAIL", t), to, `[WHALE ERP] ${title}`, edited(e), use()]),
  ]);

  // 알림톡: 다른 탭처럼 줄 이름으로 수정 화면에 들어간다(NOTIFY-8). 제목 대신 카카오 템플릿 코드와 본문 요약.
  const talk = ui.dataTable(
    [
      { header: "템플릿 이름", width: "w-[260px]" },
      { header: "템플릿 코드", width: "w-[280px]" },
      { header: "카카오 템플릿 코드", width: "w-[220px]" },
      { header: "본문 요약", align: "left" },
      { header: "최근 수정", width: "w-[170px]" },
      { header: "사용 여부", width: "w-[100px]" },
    ],
    [[name("가입 초대", L("notify/templates-edit-talk.html")), code("TALK", "가입 초대"), "WHALE_INVITE_01", "#{근무지}에서 근로계약서를 보내려고 합니다…", edited(["09-30 14:05", "이서준"]), use()]],
  );

  const count = (items) => `<div class="flex flex-col gap-[12px]">${ui.listToolbar(items)}`;
  const body = ui.listBody(
    "",
    x.tabs([
      { id: "ops", label: "운영 알림", html: count(OPS.length) + ops + "</div>" },
      { id: "push", label: "앱 푸시", html: count(PUSH.length) + push + "</div>" },
      { id: "mail", label: "메일", html: count(PURPOSES.length + TEAM1_MAILS.length + OPS.length) + mail + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div></div>` },
      { id: "talk", label: "알림톡", html: count(1) + talk + "</div>" },
    ]),
  );
  return {
    title: "알림 템플릿 관리",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "알림 템플릿 관리", titleRight: ui.button("등록", { href: L("notify/templates-new.html") }), body }),
  };
};
