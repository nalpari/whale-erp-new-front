// 커뮤니티관리 화면들이 같이 쓰는 내용. 목업 docs/mockup/support/community.html 을 플랫폼 관리자로 본 것.
// 목업은 네 갈래(공지사항·FAQ·문의사항·도입문의)를 탭으로 뒀는데, 데모에서는 헤더 커뮤니티관리 소메뉴마다 화면을 나눴다(2026-10-02 재영).
import * as ui from "./ui.mjs";
import { link } from "./site.mjs";

// 1팀 배지는 운영(on)·미운영(off) 두 색뿐이다. 임시저장·고정처럼 상태 색이 없는 값은 옅은 회색 꼬리표로 둔다.
const tag = (text) => `<span class="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-center text-[14px] font-medium text-erp-ink">${text}</span>`;
// 화면마다 왼쪽 필터 + 목록(목록 화면 기본 틀). 라디오는 필터 안에 세로로, 첫 값(전체)을 고른 채로 둔다.
const radioGroup = (name, items) => items.map((t, i) => ui.radio(t, name, i === 0)).join("");
const search = (A, label, placeholder) => ui.filterSection(label, ui.searchField(A, { placeholder }), { tight: true });
const pick = (label, name, items) => ui.filterSection(label, radioGroup(name, items), { last: true });
const pager = (A) => `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`;

export function communitySections({ A, R }) {
  const edit = link(R, "support/notice-edit.html");
  const notices = [
    [`<span class="flex items-center gap-[6px]">${tag("고정")}${ui.link("9월 정기 점검 안내 (09-14 02:00~05:00)", edit)}</span>`, "비회원 · 회원 · BP", ui.badge("on", "게시"), "2026-09-05"],
    [ui.link("근로계약 전자날인 기능이 열렸습니다", edit), "BP · 점포", ui.badge("on", "게시"), "2026-09-01"],
    [ui.link("KIOSK 9월 업데이트 — 결제 화면이 바뀝니다", edit), "부가서비스 · KIOSK", ui.badge("on", "게시"), "2026-08-28"],
    [ui.link("10월 요금 PLAN 개편 사전 안내", edit), "-", tag("임시저장"), "-"],
    [ui.link("8월 점검 안내 (종료)", edit), "비회원", ui.badge("off", "비공개"), "2026-08-10"],
  ];
  const faqEdit = link(R, "support/faq-edit.html");
  const faqs = [
    ["가입은 누가 할 수 있나요?", "가입·계정", "비회원"],
    ["직원도 이 사이트로 로그인하나요?", "가입·계정", "비회원"],
    ["근로계약서를 보냈는데 직원이 못 받았다고 합니다", "직원·근로", "BP"],
    ["퇴사한 직원의 급여명세서는 어떻게 보나요", "직원·근로", "BP · 점포"],
  ].map(([q, c, t]) => [ui.link(q, faqEdit), c, t, ui.badge("on", "게시")]);
  const answer = (s) => ui.badge(s === "답변 완료" ? "on" : "off", s);
  const askDetail = link(R, "support/inquiry-detail.html");
  const asks = [
    ["파트타이머 주휴수당이 계산되지 않습니다", "㈜한강상회 · 정하윤", "직원·근로", "답변 대기", "09-04"],
    ["가맹점 초대 메일이 반송됩니다", "㈜한강상회 · 정하윤", "가입·계정", "답변 완료", "08-30"],
    ["KIOSK 구독을 늘리고 싶습니다", "온기식당 · 배정숙", "요금·구독", "답변 대기", "09-02"],
  ].map(([t, from, c, s, d]) => [ui.link(t, s === "답변 완료" ? link(R, "support/inquiry-detail-done.html") : askDetail), from, c, answer(s), d]);
  const leadDetail = link(R, "support/lead-detail.html");
  const leads = [
    ["조민석 · 010-7741-2093", "모리커피 청담", "가맹점", "답변 대기", "09-06"],
    ["윤서린 · 010-3320-8814", "㈜세움에프앤비", "프랜차이즈 본사", "답변 대기", "09-03"],
    ["한도윤 · 010-9902-1177", "도윤상회", "단일 점포", "답변 완료", "08-27"],
  ].map(([who, biz, type, s, d]) => [ui.link(who, leadDetail), biz, type, answer(s), d]);

  const STATE = { header: "상태", width: "w-[110px]" };
  return {
    notices: {
      filter: ui.filterPanel(A, [search(A, "제목", "제목으로 검색"), pick("상태", "notice-state", ["전체", "게시", "임시저장", "비공개"])]),
      content:
        ui.listToolbar(12, ui.button("새 공지", { href: edit })) +
        ui.dataTable([{ header: "제목", align: "left" }, { header: "노출 대상", width: "w-[260px]" }, STATE, { header: "게시일", width: "w-[140px]" }], notices) +
        pager(A),
    },
    faq: {
      filter: ui.filterPanel(A, [search(A, "질문", "질문으로 검색"), pick("카테고리", "faq-cat", ["전체", "가입·계정", "직원·근로", "요금·구독", "점포·설비"])]),
      content:
        ui.listToolbar(18, ui.button("새 FAQ", { href: faqEdit })) +
        ui.dataTable([{ header: "질문", align: "left" }, { header: "카테고리", width: "w-[160px]" }, { header: "노출 대상", width: "w-[200px]" }, STATE], faqs) +
        pager(A),
    },
    asks: {
      filter: ui.filterPanel(A, [search(A, "제목", "제목으로 검색"), search(A, "보낸 곳", "BP·점포 또는 이름으로 검색"), pick("상태", "ask-state", ["전체", "답변 대기", "답변 완료"])]),
      content:
        ui.listToolbar(7, "") +
        ui.dataTable(
          [{ header: "제목", align: "left" }, { header: "보낸 곳", width: "w-[220px]" }, { header: "분류", width: "w-[140px]" }, STATE, { header: "접수", width: "w-[110px]" }],
          asks,
        ) +
        pager(A),
    },
    leads: {
      filter: ui.filterPanel(A, [search(A, "담당자", "이름 또는 번호"), pick("상태", "lead-state", ["전체", "답변 대기", "답변 완료"])]),
      content:
        ui.listToolbar(4, "") +
        ui.dataTable(
          [{ header: "담당자", align: "left" }, { header: "사업자", width: "w-[220px]" }, { header: "운영 형태", width: "w-[160px]" }, STATE, { header: "접수", width: "w-[110px]" }],
          leads,
        ) +
        pager(A),
    },
  };
}
