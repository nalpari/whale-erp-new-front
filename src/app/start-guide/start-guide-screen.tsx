"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GuideIcon } from "@/components/common";
import {
  useAccount,
  useCurrentBp,
  useMenus,
  useScope,
  useService,
  useStores,
} from "@/components/site/session-gate";
import { bpPath, isBpPathScreen } from "@/lib/bp-path";
import { menuOfPath } from "@/lib/menus";
import { withScope } from "@/lib/store-scope";
import {
  GUIDE_STEPS,
  TRACK_LABEL,
  guideDetailOf,
  guideHref,
  initialTrackOf,
  isGuideTrack,
  stepNumberOf,
  tracksOf,
  type GuidePart,
  type GuideStep,
  type GuideTrack,
} from "@/lib/start-guide";
import { underlined } from "./guide-mini-card";
import { GuideMock } from "./guide-mocks";

// 시작 가이드 본문 — 왼쪽 단계 목록(헤더 [시작 가이드] 목록과 같은 모양, 고른 단계만 연파랑 바탕) + 오른쪽 단계 설명(2026-11-11 사용자 지정).
// 진행 막대는 두지 않는다 — 끝냈는지 알 수 있는 단계가 점포 등록 하나뿐이라 막대가 늘 1단계에 멈춰 보인다(사용자 지정). 끝낸 단계는 「완료」 표시만.
// 화면 예시는 실제 화면 캡처가 아니라 단순한 그림이다 — 화면을 고칠 때마다 다시 찍지 않게(사용자 지정, guide-mocks.tsx).
export function StartGuideScreen() {
  const account = useAccount();
  const params = useSearchParams();
  const tracks = tracksOf(account.roleTypeCode);
  const asked = params.get("track");
  // 주소의 갈래가 이 역할이 볼 수 없는 것이면(가맹 역할이 본사 주소로 들어옴) 처음 값으로 둔다
  const track: GuideTrack =
    isGuideTrack(asked) && tracks.includes(asked)
      ? asked
      : initialTrackOf(account.roleTypeCode);
  const steps = GUIDE_STEPS[track];
  const numbers = steps.filter((s) => !s.sub).map(stepNumberOf);
  const step = numbers.includes(params.get("step") ?? "")
    ? (params.get("step") as string)
    : numbers[0];
  const at = numbers.indexOf(step);
  const prev = at > 0 ? numbers[at - 1] : null;
  const next = at < numbers.length - 1 ? numbers[at + 1] : null;
  const titleOf = (n: string) =>
    steps.find((s) => !s.sub && stepNumberOf(s) === n)?.title ?? "";

  return (
    // 화면은 스크롤하지 않는다 — 왼쪽 목록은 그 자리에 두고, 오른쪽 설명 안에서만 스크롤하며 이전 · 다음 단계 줄은 아래에 고정이다(2026-11-11 사용자 지정)
    <div className="flex min-h-0 flex-1 p-[24px]">
      <div className="flex min-h-0 flex-1 gap-[12px]">
        <aside
          aria-label="단계 목록"
          className="max-h-full w-[300px] shrink-0 self-start overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[16px]"
        >
          {tracks.length > 1 && (
            // 밑줄 탭 — 헤더 [시작 가이드] 목록과 같다(고른 칸 파랑 600 + 2px 밑줄)
            <div
              role="tablist"
              aria-label="운영 형태"
              className="mb-[10px] grid grid-cols-2 border-b border-erp-thead-line"
            >
              {tracks.map((t) => (
                <Link
                  key={t}
                  href={guideHref(t)}
                  scroll={false}
                  role="tab"
                  aria-selected={track === t}
                  className={`-mb-px flex h-[36px] items-center justify-center border-b-2 text-[14px] transition-[border-color,color] duration-150 ease-out ${track === t ? "border-erp-point font-semibold text-erp-point" : "border-transparent font-medium text-erp-label hover:text-erp-ink"}`}
                >
                  {TRACK_LABEL[t]}
                </Link>
              ))}
            </div>
          )}
          <ol className="flex flex-col gap-[2px]">
            {steps.map((s) => (
              <li key={`${track}-${s.label}`}>
                <StepLink
                  track={track}
                  step={s}
                  current={!s.sub && stepNumberOf(s) === step}
                />
              </li>
            ))}
          </ol>
        </aside>
        <StepDetail
          key={`${track}-${step}`}
          track={track}
          step={
            steps.find((s) => !s.sub && stepNumberOf(s) === step) as GuideStep
          }
          prev={
            prev
              ? {
                  href: guideHref(track, prev),
                  label: `STEP ${prev}`,
                  title: titleOf(prev),
                }
              : null
          }
          next={
            next
              ? {
                  href: guideHref(track, next),
                  label: `STEP ${next}`,
                  title: titleOf(next),
                }
              : null
          }
        />
      </div>
    </div>
  );
}

