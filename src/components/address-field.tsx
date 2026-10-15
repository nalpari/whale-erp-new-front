"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, RequiredMark, SearchField, TextField } from "@/components/common";
import type { AddressItem } from "@/lib/address-search";
import { searchAddressAction } from "@/lib/address-actions";

// 주소 — 검색칸에 치면 바로 아래 층에 주소 목록이 뜨고, 고르면 우편번호 · 기본주소가 채워진다(처음 만든 곳은 플랫폼 관리자 SYSTEM-4, 점포 등록 · 수정도 쓴다).
// 우편번호 · 기본주소는 검색에서 고른 값만 들어가고(읽기 전용), 상세주소만 직접 적는다. 선택 칸이든 required 든 [지우기]로 비울 수 있다(required 는 라벨 뒤 * 만 붙인다).
// 검색은 행정안전부 도로명주소 검색 API 다(src/lib/address-search.ts). 치는 동안은 0.3초 쉬었다가 부른다.
// 검색칸은 공통 SearchField 다(오른쪽 돋보기 · 지우기). 돋보기를 누르면 쉬지 않고 바로 찾는다.
// 키보드: ↑ · ↓ 로 고르고 Enter 로 넣는다. Esc · 바깥 누르기로 닫는다.
// 떠 있는 층이라 팝업 그림자 하나만 쓴다(DESIGN.md 뜬 것만 그림자). #ebebeb 는 팝업 테두리 값이다.

export type AddressValue = { zipCode: string; address: string; addressDetail: string };

const DEBOUNCE_MS = 300;

