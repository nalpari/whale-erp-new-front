import { headers } from "next/headers";

/**
 * 로그인 전 화면과 강제 비밀번호 변경처럼 api 가 사용자 IP 를 쓰는 서버 액션이 api 로 보낼 머리말. 사용자 IP 를 X-Forwarded-For 로
 * 넘긴다 — 넘기지 않으면 api 가 이 Next 서버의 주소로 세어, 모든 사용자가 요청 제한의 IP 칸 하나를 나눠 쓰고(한도에 닿으면 모두 429),
 * api 가 IP 를 남기는 기록(로그인 이력, 회원가입 · 강제 비밀번호 변경의 약관 동의)에도 이 서버 주소가 남는다.
 * Next 는 이 머리말이 없으면 소켓 주소로 채우지만, 있으면 그대로 둔다. 그래서 Next 앞에 이 머리말을 덧붙이거나
 * 덮어쓰는 프록시(로드밸런서)가 반드시 있어야 한다 — Next 가 인터넷에 바로 노출되면 브라우저가 지어 보낸 값이 api 까지
 * 가, IP 한도를 피하고 약관 동의 기록의 IP 를 지어낼 수 있다. api 는 TRUST_PROXY 에 적은 프록시(이 서버)를 믿을 때만 이 값을 쓴다.
 */
export async function apiHeaders(): Promise<Record<string, string>> {
  return { "Content-Type": "application/json", ...(await forwardedForHeader()) };
}

/** 이 요청의 사용자 IP 머리말만. 로그인한 화면의 api 호출(api.ts 의 authHeaders)도 이것을 싣는다 — 믿는 조건은 위와 같다. */
export async function forwardedForHeader(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor ? { "X-Forwarded-For": forwardedFor } : {};
}
