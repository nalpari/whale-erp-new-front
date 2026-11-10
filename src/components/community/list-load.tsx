import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/common";
import { ApiError } from "@/lib/api";

// 커뮤니티 관리 목록을 불러오다 실패하면 목록 자리에 문장을 보인다. 권한 없음(403)은 다시 해도 같아 다시 시도를 두지 않는다.
// 로그인 만료는 request() 가 로그인 화면으로 보낸다 — 그 이동 신호는 삼키지 않는다(unstable_rethrow).

export type Loaded<T> = { data: T } | { failure: string; denied: boolean };

export async function loadList<T>(what: string, load: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { data: await load() };
  } catch (error) {
    unstable_rethrow(error);
    const object = `${what}${hasFinal(what) ? "을" : "를"}`;
    if (error instanceof ApiError && error.status === 403) return { failure: `${object} 볼 권한이 없습니다.`, denied: true };
    console.error(`${what} 목록 조회 실패`, error);
    return { failure: `${object} 불러오지 못했습니다.`, denied: false };
  }
}

/**
 * 0건이면 조건 없이 한 번 더 물어 「아예 없음(all)」과 「조건에 맞는 것이 없음(filtered)」을 가른다 — 다른 목록과 같은 빈 문구 규칙(DESIGN.md 표 · 빈 문구).
 * 지금 조회가 이미 조건 없음이면 다시 묻지 않는다. 묻지 못하면 「조건에 맞는 …」으로 둔다(2026-11-06 사용자 지정).
 */
export async function emptyKindOf(total: number, filtered: boolean, probe: () => Promise<{ total: number }>): Promise<"all" | "filtered"> {
  if (total > 0) return "filtered";
  if (!filtered) return "all";
  try {
    return (await probe()).total > 0 ? "filtered" : "all";
  } catch (error) {
    unstable_rethrow(error); // 로그인 만료 이동(request())은 삼키지 않는다
    console.error("빈 목록 구분 조회 실패", error);
    return "filtered";
  }
}

/** 마지막 글자에 받침이 있는가. 한글이 아니면(FAQ) 받침 없음으로 읽는다. */
function hasFinal(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0;
}

export function ListFailure({ failure, denied, retryHref }: { failure: string; denied: boolean; retryHref: string }) {
  return (
    <div className="flex min-h-0 flex-1 p-[24px]">
      <main className="flex flex-1 flex-col items-center gap-[16px] rounded-[4px] border border-erp-panel-line bg-white py-[80px] text-[14px] text-erp-muted">
        <p>{failure}</p>
        {!denied && (
          <Button variant="off" href={retryHref}>
            다시 시도
          </Button>
        )}
      </main>
    </div>
  );
}