/** 왼쪽 목록 한 줄 — 헤더 목록의 StepRow 와 같은 모양. 하위 단계는 그 단계 설명의 칸으로 간다 */
function StepLink({
  track,
  step,
  current,
}: {
  track: GuideTrack;
  step: GuideStep;
  current: boolean;
}) {
  const stores = useStores();
  const done = step.doneWhen === "stores" && stores.length > 0;
  const n = stepNumberOf(step);
  return (
    <Link
      href={guideHref(track, n, step.sub ? step.label : undefined)}
      scroll={!!step.sub}
      aria-current={current ? "step" : undefined}
      className={`flex w-full items-center gap-[10px] rounded-[4px] py-[7px] ${step.sub ? "pl-[20px]" : "pl-[6px]"} pr-[10px] text-left text-erp-ink transition-colors duration-150 ease-out ${current ? "bg-erp-point-bg" : "hover:bg-erp-point-subtle"}`}
    >
      <span
        className={`flex h-[20px] w-[52px] shrink-0 items-center justify-center rounded-full font-semibold ${step.sub ? "text-[12px] text-erp-label" : `text-[11px] tracking-[0.02em] ${current ? "bg-erp-point text-white" : "bg-erp-point-bg text-erp-point"}`}`}
      >
        {step.label}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-[6px]">
        {/* 긴 제목은 정해 둔 자리(
)에서 꺾는다 — 괄호 · 「·」 한가운데서 꺾여 읽기 어려웠다(2026-11-11 사용자 지정). 다른 자리(제목 줄 · 이전/다음 · 미니 카드)에서는 
 이 빈칸이다 */}
        <span className={`whitespace-pre-line ${step.sub ? "text-[13px]" : "text-[14px] font-medium"}`}>
          {step.title}
        </span>
        {step.optional && <OptionalTag />}
      </span>
      {done && <DoneMark />}
    </Link>
  );
}

function OptionalTag() {
  return (
    <span className="shrink-0 rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] text-[12px] text-erp-sub">
      선택
    </span>
  );
}

/** 끝낸 단계 — 파랑 동그라미 체크 + 「완료」(색만으로 말하지 않는다). 헤더 목록과 같다 */
function DoneMark() {
  return (
    <span className="flex shrink-0 items-center gap-[4px] text-[12px] font-semibold text-erp-point">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="var(--color-erp-point)" />
        <path
          d="M4.6 8.2l2.2 2.2 4.6-4.7"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      완료
    </span>
  );
}

type PagerLink = { href: string; label: string; title: string };

