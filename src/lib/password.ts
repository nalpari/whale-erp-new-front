// 새 비밀번호 조건 안내(비밀번호 정책 PL-QSBSYY). 입력 중에는 충족 여부만 보이고, 오류 문구는 api 의 message 를 그대로 쓴다.
// 「발급받은 비밀번호와 다름」은 받은 값을 화면이 모르므로 api 만 판정한다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

// 허용 특수문자: ! @ # $ % ^ & * ( ) - _ = + [ ] { } ? (공백 불가)
const ALLOWED = /^[A-Za-z\d!@#$%^&*()\-_=+[\]{}?]*$/;
const SPECIAL = /[!@#$%^&*()\-_=+[\]{}?]/;

export function passwordChecks(password: string, loginId: string) {
  return [
    {
      label: "영문·숫자·특수문자 각 1자 이상 8~20자",
      met:
        password.length >= 8 &&
        password.length <= 20 &&
        ALLOWED.test(password) &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password) &&
        SPECIAL.test(password),
    },
    { label: "아이디와 다름", met: password !== "" && password.toLowerCase() !== loginId.toLowerCase() },
  ];
}
