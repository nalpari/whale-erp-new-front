import { Button } from "@/components/common";
import { ApiError } from "@/lib/api";

// 커뮤니티 관리 목록을 불러오다 실패하면 목록 자리에 문장을 보인다. 권한 없음(401 · 403)은 다시 해도 같아 다시 시도를 두지 않는다.

export type Loaded<T> = { data: T } | { failure: string; denied: boolean };

export async function loadList<T>(what: string, load: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { data: await load() };
  } catch (error) {
    const denied = error instanceof ApiError && (error.status === 401 || error.status === 403);
    if (!denied) console.error(`${what} 목록 조회 실패`, error);
    const object = `${what}${hasFinal(what) ? "을" : "를"}`;
    return { failure: denied ? `${object} 볼 권한이 없습니다.` : `${object} 불러오지 못했습니다.`, denied };
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