function StepDetail({
  track,
  step,
  prev,
  next,
}: {
  track: GuideTrack;
  step: GuideStep;
  prev: PagerLink | null;
  next: PagerLink | null;
}) {
  const detail = guideDetailOf(track, stepNumberOf(step));
  return (
    <section
      aria-label={`${step.label} 설명`}
      className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[4px] border border-erp-panel-line bg-white"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-[28px] overflow-y-auto px-[32px] py-[28px]">
        {/* 설명 한 줄(15px · 줄간 1.7)은 글자 아래 줄간 여백이 남아, 같은 28px 간격인데 아래 상자까지가 상자 → 따라 할 칸보다 넓어 보였다. 그 여백(약 6px)만큼 당겨 두 간격을 맞춘다(2026-11-11 사용자 지정 — 넓은 쪽을 줄였다) */}
        <div className="-mb-[6px] flex flex-col gap-[10px]">
          {/* STEP 꼬리표는 제목 앞 같은 줄에 둔다 — 제목 위 따로 한 줄을 차지해 자리만 먹었다(2026-11-11 사용자 지정) */}
          <h2 className="flex items-center gap-[10px] text-[22px] font-semibold text-erp-ink">
            <span className="flex h-[22px] w-[56px] shrink-0 items-center justify-center rounded-full bg-erp-point-bg text-[12px] font-semibold tracking-[0.02em] text-erp-point">
              {step.label}
            </span>
            {step.title}
            {step.optional && <OptionalTag />}
          </h2>
          {/* 한 줄 설명은 폭을 막지 않는다 — 70자에서 꺾여 두 줄이 되는 것이 어색했다(2026-11-11 사용자 지정). 화면이 좁으면 그때만 꺾인다 */}
          <p className="text-[15px] leading-[1.7] text-erp-sub">
            {detail.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {[
            { title: "이럴 때 필요해요", body: detail.when },
            { title: "먼저 확인해 주세요", body: detail.need },
          ].map((c) => (
            <div
              key={c.title}
              className="flex flex-col gap-[4px] rounded-[4px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[14px]"
            >
              <b className="text-[16px] font-semibold text-erp-ink">
                {c.title}
              </b>
              {/* 문구 안 줄바꿈(\n)은 그대로 꺾는다(2026-11-11 사용자 지정) */}
              <span className="whitespace-pre-line text-[15px] leading-[1.6] text-erp-sub">{c.body}</span>
            </div>
          ))}
        </div>
        {/* 「이 순서로 진행해 주세요」 제목은 뺐다 — 칸마다 제목과 번호 매긴 순서가 있어 같은 말이었다(2026-11-11 사용자 지정) */}
        {/* 칸 사이 32px — 글 칸 바탕 · 테두리를 빼서 16px 로는 앞 칸 글과 다음 칸 그림이 붙어 보였다(2026-11-11 사용자 지정) */}
        <div className="flex flex-col gap-[32px]">
          {detail.parts.map((part) => (
            <PartCard key={part.title} part={part} guide={`${track}-${stepNumberOf(step)}`} />
          ))}
        </div>
      </div>
      {(prev || next) && (
        <nav
          aria-label="단계 이동"
          // 이전 · 다음을 반씩 나눠 줄을 꽉 채운다(토스 쇼핑 판매자 가이드처럼, 2026-11-11 사용자 지정). 한쪽만 있으면(첫 · 마지막 단계) 그 하나가 줄 전체를 쓴다
          className={`grid shrink-0 gap-[12px] border-t border-erp-thead-line px-[32px] py-[16px] ${prev && next ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {prev && <Pager link={prev} dir="prev" />}
          {next && <Pager link={next} dir="next" />}
        </nav>
      )}
    </section>
  );
}

/** 따라 할 칸 하나 — 왼쪽 화면 예시 그림, 오른쪽 순서 · 안내 · [화면으로 가기](2026-11-11 사용자 지정 — 전엔 글이 왼쪽). 읽는 순서는 글이 먼저라 DOM 은 그대로 두고 그림 칸만 order-first 로 앞에 그린다 */
function PartCard({ part, guide }: { part: GuidePart; guide: string }) {
  return (
    // 글 칸과 그림 칸을 반씩 — 그림이 380px 일 때 너무 작았다(2026-11-11 사용자 지정)
    <article
      id={part.label ? `part-${part.label}` : undefined}
      // 테두리는 칸마다 따로 둔다 — 그림 칸만 사방을 진하게 두르려면 바깥 틀 테두리와 겹쳐 두 줄이 되지 않아야 한다(2026-11-11 사용자 지정)
      className="grid scroll-mt-[24px] grid-cols-2 gap-[32px]"
    >
      {/* 그림과 글 사이는 칸 사이와 같은 32px(틀의 gap), 글 칸은 위 24px 만 — 그림 칸 안쪽 위 여백(24px)과 같아 제목이 그림 속 화면 첫 줄 높이에서 시작한다. 테두리 윗선에 맞추니 너무 올라 붙어 보였다(2026-11-11 사용자 지정) */}
      {/* 글 칸은 바탕 · 테두리 없이 흰 화면에 바로 — 그림 칸(진한 테두리) 하나만 상자로 남겨 그림이 주인공이 되게, 위 회청 안내 상자와도 갈린다.
          (회청 바탕 + 테두리도 써 봤지만 상자가 이어져 무거웠다, 2026-11-11 사용자 지정) */}
      <div className="flex min-w-0 flex-col gap-[10px] pt-[24px]">
        {/* 번호(2-1 등)는 제목 앞 같은 줄에 — 위 따로 한 줄을 차지했다(2026-11-11 사용자 지정) */}
        <h4 className="flex items-baseline gap-[8px] text-[18px] font-semibold text-erp-ink">
          {part.label && <span className="text-erp-point">{part.label}</span>}
          {part.title}
        </h4>
        <ol className="flex list-decimal flex-col gap-[4px] pl-[20px] text-[15px] leading-[1.6] text-erp-ink">
          {/* 순서 안의 줄바꿈(\n)은 그대로 꺾는다(2026-11-11 사용자 지정) */}
          {part.actions.map((a) => (
            <li key={a} className="whitespace-pre-line">
              {underlined(a)}
            </li>
          ))}
        </ol>
        {/* 안내가 여럿이면(빈 줄 \n\n) 안내마다 느낌표 하나씩, 안내 안의 \n 은 그 자리에서 꺾는다(2026-11-11 사용자 지정) */}
        {part.tip?.split("\n\n").map((t) => (
          <p key={t} className="flex items-start gap-[6px] whitespace-pre-line text-[15px] leading-[1.6] font-medium text-erp-ink">
            {/* 15px · 줄 높이 24px 의 첫 줄 가운데에 아이콘(14px)을 맞춘다 — offset 3px + 2px */}
            <span className="mt-[2px] flex shrink-0">
              <GuideIcon offset />
            </span>
            {t}
          </p>
        ))}
        {part.path && <GoButton path={part.path} guide={guide} />}
      </div>
      {/* 그림은 11px 기준으로 그려 1.36배(글자 15px — 왼쪽 본문과 같은 크기)로 키운다. zoom 이라 칸 높이도 함께 늘어난다. 폭은 520px 까지 넓혀 그림 자체는 크게 둔다(2026-11-11 사용자 지정 — 글자 크기가 칸마다 제각각이었다) */}
      {/* 그림 칸 자체를 관리자 화면으로 보고 요소를 실제 화면 색 그대로 바로 놓는다 — 회색 칸 안 흰 상자(상자 안 상자)를 없앴다. 남색 바탕도 해 봤지만 실제 화면 색이 나았다(2026-11-11 사용자 지정) */}
      {/* 화면이라는 게 보이게 그림 칸만 사방 테두리를 진하고 굵게(2px · 헤더 1depth 메뉴 줄 색 erp-nav #282f37 — 1px 테두리 규칙의 예외, 2026-11-11 사용자 지정) */}
      <div
        aria-hidden="true"
        className="order-first flex items-center justify-center rounded-[4px] border-2 border-erp-nav bg-white px-[20px] py-[24px]"
      >
        <div className="flex w-full max-w-[520px] justify-center [zoom:1.36]">
          <GuideMock kind={part.mock} />
        </div>
      </div>
    </article>
  );
}

/**
 * [OOO로 가기] — 이름은 그 화면의 메뉴 이름(menuOfPath)이다. 조회 권한이 없으면 흐리게 두고 누를 수 없다(헤더 목록이 그랬던 것과 같다).
 * 메뉴 이름을 못 찾으면(권한 없음) 「화면으로 가기」. 지금 범위(?scope=)를 싣는다 — 헤더 메뉴 · 홈 카드와 같다.
 */
function GoButton({ path, guide }: { path: string; guide: string }) {
  const menus = useMenus();
  const service = useService();
  const bp = useCurrentBp().bpCodeId;
  const [scope] = useScope();
  const menu = menuOfPath(
    menus,
    path === "/stores/new" ? "/stores" : path,
    service,
  );
  const allowed = !!menu && (path !== "/stores/new" || menu.permission.create);
  const label =
    path === "/stores/new"
      ? "점포 등록으로 가기"
      : menu
        ? `${withRo(menu.name)} 가기`
        : "화면으로 가기";
  const cls =
    "mt-[4px] inline-flex h-[34px] items-center gap-[6px] self-start rounded-[2px] border border-erp-brand bg-white px-[16px] text-[15px] font-medium text-erp-ink";
  if (!allowed)
    return (
      <span
        className={`${cls} cursor-not-allowed opacity-40`}
        title="이 메뉴의 권한이 없습니다."
      >
        {label} ›
      </span>
    );
  const href = withScope(isBpPathScreen(path) ? bpPath(bp, path) : path, scope);
  // ?guide=<갈래>-<단계> 를 붙여 넘어간 화면에 가이드 미니 카드(guide-mini-card.tsx)를 띄운다(2026-11-11 사용자 지정)
  const withGuide = `${href}${href.includes("?") ? "&" : "?"}guide=${guide}`;
  return (
    <Link
      href={withGuide}
      className={`${cls} transition-colors duration-150 ease-out hover:bg-erp-subtle`}
    >
      {label} ›
    </Link>
  );
}


/** 「으로 · 로」 — 받침이 없거나 ㄹ 받침이면 「로」(점포 정보 관리로 · 근무스케줄 관리로) */
function withRo(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const jong = code >= 0 && code <= 11171 ? code % 28 : 0;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
}

function Pager({ link, dir }: { link: PagerLink; dir: "prev" | "next" }) {
  return (
    <Link
      href={link.href}
      scroll={false}
      // 이전 · 다음 단계 — 칸 폭을 꽉 채우고, 꺾쇠는 바깥쪽 가운데에 따로 둔다(2026-11-11 사용자 지정 — 전엔 360px 고정 · 꺾쇠가 글자에 붙음)
      className={`flex min-w-0 items-center gap-[16px] rounded-[4px] border border-erp-panel-line px-[22px] py-[16px] text-erp-ink transition-colors duration-150 ease-out hover:border-erp-point hover:bg-erp-point-subtle ${dir === "next" ? "flex-row-reverse text-right" : ""}`}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[18px] shrink-0 text-erp-label">
        <path
          d={dir === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <small className="text-[15px] font-medium text-erp-point">
          {dir === "prev" ? "이전 단계" : "다음 단계"}
        </small>
        {/* 단계 번호(STEP N)는 빼고 제목만 — 번호는 왼쪽 단계 목록이 보여 준다(2026-11-11 사용자 지정) */}
        <span className="truncate text-[18px] font-semibold">{link.title}</span>
      </span>
    </Link>
  );
}
