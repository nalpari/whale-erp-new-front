"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, Checkbox } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { useCodeLabel } from "./code-label";

// 등록 · 수정 폼의 「대상 점포」 고르기(데모 config-parts storePicker · bulk). 목록 필터의 StorePicker(188px)와 달리 폼 폭에 맞춰
// 위는 점포 찾기 칸과 [일괄 검색], 아래는 고른 점포 칩(줄바꿈으로 쌓고 5줄 높이 넘으면 이 안에서 스크롤)이다.
// 후보(options)는 화면이 api 로 받아 넘긴다 — 로그인 정보의 점포가 아니라 그 폼이 고를 수 있는 점포다(BP 관리자: store-options).
// 후보에는 고를 수 있는 점포만 온다 — 폐점 · 다른 가맹 마스터 담당은 api 가 빼고 보낸다.
// 찾기 칸을 누르면 아직 고르지 않은 점포가 모두 펼쳐지고, 글자를 넣으면 점포명 · 점포코드로 좁힌다. 고르면 칩 맨 앞에 붙는다.
// exclude 를 주면 고른 점포가 「예외 점포」다 — 적용 범위가 전체 점포일 때 빠질 점포를 고른다(BP 휴일). 고르는 동작은 같고 문구만 바뀐다.

export type MappingStoreOption = {
  storeId: number;
  name: string;
  storeCode: string;
  storeTypeCode: string;
};
export type MappingStore = { storeId: number; name: string; storeCode: string };

/** 일괄 검색 창이 쓰는 문구 — 필터용(filter)은 창만 쓰므로 이것만 둔다 */
type BulkTexts = { guide: string; left: string; right: string; leftDone: string; rightEmpty: ReactNode };
/** 고르기 칸까지 쓰는 문구 */
type PickerTexts = BulkTexts & { search: string; picked: string; noPicked: ReactNode };

/**
 * 고른 점포의 뜻에 따라 바뀌는 문구 — 기본은 매핑할 점포, exclude 는 전체 점포에서 뺄 점포.
 * 기본 문구는 2026-10-27 사용자 지정(빈 칩 · 오른쪽 빈 목록은 두 줄, 일괄 검색 안내는 한 줄)이고, 예외 · 필터 문구도 같은 말투로 맞췄다.
 */
const TEXTS: { include: PickerTexts; exclude: PickerTexts; filter: BulkTexts } = {
  include: {
    search: "관리할 점포 찾기",
    picked: "선택한 점포",
    noPicked: (
      <>
        선택된 점포가 없습니다.
        <br />
        점포찾기에서 점포를 검색하여 추가해 주세요.
      </>
    ),
    guide: "점포를 선택한 후 [추가] 버튼을 누르거나 오른쪽으로 드래그하여 매핑할 수 있습니다. 매핑 해제는 [빼기] 버튼을 이용해 주세요.",
    left: "매핑 안 된 점포",
    right: "매핑된 점포",
    leftDone: "선택할 수 있는 점포를 모두 매핑했습니다.",
    rightEmpty: (
      <>
        매핑된 점포가 없습니다.
        <br />
        왼쪽 목록에서 점포를 선택하여 추가해 주세요.
      </>
    ),
  },
  exclude: {
    search: "예외로 뺄 점포 찾기",
    picked: "예외점포", // 붙여 쓴다(2026-10-30 사용자 지정)
    // 기본(「선택된 점포가 없습니다.」)과 같은 말투 — 「모든 점포에 적용합니다.」는 무엇이 적용되는지 빠져 어색했다(2026-10-30 사용자 지정)
    noPicked: (
      <>
        선택된 예외점포가 없습니다.
        <br />
        모든 점포에 휴일이 적용됩니다.
      </>
    ),
    guide: "점포를 선택한 후 [추가] 버튼을 누르거나 오른쪽으로 드래그하여 예외로 뺄 수 있습니다. 예외 해제는 [빼기] 버튼을 이용해 주세요.",
    left: "적용 점포",
    right: "예외점포",
    leftDone: "선택할 수 있는 점포를 모두 예외로 지정했습니다.",
    rightEmpty: (
      <>
        예외점포가 없습니다.
        <br />
        왼쪽 목록에서 점포를 선택하여 추가해 주세요.
      </>
    ),
  },
  // 목록 필터의 점포 고르기(StorePicker) 옆 [일괄검색] — 고른 점포만 목록에 보인다(점포 정보 관리)
  filter: {
    guide: "점포를 선택한 후 [추가] 버튼을 누르거나 오른쪽으로 드래그하여 선택할 수 있습니다. 선택 해제는 [빼기] 버튼을 이용해 주세요.",
    left: "선택할 수 있는 점포",
    right: "선택한 점포",
    leftDone: "선택할 수 있는 점포를 모두 선택했습니다.",
    rightEmpty: (
      <>
        선택된 점포가 없습니다.
        <br />
        왼쪽 목록에서 점포를 선택하여 추가해 주세요.
      </>
    ),
  },
};

