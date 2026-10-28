"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_TTL_MS,
  ApiError,
  DEVICE_COOKIE,
  deviceCookie,
  deviceIdOf,
  loginKeyCookie,
  request,
  sessionCookie,
  type AdminLoginResponse,
} from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";
import { apiHeaders } from "@/lib/forwarded-headers";

export type LoginFormState = { error?: string };

/**
 * api 로그인 → 쿠키 → 권한 유형별 홈. 실패 문구는 api 가 정한 것을 그대로 보인다(없는 아이디·불일치·탈퇴는 같은 문구, 미사용·잠금은 따로).
 * 강제 비밀번호 변경 여부(isPasswordChangeRequired)는 SessionGate 가 login-info 로 보고 팝업을 띄운다.
 */
export async function login(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) return { error: "아이디와 비밀번호를 입력해 주세요" };

  const jar = await cookies();
  const deviceId = deviceIdOf(jar.get(DEVICE_COOKIE)?.value);
  jar.set(deviceCookie(deviceId));

  let res: AdminLoginResponse;
  try {
    res = await request<AdminLoginResponse>("/auth/admin/login", {
      method: "POST",
      // 사용자 IP 를 넘긴다(로그인 이력의 접속 IP · IP 한도) — 이유와 전제는 apiHeaders() 참고.
      headers: await apiHeaders(),
      body: JSON.stringify({ loginId, password, deviceInformation: deviceId }),
    });
  } catch (e) {
    // 4xx 는 api 문구 그대로, 5xx·연결 실패는 인증 결과가 아니고 Nest 문구도 영어라 연결 문구로 바꾼다.
    // api 스로틀러 429 문구는 영어 기본값이다. api 에서 바꾸면 직원 앱 문구도 바뀌므로 여기서만 바꾼다(잠금 429 는 api 의 한글 문구 그대로).
    if (e instanceof ApiError && e.status === 429 && e.message.startsWith("ThrottlerException"))
      return { error: "요청이 많습니다. 잠시 뒤 다시 시도해 주세요" };
    if (e instanceof ApiError && e.status < 500) return { error: e.message };
    console.error(e);
    return { error: "로그인 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  }

  // 200 인데 계정이 없으면 세션을 만들 수 없다. 오류 화면 대신 폼에 연결 문구를 보인다.
  if (!res?.accessToken || !res.account?.roleTypeCode) {
    console.error("로그인 응답에 토큰·계정이 없습니다", res);
    return { error: "로그인 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  }
  jar.set(
    sessionCookie({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
      roleTypeCode: res.account.roleTypeCode,
      bpCodeId: res.account.bp?.bpCodeId,
    }),
  );
  // 새 값이면 브라우저에 남은 앞 로그인의 메뉴·점포·공통코드를 버리고 login-info 를 다시 받는다(SessionGate). 같은 계정이 다시 로그인해도 갈린다.
  jar.set(loginKeyCookie(crypto.randomUUID()));
  // redirect 는 try 밖에서 — 안에서 부르면 catch 가 이동 신호를 오류로 삼킨다.
  redirect(homeOf(res.account.roleTypeCode));
}
