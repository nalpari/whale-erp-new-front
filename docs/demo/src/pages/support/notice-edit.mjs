// 공지사항 수정. 목업 docs/mockup/support/notice-edit.html 의 기본 상태(게시된 공지 · 상단 고정)를 플랫폼 관리자로 본 것.
// 목업은 공지·FAQ 를 한 화면에서 종류로 바꿨는데, 데모에서는 FAQ 를 faq-edit 로 나눴다(2026-10-02 재영).
// 배치는 앱 post-form.tsx 와 같다(2026-11-06 사용자 지정): 왼쪽 상자(유형 · 제목 · 본문 · 첨부), 오른쪽 상단 고정 · 게시 기간 상자 → 노출 대상 상자 → 변경이력.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import * as x from "../../extra.mjs";
import * as q from "../../post-parts.mjs";
import { platformHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const content = q.bare(
    // 공지사항 유형(api noticeType, 공지면 필수) — 사용자 쪽 목록의 「구분」이 이것이다.
    ui.field(`유형${q.REQ}`, ui.select(["점검", "기능", "약관", "안내"], { value: "점검" })) +
      ui.field(`제목${q.REQ} <span class="ml-[6px] text-[12px] font-normal text-erp-muted">25 / 200</span>`, ui.textField({ value: "9월 정기 점검 안내 (09-14 02:00~05:00)" })) +
      ui.field(
        `본문${q.REQ}`,
        ui.textarea({
          rows: 12,
          placeholder: "공지사항 내용을 입력해 주세요.\nHTML 태그는 지원하지 않으며, 입력한 내용이 그대로 표시됩니다.",
          value:
            "9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.\n점검 시간에는 관리자 웹과 직원 전용 앱을 모두 사용할 수 없습니다.\n직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.\n점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.",
        }),
      ) +
      // 게시를 누르면 걸린 칸 바로 아래 8px 에 빨간 13px 문구만(칸 테두리는 칠하지 않는다). 고치면 그 칸 문구는 내린다
      q.attachments(
        [
          ["점검_시간표.png", "212KB", true],
          ["점검_안내_2026-09.pdf", "184KB"],
        ],
        ["점검_전체_로그.pdf", "10MB 이하 파일만 첨부할 수 있습니다."],
      ),
  );

  // 상단 고정(칸 이름 앞 · 스위치 뒤) · 게시 기간 — 한 상자, 묶음 사이 24px · 칸과 안내 사이 8px.
  // 시작일은 화면이 채우지 않는다 — 비운 채 게시하면 api 가 등록일을 게시일로 쓰고, 게시 중 · 비공개 글은 시작일 칸 아래 「게시일: … (등록일)」 연한 노랑 꼬리표(앱 post-form.tsx).
  // 종료일이 시작일(비었으면 게시일 — 게시 중인 글은 등록일, 그 밖은 오늘)보다 앞서면 종료일 칸 아래 「게시 종료일은 시작일 이후로 선택해 주세요.」(2026-11-06 사용자 지정)
  const postedTag = `<span class="self-start rounded-[2px] border border-[#e8a33d]/50 bg-[#fff6e5] px-[8px] text-[14px] leading-[24px] font-medium text-[#956013]">게시일: 2026-09-05 (등록일)</span>`;
  const period =
    q.name("게시 기간") +
    `<div class="flex items-start gap-[6px]"><div class="flex flex-1 flex-col gap-[8px]">${ui.dateField(A, { label: "게시 시작일" })}${postedTag}</div><span class="flex h-[34px] items-center text-erp-label">~</span><div class="flex-1">${ui.dateField(A, { label: "게시 종료일", value: "2026-09-14" })}</div></div>` +
    q.note("기간 미설정 시 <u>게시 후 계속 표시</u>됩니다. 종료일만 설정하면 시작일은 게시일로 자동 적용됩니다.");
  const settings = q.bare(
    q.group(`<span class="flex items-center gap-[10px]">${q.name("상단 고정")}${x.toggle("", true)}</span>` + q.note("상단 고정 시 공지 목록 맨 위에 표시되며, 여러 개일 경우 최신 게시일순으로 정렬됩니다.")) + q.group(period),
  );
  // 노출 대상은 따로 상자(표). 부가서비스 대상(상품별)은 1차에 없다(2026-10-12 재영).
  const targets = q.audiences(A, [true, true, true, true]);

  // 변경 이력 표는 두지 않는다 — 등록 시각과 마지막 수정만 남긴다(WHALEERP-272). 등록 화면에서는 두 줄 모두 「-」.
  // 다른 관리자가 먼저 저장해 막히면(409) 화면 위 빨간 테두리 띠로 알리고 최신 내용을 다시 불러온다.
  const history = q.history("2026-09-05 14:02", "2026-09-05 14:20", "이서준");

  // 저장 토스트는 짧게 동작만 — 게시했습니다 · 임시저장했습니다 · 비공개로 변경했습니다. 삭제 확인창은 빨간 버튼 없이 기본 버튼.
  const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { href: link(R, "support/community-notices.html") })}${ui.button("삭제", { variant: "soft" })}${ui.button("비공개", { variant: "soft", "data-toast": "비공개로 변경했습니다." })}${ui.button("임시저장", { variant: "soft", "data-toast": "임시저장했습니다." })}${ui.button("게시", { "data-toast": "게시했습니다." })}</div>`;

  return {
    title: "공지사항 수정",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "공지사항", body: ui.detailBody(p.detailHead("공지사항 수정", right) + p.cols(content, settings + targets + history)) }),
  };
};
