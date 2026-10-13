// 브라우저에서 api 를 부를 때 쓴다. /api/* (src/app/api/[...path]/route.ts)가 토큰을 붙여 대신 부른다.

export class BffError extends Error {
  constructor(
    /** 0 은 연결 실패 */
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function bff<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { cache: "no-store" });
  } catch {
    throw new BffError(0, "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
  }
  if (response.ok) return (await response.json()) as T;
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  throw new BffError(response.status, typeof message === "string" ? message : `요청이 실패했습니다 (HTTP ${response.status})`);
}
