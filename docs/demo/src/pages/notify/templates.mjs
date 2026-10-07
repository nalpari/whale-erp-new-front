// 알림 템플릿 관리. 목업 docs/mockup/notify/templates.html. 플랫폼 운영자 전용이라 플랫폼 헤더로 그린다.
// 채널 탭 넷. 줄 이름을 누르면 그 채널의 수정 화면으로 간다(채널마다 한 장, src/template-edit.mjs).
// TO-DO 배정은 푸시 없이 알림함에만 쌓인다(앱 NOTI-1). 알림톡은 카카오 검수 문구라 승인 상태 없이 읽기 전용(NOTIFY-6, 2026-10-07 재영).
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
  ["계약 갱신 예정", "소속 범위 사업자 관리자", "#{직원이름} 님의 계약이 30일 뒤 끝납니다"],
];
const PURPOSES = [
  ["비밀번호 찾기 핀", "본인", "[WHALE ERP] 비밀번호 재설정 인증번호"],
  ["관리자 초기화 재설정 링크", "직원", "[WHALE ERP] 비밀번호를 다시 정해 주세요"],
  ["로그인 이메일 변경 핀", "본인", "[WHALE ERP] 로그인 이메일 변경 인증번호"],
  ["도입문의 접수 확인", "도입문의를 남긴 사람", "[WHALE ERP] 도입문의를 받았습니다"],
];
const PUSH = [
  ["근로계약서 발송", "근로계약서가 도착했습니다", ["10-07 09:41", "김하린"]],
  ["근무스케줄 주요 변경", "근무스케줄이 바뀌었습니다"],
  ["TO-DO 배정", "새 TO-DO 가 배정되었습니다", null, true],
  ["급여명세서 발송", "#{지급월} 급여명세서가 도착했습니다"],
];

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const edited = (e) => (e ? `${e[0]} ${p.sub(e[1])}` : p.sub("기본 문구"));
  const name = (text, href, extra = "") => `<span class="flex items-center justify-center gap-[6px]">${ui.link(text, href)}${extra}</span>`;
  const cols = (first) => [
    { header: first, width: "w-[260px]" },
    { header: "받는 사람", width: "w-[220px]" },
    { header: "제목", align: "left" },
    { header: "최근 수정", width: "w-[170px]" },
  ];
  const table = (first, rows) => ui.dataTable(cols(first), rows);

  const ops = table(
    "알림 유형",
    OPS.map(([t, to, title, e]) => [name(t, L("notify/templates-edit.html")), to, title, edited(e)]),
  );
  const push = table(
    "알림 유형",
    PUSH.map(([t, title, e, inboxOnly]) => [
      name(t, L(inboxOnly ? "notify/templates-edit-inbox.html" : "notify/templates-edit-push.html"), inboxOnly ? p.tag("quiet", "알림함에만, 푸시 없음") : ""),
      "직원",
      title,
      edited(e),
    ]),
  );
  const mail = table("알림 유형 · 발송 용도", [
    ...PURPOSES.map(([t, to, title]) => [name(t, L("notify/templates-edit-mail.html"), p.tag("quiet", "발송 용도")), to, title, edited()]),
    ...OPS.map(([t, to, title, e]) => [name(t, L("notify/templates-edit-mail.html")), to, `[WHALE ERP] ${title}`, edited(e)]),
  ]);

  // 알림톡: 목록은 발송 용도·카카오 템플릿 코드·본문 요약만. 상세는 읽기 전용(제목 없음).
  const talkBody = "#{근무지}에서 근로계약서를 보내려고 합니다.\n아래 링크로 WHALE ERP 직원 근무 앱에 가입해 주세요.\n링크는 30일 동안 쓸 수 있습니다.";
  const talk =
    p.band("알림톡 문구는 이 화면에서 고칠 수 없습니다", { desc: "카카오가 검수한 문구와 글자 하나까지 같아야 발송됩니다. 문구를 바꾸려면 카카오 검수와 배포가 필요합니다." }) +
    p.cols(
      ui.dataTable(
        [{ header: "발송 용도", width: "w-[160px]" }, { header: "카카오 템플릿 코드", width: "w-[200px]" }, { header: "본문 요약", align: "left" }],
        [["가입 초대", "WHALE_INVITE_01", "#{근무지}에서 근로계약서를 보내려고 합니다…"]],
      ),
      `<div class="flex flex-col gap-[12px]">${ui.detailTable("가입 초대", [
        ["템플릿 코드", "WHALE_INVITE_01"],
        ["발신 프로필", "WHALE ERP"],
        ["버튼", "가입하기"],
      ])}${p.box("본문", "", `<p class="whitespace-pre-line text-[14px] leading-[1.6] text-erp-ink">${talkBody}</p>`, { pad: true })}</div>`,
    );

  const count = (items) => `<div class="flex flex-col gap-[12px]">${ui.listToolbar(items)}`;
  const body = ui.listBody(
    "",
    x.tabs([
      { id: "ops", label: "운영 알림", html: count(OPS.length) + ops + "</div>" },
      { id: "push", label: "앱 푸시", html: count(PUSH.length) + push + "</div>" },
      { id: "mail", label: "메일", html: count(PURPOSES.length + OPS.length) + mail + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div></div>` },
      { id: "talk", label: "알림톡", html: talk },
    ]),
  );
  return {
    title: "알림 템플릿 관리",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "알림 템플릿 관리", body }),
  };
};