export function AddressField({
  value,
  onChange,
  detailError,
  onChoose,
  label = "주소",
  required,
}: {
  /** 묶음 이름 — 한 화면에 주소가 둘이면(점포 주소 · 사업자주소) 안쪽 칸 이름에도 붙여 화면 낭독기가 가르게 한다 */
  label?: string;
  /** 라벨 뒤 붉은 * */
  required?: boolean;
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  /** 상세주소 칸 오류 문구 — 칸 바로 아래에 보인다 */
  detailError?: string;
  /** 검색 목록에서 주소를 고른 순간 — 고른 줄 그대로 받는다(점포 주소가 위도 · 경도를 채우는 데 쓴다) */
  onChoose?: (item: AddressItem) => void;
}) {
  const listId = useId();
  // 기본 묶음(주소)은 안쪽 칸 이름을 그대로 두고, 다른 묶음은 앞에 묶음 이름을 붙인다(사업자주소 우편번호 …)
  const prefix = label === "주소" ? "" : `${label} `;
  const box = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AddressItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [failure, setFailure] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  /** 결과를 받은 검색어. 지금 칸의 글자와 다르면 아직 찾는 중이다(0.3초 쉬는 동안 포함). */
  const [searched, setSearched] = useState("");
  const [searching, startSearching] = useTransition();
  // 늦게 온 이전 검색 결과가 새 결과를 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  const search = (text: string, nextPage: number) => {
    const mine = ++requestNumber.current;
    startSearching(async () => {
      const result = await searchAddressAction(text, nextPage).catch((error: unknown) => {
        // 연결 끊김 · 배포가 어긋나 액션을 못 찾음 등 — 사용자 문구는 하나지만 원인은 남긴다
        console.error("주소 검색 호출 실패", error);
        return { ok: false as const, message: "주소 검색 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== requestNumber.current) return;
      setSearched(text);
      if (!result.ok) {
        setFailure(result.message);
        // 앞 검색어의 목록이 보이지 않게 남아 Enter · ↑↓ 로 골라지지 않도록 비운다
        setItems([]);
        setTotal(0);
        setActive(-1);
        return;
      }
      setFailure(null);
      setTotal(result.total);
      setPage(nextPage);
      setItems((prev) => (nextPage === 1 ? result.items : [...prev, ...result.items]));
      if (nextPage === 1) setActive(result.items.length ? 0 : -1);
    });
  };

  // 치는 동안은 쉬었다가 한 번만 부른다. 두 글자 미만이면 부르지 않는다.
  useEffect(() => {
    const text = keyword.trim();
    if (text.length < 2) return;
    const timer = setTimeout(() => search(text, 1), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (item: AddressItem) => {
    // 상세주소는 앞 주소의 것이라 비운다(동 · 호수가 새 주소에 그대로 붙으면 틀린 주소가 된다)
    onChange({ zipCode: item.zipCode, address: item.roadAddress, addressDetail: "" });
    onChoose?.(item);
    setOpen(false);
    setKeyword("");
    setItems([]);
    setTotal(0);
    // 다음에 적을 것은 상세주소다
    requestAnimationFrame(() => detail.current?.focus());
  };

  const showLayer = open && keyword.trim().length >= 2;
  /** 보이는 목록이 지금 검색어의 것인가. 아니면(0.3초 쉬는 중 · 받는 중) 흐리게 두고 Enter 로 고르지 못하게 한다 */
  const current = searched === keyword.trim();
  const listShown = showLayer && !failure && items.length > 0;

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">{label}{required && <RequiredMark />}</span>
      <div
        ref={box}
        className="relative"
        // Tab 등으로 포커스가 층 밖으로 나가면 닫는다 — 열린 층(data-dismiss-open)이 남으면 어느 패널도 Esc 로 닫히지 않는다
        onBlur={(e) => {
          if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <SearchField
          value={keyword}
          onValueChange={(next) => {
            setKeyword(next);
            setOpen(true);
            setFailure(null);
            if (next.trim().length < 2) {
              requestNumber.current++;
              setItems([]);
              setTotal(0);
            }
          }}
          // 돋보기 · Enter(고른 줄이 없을 때) — 쉬는 시간 없이 바로 찾는다
          onSearch={(text) => {
            if (text.trim().length < 2) return;
            setOpen(true);
            search(text.trim(), 1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && showLayer) {
              // 슬라이드 패널까지 닫히지 않게 한다(slide-panel.tsx 는 preventDefault 된 Esc 를 넘긴다)
              e.preventDefault();
              setOpen(false);
            } else if (e.key === "ArrowDown" && items.length) {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp" && items.length) {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && !e.nativeEvent.isComposing && listShown && current && items[active]) {
              e.preventDefault();
              choose(items[active]);
            }
            // 그 밖의 Enter(이전 검색어의 흐린 목록 · 목록 없음)는 막지 않는다 — SearchField 가 onSearch 로 바로 찾는다
          }}
          placeholder="도로명, 건물명, 지번으로 검색"
          aria-label={`${label} 검색어`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showLayer}
          // 목록이 그려져 있을 때만 가리킨다 — 없는 id 를 가리키면 화면 낭독기가 헤맨다
          aria-controls={listShown ? listId : undefined}
          aria-activedescendant={listShown && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={80}
        />
        {showLayer && (
          <div
            // 열려 있는 동안 Esc 가 이 층부터 닫도록 슬라이드 패널에 알린다(slide-panel.tsx 의 data-dismiss-open 규칙)
            data-dismiss-open=""
            className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white py-[6px] text-[14px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
          >
            {failure ? (
              <p className="px-[12px] py-[8px] text-erp-off">{failure}</p>
            ) : items.length === 0 ? (
              <p className="px-[12px] py-[8px] text-erp-muted">
                {searching || searched !== keyword.trim() ? "찾는 중입니다." : "검색 결과가 없습니다. 도로명 · 건물명 · 지번을 더 자세히 입력해 주세요."}
              </p>
            ) : (
              <>
                <ul
                  id={listId}
                  role="listbox"
                  aria-label={`${label} 검색 결과`}
                  aria-busy={!current || undefined}
                  className={`transition-opacity duration-150 motion-reduce:transition-none ${current ? "" : "opacity-50"}`}
                >
                  {items.map((item, i) => (
                    <li
                      // 같은 도로명에 지번만 다른 줄이 있어 주소로는 겹친다. 목록은 뒤에 붙기만 하므로 순번으로 충분하다
                      key={i}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      // 누르는 동안 검색칸이 포커스를 잃어 층이 닫히지 않게 한다
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={`flex cursor-pointer flex-col gap-[2px] px-[12px] py-[8px] ${i === active ? "bg-erp-thead-bg" : ""}`}
                    >
                      <span className="flex gap-[8px] text-erp-ink">
                        <span className="shrink-0 text-erp-label">{item.zipCode}</span>
                        <span>
                          {item.roadAddress}
                          {item.buildingName && !item.roadAddress.includes(item.buildingName) && <span className="text-erp-label"> ({item.buildingName})</span>}
                        </span>
                      </span>
                      <span className="pl-[48px] text-[13px] text-erp-label">지번 {item.jibunAddress}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-erp-divider px-[12px] pt-[8px] text-[13px] text-erp-label">
                  <span>
                    {total.toLocaleString("ko-KR")}건 중 {items.length.toLocaleString("ko-KR")}건
                  </span>
                  {items.length < total && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => search(keyword.trim(), page + 1)}
                      disabled={searching}
                      className="text-erp-ink hover:underline disabled:opacity-40"
                    >
                      더 보기
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-[6px]">
        <div className="w-[120px] shrink-0">
          <TextField value={value.zipCode} readOnly placeholder="우편번호" aria-label={`${prefix}우편번호`} />
        </div>
        <TextField value={value.address} readOnly placeholder="검색해서 고르면 채워집니다" aria-label={`${prefix}기본주소`} />
        {(value.zipCode || value.address || value.addressDetail) && (
          <Button variant="off" onClick={() => onChange({ zipCode: "", address: "", addressDetail: "" })}>
            지우기
          </Button>
        )}
      </div>
      <TextField
        ref={detail}
        value={value.addressDetail}
        onChange={(e) => onChange({ ...value, addressDetail: e.target.value })}
        maxLength={100}
        // 상세주소는 기본주소에 딸린 값이라 주소를 고르기 전에는 막는다(예전 데이터처럼 값이 이미 있으면 고칠 수 있게 연다)
        disabled={!value.address && !value.addressDetail}
        placeholder={value.address ? "상세주소" : "주소를 검색해 고른 뒤 적습니다"}
        aria-label={`${prefix}상세주소`}
        aria-invalid={detailError ? true : undefined}
        aria-describedby={detailError ? `${listId}-detail-error` : undefined}
      />
      {detailError && (
        <p id={`${listId}-detail-error`} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
          {detailError}
        </p>
      )}
    </div>
  );
}