const matches = (s: MappingStoreOption, keyword: string) => {
  const k = keyword.trim().toLowerCase();
  return !k || s.name.toLowerCase().includes(k) || s.storeCode.toLowerCase().includes(k);
};

export function StoreMappingPicker({
  options,
  picked,
  onChange,
  invalid,
  describedBy,
  loading,
  failed,
  panelOpen,
  exclude = false,
  blocked,
  short = false,
}: {
  /** 감싼 패널이 열려 있는가 — 뒤로 가기처럼 클릭 아닌 길로 닫히면 최상위 레이어의 일괄 검색 창 · 찾기 목록도 닫는다 */
  panelOpen: boolean;
  options: MappingStoreOption[];
  picked: MappingStore[];
  onChange: (next: MappingStore[]) => void;
  /** 「1곳 이상」 등 오류가 있다 — 찾기 칸 테두리를 붉게 */
  invalid?: boolean;
  describedBy?: string;
  /** 후보를 받는 중 */
  loading?: boolean;
  /** 후보를 받지 못했다 — 빈 후보를 「고를 점포가 없다」로 보이지 않게 찾기 목록 · 일괄 검색을 막는다(화면이 실패 띠를 보인다) */
  failed?: boolean;
  /** 고른 점포가 예외 점포다(적용 범위 전체 점포) — 문구만 바뀐다 */
  exclude?: boolean;
  /**
   * 아직 후보를 받을 수 없는 이유(예: 「계정역할을 먼저 선택하세요.」) — 주면 찾기 칸 · [일괄 검색]을 막고 찾기 칸에 이 문구를 둔다.
   * 후보를 받기 전 빈 목록이 「선택할 수 있는 점포가 없습니다.」로 읽히지 않게 한다(2026-10-29 사용자 지적, BP 관리자 등록)
   */
  blocked?: string;
  /** 고른 점포 칸을 1/3 낮춘다(130 → 86px) — 위아래로 긴 패널(BP 휴일)에서 버튼이 화면 밖으로 밀리지 않게(2026-10-30 사용자 지정) */
  short?: boolean;
}) {
  const text = exclude ? TEXTS.exclude : TEXTS.include;
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const escClearing = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  // 남겨 두면 data-dismiss-open 때문에 바깥 패널의 Esc 가 모두 막힌다(HistoryButton 과 같은 방식)
  if (!panelOpen && (bulkOpen || open)) {
    setBulkOpen(false);
    setOpen(false);
  }

  const pickedIds = new Set(picked.map((p) => p.storeId));
  const candidates = options.filter((s) => !pickedIds.has(s.storeId) && matches(s, keyword));
  const listShown = open && candidates.length > 0;
  // 후보가 없을 때도 층을 열어 이유를 말한다 — 받는 중 · 받지 못함은 화면이 따로 알린다
  const emptyShown = open && !candidates.length && !loading && !failed;
  const emptyText = !options.length ? "선택할 수 있는 점포가 없습니다." : keyword.trim() ? "검색 결과가 없습니다." : "선택할 수 있는 점포를 모두 선택했습니다.";

  const choose = (s: MappingStoreOption) => {
    onChange([{ storeId: s.storeId, name: s.name, storeCode: s.storeCode }, ...picked]);
    setKeyword("");
    setActive(0);
  };

  return (
    <div className="flex flex-col gap-[10px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[12px]">
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-medium text-erp-ink">점포 찾기</p>
        <div className="flex items-start gap-[6px]">
          <div
            ref={box}
            className="relative min-w-px flex-1"
            onBlur={(e) => {
              if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
          >
            {/* type="search" — 크롬 비밀번호 관리자가 이 칸을 아이디 칸으로 보고 저장한 계정 목록을 띄웠다(autoComplete="off" 로는 안 막힌다, 2026-10-28 사용자 지적).
                검색칸에는 계정 목록을 띄우지 않는다. 브라우저 기본 지우기 단추는 숨겨 모양은 그대로 둔다. 1Password · LastPass 도 빼 둔다 */}
            <input
              type="search"
              data-1p-ignore
              data-lpignore="true"
              value={keyword}
              onChange={(e) => {
                // search 칸은 Esc 에 브라우저가 값을 지운다 — 목록이 닫힌 채 Esc 로 패널을 닫을 때 입력이 사라지지 않게 그 지우기는 받지 않는다
                if (escClearing.current) {
                  escClearing.current = false;
                  return;
                }
                setKeyword(e.target.value);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && (listShown || emptyShown)) {
                  e.preventDefault();
                  setOpen(false);
                } else if (e.key === "Escape") {
                  // preventDefault 하면 패널 Esc 닫기까지 막힌다(slide-panel) — 대신 뒤따르는 브라우저 지우기만 무시한다
                  escClearing.current = true;
                  requestAnimationFrame(() => (escClearing.current = false));
                } else if (e.key === "ArrowDown" && candidates.length) {
                  e.preventDefault();
                  setOpen(true);
                  setActive((i) => Math.min(i + 1, candidates.length - 1));
                } else if (e.key === "ArrowUp" && candidates.length) {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  // 폼 안에서 Enter 가 저장으로 번지지 않게 늘 막는다
                  e.preventDefault();
                  if (listShown && candidates[active]) choose(candidates[active]);
                }
              }}
              placeholder={blocked ?? (loading ? "점포 목록을 불러오는 중입니다" : "점포명 또는 점포코드")}
              disabled={!!blocked}
              aria-label={text.search}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listShown}
              aria-controls={listShown ? listId : undefined}
              aria-activedescendant={listShown ? `${listId}-${active}` : undefined}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
              maxLength={50}
              className={`${FIELD} pr-[10px] [&::-webkit-search-cancel-button]:hidden`}
            />
            {listShown && (
              <ul
                id={listId}
                role="listbox"
                aria-label="선택할 수 있는 점포"
                // 열려 있는 동안 Esc 가 이 층부터 닫도록 알린다(slide-panel.tsx 의 data-dismiss-open 규칙)
                data-dismiss-open=""
                onMouseDown={(e) => e.preventDefault()}
                // 떠 있는 층이라 팝업 그림자 하나만 쓴다(DESIGN.md). #ebebeb 는 팝업 테두리 값이다
                className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] text-[14px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
              >
                {candidates.map((s, i) => (
                  <li
                    key={s.storeId}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(s)}
                    className={`flex cursor-pointer items-center gap-[8px] rounded-[2px] px-[6px] py-[6px] text-erp-ink ${i === active ? "bg-erp-thead-bg" : ""}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <span className="shrink-0 text-[12px] text-erp-muted">{s.storeCode}</span>
                  </li>
                ))}
              </ul>
            )}
            {emptyShown && (
              <p
                data-dismiss-open=""
                onMouseDown={(e) => e.preventDefault()}
                className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 rounded-[2px] border border-[#ebebeb] bg-white px-[12px] py-[10px] text-[14px] text-erp-muted shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
              >
                {emptyText}
              </p>
            )}
          </div>
          <Button variant="soft" onClick={() => setBulkOpen(true)} disabled={!!blocked || loading || failed}>
            일괄 검색
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-[8px] border-t border-erp-divider pt-[10px]">
        <p className="flex min-h-[34px] items-center gap-[10px] text-[14px] font-medium text-erp-ink">
          {text.picked} <span className="font-normal text-erp-label">{picked.length}개점</span>
          <span className="ml-auto">
            <Button variant="soft" onClick={() => onChange([])} disabled={!picked.length}>
              전체 제거
            </Button>
          </span>
        </p>
        {/* 194px(칩 다섯 줄)에서 1/3 줄인 130px(2026-10-27 사용자 지정) — 넷째 줄 윗부분이 살짝 보여 더 있다는 것을 알린다. 넘치면 이 안에서 세로로 스크롤한다 */}
        <div className={`relative ${short ? "h-[86px]" : "h-[130px]"}`}>
          <ul aria-label={text.picked} className="flex h-full flex-wrap content-start gap-[6px] overflow-y-auto overscroll-contain">
            {picked.map((s) => (
              <li
                key={s.storeId}
                title={`${s.name} · ${s.storeCode}`}
                className="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px] text-erp-ink"
              >
                <span className="font-medium">{s.name}</span>
                <button
                  type="button"
                  aria-label={`${s.name} 빼기`}
                  onClick={() => onChange(picked.filter((p) => p.storeId !== s.storeId))}
                  className="grid size-[26px] place-items-center rounded-[2px] text-erp-label transition-colors duration-150 hover:text-erp-ink"
                >
                  <svg viewBox="0 0 8 8" className="size-[8px] stroke-current" aria-hidden>
                    <path d="M1 1l6 6M7 1L1 7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          {!picked.length && (
            <p className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[13px] leading-[1.6] text-erp-muted">
              {/* 두 줄 안내 — TEXTS 의 noPicked */}
              <span>{text.noPicked}</span>
            </p>
          )}
        </div>
      </div>

      <BulkDialog
        open={bulkOpen}
        options={options}
        picked={picked}
        text={text}
        onCancel={() => setBulkOpen(false)}
        onApply={(next) => {
          setBulkOpen(false);
          onChange(next);
        }}
      />
    </div>
  );
}

/**
 * 점포 일괄 검색 창(데모 storeBulkDialog). 왼쪽은 매핑 안 된 점포, 오른쪽은 매핑된 점포다. 체크하고 [추가 ›] · [‹ 빼기]로 옮기거나,
 * 줄을 끌어 반대쪽 목록에 놓는다 — 체크한 줄을 끌면 같은 쪽에서 체크한 줄이 모두 간다(2026-10-26). 옮긴 뒤
 * [N개점 적용]으로 칩에 반영한다. 두 목록 위 묶음 체크(전체 선택 · 점포유형)는 그 목록에서 한꺼번에 체크한다.
 * 이미 매핑된 점포는 후보에 없어도(폐점) 오른쪽에 그대로 서고 뺄 수 있다. 열 때마다 지금 칩으로 두 목록을 다시 나눈다.
 * 목록 필터도 같은 창을 쓴다(StoreBulkDialog — 문구만 필터용).
 */
export function StoreBulkDialog(props: Omit<Parameters<typeof BulkDialog>[0], "text">) {
  return <BulkDialog {...props} text={TEXTS.filter} />;
}

function BulkDialog({
  open,
  options,
  picked,
  text,
  onCancel,
  onApply,
}: {
  open: boolean;
  options: MappingStoreOption[];
  picked: MappingStore[];
  text: BulkTexts;
  onCancel: () => void;
  onApply: (next: MappingStore[]) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const typeLabel = useCodeLabel("STORE_TYPE");
  const [draft, setDraft] = useState<MappingStore[]>(picked);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  /** 끌고 있는 줄 — 어느 쪽에서 무엇을 옮기는지 */
  const [dragging, setDragging] = useState<{ from: "L" | "R"; ids: number[] } | null>(null);
  /** 끌어 놓을 수 있는 목록 위에 있다 — 그 목록 테두리를 브랜드색으로 */
  const [over, setOver] = useState<"L" | "R" | null>(null);
  const [shownOpen, setShownOpen] = useState(open);
  if (open !== shownOpen) {
    setShownOpen(open);
    if (open) {
      setDraft(picked);
      setChecked(new Set());
    }
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const draftIds = new Set(draft.map((s) => s.storeId));
  // 이미 매핑된 점포가 후보에 없으면(범위 · 상태가 바뀜) 오른쪽에만 이름으로 세운다
  const right: MappingStoreOption[] = draft.map((s) => options.find((o) => o.storeId === s.storeId) ?? { ...s, storeTypeCode: "" });
  const left = options.filter((o) => !draftIds.has(o.storeId));
  const types = [...new Set(options.map((o) => o.storeTypeCode))];

  const toggle = (id: number, on: boolean) =>
    setChecked((c) => {
      const next = new Set(c);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  /** 고른 점포를 반대쪽으로 옮긴다 — 버튼은 체크한 것, 끌어 놓기는 끈 것 */
  const moveIds = (to: "R" | "L", ids: ReadonlySet<number>) => {
    if (to === "R") {
      const add = left.filter((o) => ids.has(o.storeId)).map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode }));
      setDraft([...add, ...draft]);
    } else setDraft(draft.filter((s) => !ids.has(s.storeId)));
    // 옮긴 줄의 체크만 푼다 — 반대쪽에서 체크해 둔 줄은 남긴다
    setChecked((c) => new Set([...c].filter((id) => !ids.has(id))));
  };
  const move = (to: "R" | "L") => moveIds(to, checked);
  const endDrag = () => {
    setDragging(null);
    setOver(null);
  };

  const pane = (side: "L" | "R", title: string, rows: MappingStoreOption[], empty: ReactNode) => {
    const group = (label: string, members: MappingStoreOption[]) => {
      const on = members.filter((m) => checked.has(m.storeId)).length;
      return (
        <Checkbox
          key={label}
          label={`${label} ${members.length}`}
          disabled={!members.length}
          checked={members.length > 0 && on === members.length}
          indeterminate={on > 0 && on < members.length}
          onChange={(e) => members.forEach((m) => toggle(m.storeId, e.target.checked))}
        />
      );
    };
    return (
      <section
        aria-label={title}
        // 반대쪽에서 끌어 온 줄만 받는다
        onDragOver={(e) => {
          if (!dragging || dragging.from === side) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (over !== side) setOver(side);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
        }}
        onDrop={(e) => {
          if (!dragging || dragging.from === side) return;
          e.preventDefault();
          moveIds(side, new Set(dragging.ids));
          endDrag();
        }}
        className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border transition-[border-color] duration-150 ease-out ${over === side ? "border-erp-brand" : "border-erp-panel-line"}`}
      >
        <div className="flex h-[42px] shrink-0 items-center gap-[8px] border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px] font-medium">
          {title}
          <span className="font-normal text-erp-label">{rows.length}개점</span>
        </div>
        <div role="group" aria-label={`${title}에서 한꺼번에 체크`} className="flex shrink-0 flex-wrap gap-x-[18px] gap-y-[6px] border-b border-erp-divider px-[12px] py-[10px]">
          {group("전체 선택", rows)}
          {types.filter(Boolean).map((t) => group(typeLabel(t), rows.filter((m) => m.storeTypeCode === t)))}
        </div>
        <ul className="h-[300px] overflow-y-auto overscroll-contain p-[4px]">
          {rows.map((r) => (
            <li
              key={r.storeId}
              draggable
              onDragStart={(e) => {
                // 체크한 줄을 끌면 같은 쪽에서 체크한 줄이 모두 간다
                const ids = checked.has(r.storeId) ? rows.filter((x) => checked.has(x.storeId)).map((x) => x.storeId) : [r.storeId];
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", ids.join(","));
                setDragging({ from: side, ids });
              }}
              onDragEnd={endDrag}
              className={`flex cursor-grab items-center gap-[8px] rounded-[2px] px-[8px] py-[6px] text-[13px] text-erp-ink hover:bg-erp-thead-bg ${dragging?.ids.includes(r.storeId) ? "opacity-40" : ""}`}
            >
              <span className="min-w-0 flex-1 truncate">
                <Checkbox label={r.name} checked={checked.has(r.storeId)} onChange={(e) => toggle(r.storeId, e.target.checked)} />
              </span>
              <span className="shrink-0 text-[11.5px] text-erp-muted">{r.storeCode}</span>
              <span className="w-[52px] shrink-0 text-right text-[11.5px] text-erp-muted">{r.storeTypeCode && typeLabel(r.storeTypeCode)}</span>
            </li>
          ))}
          {!rows.length && <li className="px-[12px] py-[40px] text-center text-[13px] leading-[1.6] text-erp-muted">{empty}</li>}
        </ul>
      </section>
    );
  };

  const canAdd = left.some((o) => checked.has(o.storeId));
  const canRemove = draft.some((s) => checked.has(s.storeId));

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // 열린 동안 슬라이드 패널이 같은 Esc 로 닫히지 않게 알린다(slide-panel.tsx 의 data-dismiss-open 규칙)
      data-dismiss-open={open ? "" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups). 폭 960 은 두 목록 머리의 묶음 체크가
      // 한 줄에 들어가게 넓혔다 — 줄이 넘어가면 두 목록 높이가 어긋난다(2026-10-26 사용자 요청)
      className="m-auto w-[960px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <h2 id={titleId} className="text-[18px] font-semibold">
        점포 일괄 검색
      </h2>
      <div className="mt-[12px] text-[14px] leading-[1.6]">
        <p className="text-[13px] text-erp-label">{text.guide}</p>
        <div className="mt-[12px] flex items-stretch gap-[12px]">
          {pane("L", text.left, left, options.length ? text.leftDone : "선택할 수 있는 점포가 없습니다.")}
          <div className="flex shrink-0 flex-col justify-center gap-[6px]">
            <Button variant="off" onClick={() => move("R")} disabled={!canAdd}>
              추가 ›
            </Button>
            <Button variant="off" onClick={() => move("L")} disabled={!canRemove}>
              ‹ 빼기
            </Button>
          </div>
          {pane("R", text.right, right, text.rightEmpty)}
        </div>
      </div>
      <div className="mt-[24px] flex justify-end gap-[6px]">
        <Button variant="off" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={() => onApply(draft)}>{draft.length}개점 적용</Button>
      </div>
    </dialog>
  );
}
