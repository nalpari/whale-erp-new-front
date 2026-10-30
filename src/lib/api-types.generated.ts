// 자동 생성 파일 — 손으로 고치지 않는다. pnpm openapi:types 로 다시 만든다.
// 원본: whale-erp-api openapi/openapi.json (0.0.1)

export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AppController_getHello"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * whale-erp-staff(직원 근무 앱) 로그인.
         *
         *     같은 계정에 연속으로 5번 틀리면 5분 동안 잠기고(다섯 번째 시도도 429), 잠긴 동안은 비밀번호가 맞아도 429 와
         *     해제 시각(`lockExpiresAt`)을 준다. 없는 계정 · 탈퇴 계정은 실패를 세지 않아 401 이다(요청 제한의 429 는 별개다).
         */
        post: operations["AccountAuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 액세스 토큰 재발급. 갱신 토큰은 회전하지 않으므로 쓰던 것을 계속 쓴다.
         *     갱신할 때마다 접속 상태의 만료가 지금부터 30일(자동 로그인을 끈 접속은 7일) 뒤로 밀린다. 만료되었거나
         *     종료된 접속이면 401 이고, 앱은 로그인 화면으로 보낸다.
         *
         *     요청 제한: 갱신 토큰마다 10분에 10번, IP 는 1분에 600번(throttle.ts).
         */
        post: operations["AccountAuthController_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 로그인한 계정의 지금 정보. 로그인 응답의 account 와 같은 모양이다. 로그인 뒤 관리자가
         *     가입 연결 보류를 풀거나 이메일이 바뀌어도 다시 로그인하지 않고 알 수 있게, 앱이 열릴 때 부른다.
         *
         *     요청 제한을 받지 않는다. 다른 인증된 API 처럼 가드가 접속 상태를 확인하고, scrypt 도 없는
         *     읽기 하나다. 토큰 축(10분 10번)을 그대로 두면 앱을 자주 여는 사용자가 막힌다.
         *     축 이름을 모두 적어야 한다 — 인자 없는 @SkipThrottle() 은 'default' 만 건너뛴다.
         */
        get: operations["AccountAuthController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 이 기기의 접속 상태를 종료한다. 다른 기기는 그대로다. */
        post: operations["AccountAuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/password-reset-pins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 비밀번호 재설정 핀을 이메일로 보낸다. 그 이메일에 맞는 계정이 없어도, 직전 발급 뒤 1분이
         *     안 지났거나 하루 10번을 채웠어도 똑같이 204 로 답한다 — 응답이 갈리면 가입 여부가 드러난다.
         *     새 핀을 받으면 이전 핀은 바로 무효가 되고, 핀은 낸 시각부터 10분 동안 유효하다.
         *
         *     핀을 보낼 수 없는 환경(운영에 발송기가 연결되지 않음)에서는 계정과 상관없이 503 이다.
         */
        post: operations["PasswordResetController_requestPin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/password-reset-pins/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 핀이 맞는지만 확인한다. 맞으면 204 이고 앱은 새 비밀번호 화면으로 넘어간다. 틀림 · 만료 · 5회로
         *     닫힘 · 없음은 모두 같은 메시지의 401 이다. 5번 틀리면 그 핀은 닫혀(그 뒤로는 맞아도 401) 새 핀을 받아야 한다.
         */
        post: operations["PasswordResetController_verifyPin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 새 비밀번호를 정한다. 확인에 쓴 핀을 다시 보내고 서버가 다시 검증한다. 맞으면 비밀번호를 바꾸고
         *     핀을 소진하며, 모든 기기의 접속을 끊고 로그인 잠금을 푼다. 핀이 맞고 아직 쓸 수 있는데 규칙에
         *     어긋나면 400 과 사유를 주고, 핀은 소진하지 않고 횟수도 올리지 않는다. 핀이 틀리거나 닫혔으면
         *     규칙과 상관없이 401 이다.
         */
        post: operations["PasswordResetController_resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/email-find-attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 이름 · 휴대전화번호 · 생년월일로 로그인 이메일을 찾는다(WHALEERP-178). 계정의 본인인증 값과 모두 맞으면
         *     가린 이메일 목록을 준다. 찾은 이메일을 메일이나 문자로 보내지 않는다.
         *
         *     맞는 계정이 없으면 어느 값이 틀렸든 같은 메시지의 404 다. 같은 휴대전화번호로 5번 틀리면 5분 동안 막히고,
         *     막힌 동안은 값이 맞아도 429 와 해제 시각(`lockExpiresAt`)을 준다. 풀리거나 성공하면 횟수는 0 이 된다.
         */
        post: operations["EmailFindController_find"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/password-reset-links/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 관리자 초기화 재설정 링크가 쓸 수 있는지 확인한다(WHALEERP-172). 화면을 열 때 무효한 링크 안내를 먼저 보이려고
         *     쓴다. 소진하지 않는다.
         */
        post: operations["PasswordResetLinkController_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/password-reset-links/reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 링크로 새 비밀번호를 정한다. 지금 비밀번호는 묻지 않는다. 성공하면 남은 링크 · 핀을 닫고 모든 기기의 접속을
         *     끊으며 로그인 잠금을 푼다.
         */
        post: operations["PasswordResetLinkController_reset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/password-reset-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 재설정 링크를 보낸다. 앞서 보낸 링크와 핀은 무효가 된다. 응답의 시각으로 「보낸 시각 · 기한」을 그린다. */
        post: operations["PasswordResetLinkAdminController_issue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 관리자 웹 로그인. 잠금 → 아이디 · 비밀번호 → 계정 상태 순으로 판정한다. 잠김 429, 미사용 403. */
        post: operations["AdminAuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/temporary-passwords": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 비밀번호 찾기. 이름 · 아이디 · 이메일이 모두 맞는 사용 중 계정에 임시 비밀번호(1시간)를 메일로 보낸다.
         *     받으면 잠금이 풀리고, 그 비밀번호로 들어오면 강제 변경 대상이다.
         */
        post: operations["AdminAuthController_issueTemporaryPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/login-id-find-attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 아이디 찾기. 이름 · 이메일이 맞는 사용 중 계정의 아이디를 가려서 준다(메일로 보내지 않는다). 맞는 계정이
         *     없거나 미사용 · 탈퇴 · 삭제 계정과만 맞으면 같은 문구의 404 다.
         */
        post: operations["AdminAuthController_findLoginId"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 접근 토큰 재발급. 세션은 마지막 사용부터 1시간으로 밀린다. 만료 · 종료 · 미사용 계정이면 401. */
        post: operations["AdminAuthController_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/signup-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 가입 완료 화면의 「웨일ERP 시작하기」. 비밀번호 없이 signupToken(가입 응답, 10분)으로 로그인 접속을
         *     낸다. 토큰이 만료·위조됐거나 그 사이 계정 상태가 바뀌면 401 · 403 — front 는 로그인 화면으로 보낸다.
         */
        post: operations["AdminAuthController_signupSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 이 브라우저의 세션을 종료한다. 다른 브라우저는 그대로다. */
        post: operations["AdminAuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/login-info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 화면을 그릴 정보 — 계정 · 메뉴(+권한) · 관리 점포 · 공통코드. 부르는 시점의 값이다. 관리자 웹은 로그인
         *     직후 한 번 받아 쓰고, 바뀐 값은 다시 로그인할 때 받는다. 업무 API 의 판정은 요청마다 현재 값으로 한다.
         */
        get: operations["AdminAuthController_getLoginInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 관리 점포만 — 로그인 정보의 `stores` 와 같은 목록을 `{ items, total }` 로. 관리자 웹이 점포 목록 버전
         *     (`GET /bp-codes/:id/stores-version`)이 바뀌었을 때 메뉴 · 공통코드 없이 점포만 다시 받는다. 버전 경로와 같이
         *     강제 비밀번호 변경 중에는 403 이다 — 그동안은 팝업만 열려 점포를 다시 받을 화면이 없다. 플랫폼 계정은 빈 목록,
         *     없거나 삭제된 계정은 401.
         */
        get: operations["AdminAuthController_getMyStores"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/password-change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 강제 비밀번호 변경 — 초기 · 임시 비밀번호로 들어온 계정이 새 비밀번호를 정한다. 현재 비밀번호는 묻지 않는다.
         *     정책 위반은 400 과 정책 문구 하나, 약관이 필요한 계정이 동의하지 않으면 400, 대상이 아니면 409, 로그인에 쓴
         *     비밀번호가 만료됐으면 401. 바꿔도 모든 기기의 로그인은 이어진다. 끝나기 전에는 이 경로 · 로그인 정보 ·
         *     로그아웃 말고는 403 이다.
         */
        post: operations["AdminAuthController_changeRequiredPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 마이페이지 내 정보 (S-JXKHCM). 플랫폼 · BP 여섯 역할 모두 쓴다. AllowPasswordChangePending 을
         *     달지 않는다 — 강제 비밀번호 변경 대상이면 이 경로도 403 이다(위 changeRequiredPassword 주석과 같다).
         */
        get: operations["AdminAuthController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 내 기본정보 저장 — 이름 · 연락처 · 이메일만. 이메일을 바꿔도 지금 비밀번호는 보지 않는다
         *     (S-JXKHCM 사용자 결정, 2026-10-23 — 서비스 update 주석 참고). 이메일이 다른 관리자 계정과 겹치면 409.
         *     계정 축 기본 추적은 본문의 email 로 센다(throttle.ts accountTracker) — 저장할 새 이메일을
         *     호출자가 그대로 고를 수 있어, 매번 다른 값을 보내면 버킷을 계속 새로 만들어 계정 한도를
         *     비울 수 있었다(코드 리뷰로 찾음, 2026-10-21). my-profile.controller.ts 의 비밀번호 · 이메일
         *     변경과 같이 signedInUserTracker 로 로그인한 계정 자신으로 고정한다.
         */
        patch: operations["AdminAuthController_updateProfile"];
        trace?: never;
    };
    "/auth/admin/me/password-change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 내 비밀번호 변경(마이페이지, 1팀 S-PTWREE). 현재 비밀번호를 확인한 뒤 새 비밀번호로 바꾼다. 강제 비밀번호
         *     변경(POST password-change)과 달리 로그인한 상태에서 스스로 비밀번호를 아는 채로 바꾸는 것이라
         *     AllowPasswordChangePending 을 달지 않는다 — 강제 변경 대상이면 이 경로도 403 이다(updateProfile 과
         *     같다). 바꿔도 이 기기 · 다른 기기의 로그인은 모두 이어진다(서비스 주석 참고).
         */
        post: operations["AdminAuthController_changeMyPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/password-verifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 현재 비밀번호 확인(마이페이지 회원 탈퇴 1단계, S-JHQQNR). 맞아야 front 가 탈퇴 화면을 연다 — 맞으면 204, 틀리면
         *     400. 로그인한 관리자 아무나 받는다(지금은 탈퇴에서만 쓰지만 다른 확인에도 쓸 수 있게). 탈퇴 실행의 비밀번호
         *     확인은 그대로 둔다(이중 확인). 비밀번호를 받는 경로라 내 비밀번호 변경 · 탈퇴 실행과 같은 한도를 건다.
         */
        post: operations["AdminAuthController_verifyMyPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/withdraw-eligibility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 회원 탈퇴 조건 조회(마이페이지, S-JHQQNR). 탈퇴 버튼을 누르기 전에 보여줄 영향 범위 — BP명 · 함께 탈퇴될
         *     하위 관리자 수 · 함께 강제 폐점될 점포 수 · 가로막는 진행 중 계약 여부. BP 마스터만 받는다 — 그 밖의
         *     권한은 403, 계정이 지워졌으면 404. 조회만 하고 실제 탈퇴는 하지 않는다.
         */
        get: operations["AdminAuthController_getWithdrawEligibility"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/withdraw": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 회원 탈퇴 실행(마이페이지, S-JHQQNR). BP 마스터가 현재 비밀번호와 사유를 보내면 본인 · 같은 BP 의 하위 관리자가
         *     모두 탈퇴하고 점포는 모두 폐점된다. 진행 중인 근로계약이 있으면 막는다(조건 조회와 같은 기준). 비밀번호를
         *     받는 경로라 내 비밀번호 변경과 같은 한도를 건다.
         */
        post: operations["AdminAuthController_withdraw"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/email-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 이메일 중복 확인 — 칸을 벗어나거나 Enter 를 칠 때 부른다. 원래 이메일 그대로면 화면이 부르지 않는다.
         *     중복 확인 경로는 한도를 끄지 않는다 — 가입(admin-signup)의 같은 종류 경로도 기본 한도를 그대로
         *     쓰기로 정했다(api #37 머지, 2026-10-15). SkipThrottle 을 달았던 것을 걷는다(코드 리뷰로 찾음,
         *     2026-10-21) — 이 경로는 다른 관리자 계정의 이메일 등록 여부를 그대로 알려줘 한도까지 꺼두면
         *     플랫폼 전체를 대상으로 쓸어볼 수 있다. GET 이라 본문이 없어 기본 계정 축(AUTH_THROTTLERS)은
         *     Bearer 토큰으로 센다(10분 10건, 토큰은 15분마다 바뀌어 매번 새 버킷) — IP 축(분당 60건)만
         *     걸린다던 주석은 틀렸었다(코드 리뷰로 찾음). 정상 사용자가 10분 안에 11번 넘게 고쳐 볼 일은
         *     드물다고 보고 지금은 그대로 둔다.
         */
        get: operations["AdminAuthController_checkProfileEmail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/me/bp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 BP 사업자정보(마이페이지, S-UOJVUR). BP 마스터만 받는다 — 그 밖의 권한은 403, 계정이 지워졌으면
         *     404. GET me 와 같이 인증된 조회라 한도를 끈다(코드 리뷰로 찾음, 2026-10-22 — 탭 전환·저장 뒤
         *     재조회가 로그인성 한도에 걸릴 수 있었다).
         */
        get: operations["AdminAuthController_getBpProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 바로 고칠 수 있는 항목 저장(상호명 · 대표자 연락처 · 대표자 이메일 · 사업장주소 · 업태 · 종목).
         *     사업자등록번호 · 대표자명 · 개업일자는 여기 보내지 않는다 — business-verification 이 돌려준
         *     businessVerificationToken 을 이 PATCH 에 실어야 그 세 값이 바뀐다(검사와 저장이 나뉜 두 단계).
         *     clearBusinessVerification 을 true 로 보내면 그 세 값과 인증일시를 지운다(점포와 달리 BP 자신은
         *     지울 수 있다, 2026-10-23 사용자 결정) — businessVerificationToken 과 함께 보내면 400.
         *     계정 축은 PATCH me 와 같이 signedInUserTracker 로 로그인한 계정 자신으로 고정한다(코드 리뷰로
         *     찾음, 2026-10-22).
         */
        patch: operations["AdminAuthController_updateBpProfile"];
        trace?: never;
    };
    "/auth/admin/me/bp/business-verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 사업자 번호 인증 — 검사만(최초 · 재인증 공통). 다른 BP · 점포가 쓰는 번호면 409, 국세청과 다르면 422,
         *     국세청 연동 장애면 503. 저장은 하지 않는다 — 받은 토큰을 PATCH /me/bp 의 businessVerificationToken 으로
         *     보내야 사업자등록번호 · 대표자명 · 개업일자 · 인증일시가 반영된다(점포 사업자정보와 같은 패턴, 2026-10-22).
         *     IP · 계정마다 시간당 10건 — 점포 사업자정보 인증(stores.controller.ts)과 같은 기준이다. 국세청을 실제로
         *     부르는 횟수는 BpProfileService 가 관리자별로 따로 센다(countNtsCall, StoreManagementService 와 같은
         *     방식) — 국세청 키 · 하루 할당량을 모든 BP 가 함께 쓰므로, 한 관리자가 반복해 부르면 그날 모든 BP 의
         *     가입 · 점포 · 마이페이지 인증이 503 이 된다(코드 리뷰로 찾음, 2026-10-22 — 점포 쪽에만 있던 보호가
         *     빠져 있었다).
         */
        post: operations["AdminAuthController_requestBpBusinessVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-code-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 플랫폼 BP 의 공통코드. `groups` 를 주면 그 그룹만, 없으면 전체. 사용 중인 그룹 · 상세만, 표시 순서대로.
         *     부를 때의 현재 값이다 — 화면이 열릴 때 불러 쓴다.
         */
        get: operations["CodesController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * BP 회원가입. BP 와 BP 마스터 계정을 함께 만들고, 메일 설정이 있으면 가입 완료 메일을 보낸다(메일이
         *     없거나 실패해도 가입은 완료다). 아이디·이메일이 이미 쓰이면 409 다.
         */
        post: operations["AdminSignupController_signup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/signup/login-id-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 아이디 중복 확인. 탈퇴·삭제한 계정의 아이디도 쓸 수 없다. */
        post: operations["AdminSignupController_loginIdAvailability"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/signup/business-verifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminSignupController_businessVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/signup/email-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 이메일 중복 확인. 탈퇴·삭제한 계정의 이메일은 다시 쓸 수 있다. */
        post: operations["AdminSignupController_emailAvailability"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/enums": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnumsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/enums/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnumsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/code-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 공통코드 그룹 목록. 플랫폼고정 · 플랫폼제공 그룹을 표시 순서대로, 그룹 코드 · 그룹명 검색(부분 일치). */
        get: operations["CodeGroupsController_listGroups"];
        /** 그룹 수정. 기존 그룹 여러 개를 한 번에 — 하나라도 없으면 아무것도 고치지 않는다. */
        put: operations["CodeGroupsController_updateGroups"];
        /** 그룹 등록. 새 그룹 여러 개를 한 번에 — 하나라도 막히면 아무것도 생기지 않는다. */
        post: operations["CodeGroupsController_createGroups"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/code-groups/{groupCode}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 고른 그룹의 상세 코드(플랫폼 원본). BP전용 코드는 나오지 않는다. */
        get: operations["CodeGroupsController_listItems"];
        /** 상세 코드 수정. 기존 코드 여러 개를 한 번에 — 하나라도 없으면 아무것도 고치지 않는다. */
        put: operations["CodeGroupsController_updateItems"];
        /** 상세 코드 등록. 새 코드 여러 개를 한 번에 — 하나라도 막히면 아무것도 생기지 않는다. */
        post: operations["CodeGroupsController_createItems"];
        /**
         * 상세 코드 삭제(논리) — 플랫폼제공 그룹만, 여러 개를 한 번에, 하나라도 막히면 아무것도 지우지 않는다. 플랫폼 원본만
         *     지우고 BP 에 복사된 행은 건드리지 않는다. 플랫폼고정 그룹은 시스템이 값을 참조해 409(사용 상태로 관리). 같은 코드로 다시 등록하면 되살아난다 — 단 어느 BP 에 복사본이 살아 있으면 등록이 409 다.
         */
        delete: operations["CodeGroupsController_deleteItems"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/code-groups/{groupCode}/bp-application": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * BP에 적용. 플랫폼제공 그룹만. 각 BP 에 아직 없는 행만 넣는다 — 다시 눌러도 된다.
         *     되돌릴 수 없지만 행을 지우지 않고 그룹의 적용 여부를 바꾸는 동작이라 수정 권한으로 본다.
         */
        post: operations["CodeGroupsController_applyToBps"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 대상 BP 의 BP 관리자 · 가맹 마스터 · 가맹 관리자, 등록일시 최신순. 가맹 쪽은 본인과 점포가 겹치는 가맹 관리자만. */
        get: operations["BpAdminsController_list"];
        put?: never;
        /** 등록. 늘 사용으로 만들고 1시간짜리 초기 비밀번호를 메일로만 보낸다. 메일이 실패해도 계정은 남는다. */
        post: operations["BpAdminsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/role-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 권한 그룹 선택지(목록 필터 · 등록 · 수정). `:id` 보다 먼저 둔다. */
        get: operations["BpAdminsController_roleGroups"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/store-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 점포 선택지. 고를 수 있는 점포만 준다 — 폐점과, 가맹 마스터라면 다른 가맹 마스터 담당 점포는 빠진다. */
        get: operations["BpAdminsController_storeOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/login-id-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 아이디 중복 확인. 등록 화면이 칸을 벗어나거나 Enter 를 칠 때 묻는다. 등록 권한이 필요하다. */
        get: operations["BpAdminsController_loginIdAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/email-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 이메일 중복 확인. 아이디와 같은 때(칸을 벗어나거나 Enter) 묻는다. 등록 권한이 필요하다. 소문자로 맞춰 본다. */
        get: operations["BpAdminsController_emailAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세. 버튼 판정(actions)을 함께 준다. 볼 수 없는 계정 · BP 마스터 · 다른 BP 계정은 404. */
        get: operations["BpAdminsController_detail"];
        /** 수정. 상세에서 받은 updatedAt 을 함께 보낸다 — 그 사이 다른 사람이 고쳤으면 409. */
        put: operations["BpAdminsController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/{id}/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 변경 이력. 최신순. */
        get: operations["BpAdminsController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/{id}/update-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 가맹 마스터 저장 전 확인창의 수 — 함께 미사용이 되는 · 점포 매핑이 빠지는 가맹 관리자. */
        get: operations["BpAdminsController_updateImpact"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-admins/{id}/password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 비밀번호 초기화. 새 1시간짜리 임시 비밀번호를 그 계정 이메일로만 보내고 잠금을 푼다. 미사용 계정도 된다.
         *     응답의 updatedAt 으로 다음 수정을 저장한다 — 초기화가 그 값을 올린다.
         */
        post: operations["BpAdminsController_resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-code-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 그룹 목록 — 사용 중인 플랫폼제공 그룹(적용 여부와 관계없이), 표시 순서대로. 플랫폼고정 · 사용중지 그룹은 items · total 에서 빠진다. */
        get: operations["BpCodeGroupsController_listGroups"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-code-groups/{groupCode}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 고른 플랫폼제공 그룹의 상세 코드 — 이 BP 의 행(BP전용 포함). 플랫폼고정 · 사용중지 그룹은 404. */
        get: operations["BpCodeGroupsController_listItems"];
        /** 상세 코드 수정 — 이 BP 의 행 여러 개를 한 번에. 하나라도 막히면 아무것도 고치지 않는다. */
        put: operations["BpCodeGroupsController_updateItems"];
        /** 상세 코드 등록 — BP전용 코드 여러 개를 한 번에. 하나라도 막히면 아무것도 생기지 않는다. */
        post: operations["BpCodeGroupsController_createItems"];
        /** 상세 코드 삭제(논리) — 이 BP 의 행(BP전용 · 복사된 플랫폼제공) 여러 개를 한 번에. 하나라도 막히면 아무것도 지우지 않는다. */
        delete: operations["BpCodeGroupsController_deleteItems"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 지우지 않은 플랫폼 마스터 · 플랫폼 관리자, 등록일시 최신순. */
        get: operations["PlatformAdminsController_list"];
        put?: never;
        /** 등록. 늘 사용으로 만들고 1시간짜리 초기 비밀번호를 메일로만 보낸다. */
        post: operations["PlatformAdminsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/role-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 사용자 권한 선택지. 플랫폼 관리자에게는 플랫폼 마스터 권한을 빼고 준다.
         *     `purpose=filter` 는 목록 필터 「권한명」용 — 호출자와 상관없이 PM · PA 그룹을 다 준다.
         */
        get: operations["PlatformAdminsController_roleGroups"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/login-id-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 아이디 중복 확인. 등록 화면이 칸을 벗어나거나 Enter 를 칠 때 묻는다. 등록 권한이 필요하다.
         *     `:id` 보다 먼저 둔다 — 뒤에 두면 이 경로가 상세(:id)로 잡힌다.
         */
        get: operations["PlatformAdminsController_loginIdAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/email-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 이메일 중복 확인. 아이디 확인과 같은 등록 권한이고, 판정은 등록의 409 와 같다. `:id` 보다 먼저 둔다. */
        get: operations["PlatformAdminsController_emailAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세. 지운 · 탈퇴한 계정과 BP 쪽 계정은 404. */
        get: operations["PlatformAdminsController_detail"];
        /** 수정. 상세에서 받은 updatedAt 을 함께 보낸다 — 그 사이 다른 사람이 고쳤으면 409. */
        put: operations["PlatformAdminsController_update"];
        post?: never;
        /** 계정 삭제(논리 삭제). 되살리지 않는다. */
        delete: operations["PlatformAdminsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/{id}/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 생성 · 변경 이력. 최신순. */
        get: operations["PlatformAdminsController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-admins/{id}/password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 비밀번호 초기화. 새 1시간짜리 초기 비밀번호를 그 계정 이메일로만 보낸다. 수정 권한이 필요하다.
         *     응답의 updatedAt 으로 다음 수정을 저장한다 — 초기화가 그 값을 올린다.
         */
        post: operations["PlatformAdminsController_resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록 — 권한 코드 순(BA 다음 FA), 쪽 나눔. creatableRoleTypeCode 는 역할로 정한 등록 유형이다. */
        get: operations["BpRoleGroupsController_list"];
        put?: never;
        /** 등록 — BM 은 BA, FM 은 FA(관리계정 = 본인). 유형은 받지 않는다. */
        post: operations["BpRoleGroupsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups/franchise-master/menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 가맹마스터 보기 — FM000001 메뉴 트리, 모든 칸 읽기 전용. 가맹 관리자는 403. `:id` 보다 먼저 둔다. */
        get: operations["BpRoleGroupsController_franchiseMasterMenus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세 — 역할로 고칠 수 있는지 · 지울 수 있는지와 막힌 이유. */
        get: operations["BpRoleGroupsController_detail"];
        /** 권한명 · 설명 수정. 상세의 updatedAt 을 함께 보낸다 — 그 사이 고쳐졌으면 409. */
        put: operations["BpRoleGroupsController_update"];
        post?: never;
        /** 삭제(논리 삭제). 연결 사용자가 있으면 대체 그룹으로 옮긴 뒤 지운다. 지운 권한 코드는 다시 쓰지 않는다. */
        delete: operations["BpRoleGroupsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups/{id}/menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 메뉴 등록 팝업의 트리 — WHALE_ERP 메뉴, 칸마다 현재 값 · 바꿀 수 있는지 · 막힌 이유. */
        get: operations["BpRoleGroupsController_menus"];
        /** 메뉴 권한 저장 — 메뉴별 네 칸 + updatedAt. 응답의 updatedAt 으로 다음 저장을 한다. */
        put: operations["BpRoleGroupsController_saveMenus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups/{id}/menus/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 회수 미리보기 — 꺼지는 칸과 이 그룹의 관리자 수. 하위 그룹이 없어 affectedRoleGroupCount 는 0. 쓰지 않는다. 저장과
         *     같은 400 검사만 하고 역할 · 본인 연결 · updatedAt 은 보지 않는다.
         */
        post: operations["BpRoleGroupsController_previewMenus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-role-groups/{id}/deletion-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 삭제 대화상자 — 옮길 연결 사용자와 대체 후보(같은 BP · 유형 · 관리계정). */
        get: operations["BpRoleGroupsController_deletionCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-role-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 고정 권한(PM · PA · BM · FM 순, 시드는 PA 없이 셋) 다음 플랫폼 관리자 추가 권한을 코드 순으로, 페이지 없이. */
        get: operations["PlatformRoleGroupsController_list"];
        put?: never;
        /** 등록 — 플랫폼 관리자(PA) 추가 권한. 권한 코드는 PA + 6자리로 채번한다. */
        post: operations["PlatformRoleGroupsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-role-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세. 권한명 · 설명을 고칠 수 있는지 · 지울 수 있는지와 막힌 이유를 함께 준다. */
        get: operations["PlatformRoleGroupsController_detail"];
        /** 권한명 · 설명 수정. 상세에서 받은 updatedAt 을 함께 보낸다 — 그 사이 다른 사람이 고쳤으면 409. */
        put: operations["PlatformRoleGroupsController_update"];
        post?: never;
        /**
         * 삭제 — 플랫폼 관리자 추가 권한만(논리 삭제). 연결 사용자가 있으면 대체 권한으로 한꺼번에 옮긴 뒤 지운다.
         *     지운 권한 코드는 다시 쓰지 않는다.
         */
        delete: operations["PlatformRoleGroupsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-role-groups/{id}/menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 메뉴 등록 팝업의 트리 — 사용 중 서비스별, 칸마다 현재 값 · 바꿀 수 있는지 · 막힌 이유. */
        get: operations["PlatformRoleGroupsController_menus"];
        /**
         * 메뉴 권한 저장. 메뉴별 네 칸 목록 + updatedAt. BP · 가맹 마스터에서 끈 칸은 모든 BP 의 BA · FA 그룹에서도
         *     함께 꺼진다. 응답의 updatedAt 으로 다음 저장을 한다.
         */
        put: operations["PlatformRoleGroupsController_saveMenus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-role-groups/{id}/menus/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 회수 미리보기 — 저장할 목록으로 꺼지는 칸 · 함께 빠지는 하위 권한 그룹 · 연결 사용자를 센다. 쓰지 않는다. */
        post: operations["PlatformRoleGroupsController_previewMenus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-role-groups/{id}/deletion-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 삭제 대화상자 — 옮길 연결 사용자와 대체 권한 후보. */
        get: operations["PlatformRoleGroupsController_deletionCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-menus/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 서비스 탭 — 공통코드 SERVICE 전부(사용중지 포함)와 서비스별 메뉴 수(사용 · 미사용). */
        get: operations["PlatformMenusController_services"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 서비스 하나의 메뉴 트리 — 페이지 · 검색 없이 전부, 형제 순서대로 중첩. */
        get: operations["PlatformMenusController_tree"];
        put?: never;
        /** 메뉴 등록 — 고른 상위(없으면 최상위)의 맨 끝에. 코드는 저장할 때 채번하고, 플랫폼 마스터 권한 행을 함께 넣는다. */
        post: operations["PlatformMenusController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-menus/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 메뉴 상세. */
        get: operations["PlatformMenusController_detail"];
        /** 노출 메뉴명 · URL · 사용 상태 저장 — 통째로 바꾼다(URL 을 빼면 비운다). */
        put: operations["PlatformMenusController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-menus/{id}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 위치 옮기기 — 같은 서비스 안에서, 하위가 함께 간다. 옮길 때마다 바로 저장된다. 어느 메뉴의 updatedAt · 수정자도
         *     바꾸지 않아, 열어 둔 상세는 다시 불러오지 않고 저장해도 된다.
         */
        post: operations["PlatformMenusController_move"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-holidays": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 공식 휴일 — 월을 주면 그 달(캘린더), 없으면 그 해 전체(목록). 날짜순, 페이지 없이. */
        get: operations["PublicHolidaysController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-codes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 플랫폼 계정이 고를 고객 BP — 서비스 바로가기 「웨일ERP」의 BP 선택. 미삭제 고객 BP 를 사용 · 미사용 · 탈퇴 모두
         *     최신 등록순으로 나눠 준다. withMaster 면 BP 마스터 계정이 있는 BP 만(BP 마스터 계정 목록과 같은 범위 · 순서). 사용 중인 플랫폼 관리자(PM · PA)만 부르고, 그 밖의 관리자 · 직원 앱은 403.
         */
        get: operations["BpCodesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-codes/{bpCodeId}/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 그 BP 의 점포 전체 — 점포 선택 목록. 선택 목록이라 나눠 주지 않는다. 플랫폼 관리자(PM · PA)는 어느 고객 BP 든,
         *     BP · 가맹 관리자는 자기 BP 만, 직원 앱은 가입 · 재직 중인 점포가 있는 BP 만이다. 볼 수 없는 BP 는 없는 BP 와
         *     같이 404 — 다른 BP 가 있는지 드러내지 않는다. 플랫폼 BP 도 404. 사용 중인 관리자 계정이 아니면 403.
         *     shortcut: 페이지 없이 전부 준다, 한 BP 의 점포가 수백을 넘으면 page · pageSize 를 붙인다.
         */
        get: operations["BpCodesController_findStores"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-codes/{bpCodeId}/stores-version": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 그 BP 점포 목록의 버전 — 관리자 웹이 새로고침 · 메뉴 이동 · 창 포커스 때 버전만 묻고, 바뀌었을 때만 점포 목록
         *     (자기 BP 는 `GET /auth/admin/me/stores`, 연 BP 는 위 점포 목록)을 다시 받는다 — 버전을 먼저 받고 목록을 받는다.
         *     여러 PC 에서 같은 계정으로 쓸 때 다른 PC 의 점포 등록 · 수정 · 폐점 · 삭제와 담당 점포 매핑 · 관리 범위 변경을
         *     잡는다(BP · 가맹 관리자만 매핑 · 범위까지). 볼 수 있는 BP 와 오류는 점포 목록과 같다(bpStoresAccess) — 볼 수 없는
         *     BP · 플랫폼 BP 는 404, 사용 중인 관리자 계정이 아니면 403(판정 뒤 버전을 만드는 사이에 바뀌어도).
         */
        get: operations["BpCodesController_findStoresVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-codes/{bpCodeId}/code-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 그 BP 가 보는 공통코드 — 공개 `GET /public-code-items` 와 같은 `groups` · 응답 모양. 부를 때의 현재 값이다.
         *     볼 수 있는 BP 는 점포 목록과 같다(bpStoresAccess) — 플랫폼 관리자는 어느 BP 든, BP · 가맹 관리자는 자기 BP 만,
         *     직원 앱은 가입 · 재직 중인 점포가 있는 BP 만. 볼 수 없는 BP 는 없는 BP 와 같이 404, 사용 중인 관리자 계정이
         *     아니면 403.
         */
        get: operations["BpCodesController_findCodeItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 고객 BP, 등록 일시 최신순. */
        get: operations["BpMastersController_list"];
        put?: never;
        /** 등록. BP 와 BP 마스터 계정을 함께 만들고 1시간짜리 초기 비밀번호를 메일로만 보낸다. */
        post: operations["BpMastersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/excel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 엑셀(xlsx). 목록과 같은 조건으로 전부, 연락처 · 대표자 연락처는 가운데 자리를 가린다. 공통 엑셀 규칙을 따른다 —
         *     1만 건 미만은 바로 파일(200), 이상은 예약 생성(202, 등록한 이메일로 링크). 같은 사람 · 같은 화면은 생성 중이면 409, 1분에
         *     한 번(429). `:id` 보다 먼저 둔다.
         */
        get: operations["BpMastersController_excel"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/login-id-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 아이디 중복 확인. 등록 권한이 필요하다. `:id` 보다 먼저 둔다. */
        get: operations["BpMastersController_loginIdAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/email-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 이메일 중복 확인. 아이디 확인과 같은 등록 권한이다. `:id` 보다 먼저 둔다. */
        get: operations["BpMastersController_emailAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/business-verifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 사업자 진위확인 — 검사만 하고 10분짜리 토큰을 준다. 등록 · 수정 저장에 실어야 반영된다.
         *     국세청 키 · 하루 할당량을 모든 BP 가 함께 쓰므로 IP · 계정마다 시간당 10건(점포 · 가입과 같다).
         */
        post: operations["BpMastersController_verifyBusiness"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세. 탈퇴한 BP 도 보인다(개인정보는 null). */
        get: operations["BpMastersController_detail"];
        /** 수정. 마지막 저장이 남는다(동시 수정 확인 없음). */
        put: operations["BpMastersController_update"];
        post?: never;
        /** 삭제(논리 삭제) — 오등록만. 상세의 deletion 조건을 서버에서 다시 본다. */
        delete: operations["BpMastersController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/{id}/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 변경 이력 — BP 와 BP 마스터 계정의 이력을 합쳐 최신순. 탈퇴한 BP 는 409(이력에 탈퇴 전 개인정보가 남아 있다). */
        get: operations["BpMastersController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 상태 변경(사용 ↔ 미사용). 미사용이면 그 BP 의 관리자 계정 전부가 함께 미사용이 된다. */
        post: operations["BpMastersController_changeStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-masters/{id}/password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 비밀번호 초기화. 새 1시간짜리 비밀번호를 BP 마스터 이메일로만 보낸다. 수정 권한이 필요하다. */
        post: operations["BpMastersController_resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/excel-downloads/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내려받기 주소(5분). 받은 시각을 이력에 남긴다. */
        get: operations["ExcelDownloadsController_download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-terms-versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 지금 시행 중인 약관 유형마다 한 건, 공통코드 `TERMS_TYPE` 순서대로. 본문은 없다. */
        get: operations["TermsVersionsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-terms-versions/{termsTypeCode}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 그 유형의 지금 시행 중인 약관과 본문(Markdown). */
        get: operations["TermsVersionsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/bulk-exports/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 담을 직원 수(재직 · 퇴직)와 범위 점포 수. 0 이면 화면이 요청 버튼을 끈다 */
        get: operations["BulkExportsController_preview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/bulk-exports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 볼 수 있는 요청 — 같은 BP · 같은 권한 유형이고 요청의 점포를 모두 관리하는 마스터. 최근 순 */
        get: operations["BulkExportsController_list"];
        put?: never;
        /** 요청. 1분 배치가 만든다 */
        post: operations["BulkExportsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/bulk-exports/{id}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 5분짜리 내려받기 주소. 내려받기 이력을 남긴다 */
        post: operations["BulkExportsController_download"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StaffMembersController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 직원 기본 정보. 목록 한 줄에 계정 이메일을 더한 모양이다. 없는 직원 · 관리 범위 밖 · 가려지는
         *     직원(본사 제공 동의 없는 가맹 점포 직원)은 모두 같은 404 다 — 퇴직 처리와 같은 규칙이다. 그래서 isMasked 는 늘
         *     false 다.
         */
        get: operations["StaffMembersController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/summary/contracts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 근로계약 영역 — 가장 최근 계약의 유형 · 기간 · 상태 · 최근 발송일 · 갱신 예정일 · 신고 정보의 급여 계좌(전체 번호, 가리지 않음). 근로계약 관리 조회 권한 */
        get: operations["StaffMemberSummaryController_contract"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/summary/work-schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 근무스케줄 영역 — 한 주(월~일)의 근무스케줄과 주간 근무시간. 근무스케줄 관리 조회 권한 */
        get: operations["StaffMemberSummaryController_workSchedules"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/summary/payslips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 급여명세서 영역 — 최근 명세서 3건 · 미발송 건수. 급여명세서 관리 조회 권한 */
        get: operations["StaffMemberSummaryController_payslips"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/summary/send-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 발송 이력 영역 — 근로계약이 보낸 가입 초대 · 소속 추가 확인 요청(재발송 포함)의 결과 · 실패 사유 · 재시도 가능 여부, 최근 순
         *     (WHALEERP-136). 근로계약 관리 조회 권한
         */
        get: operations["StaffMemberSummaryController_sendLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/summary/todos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** TO-DO 영역 — 전체 · 완료 · 미완료 건수와 최근 처리 이력. TO-DO 관리 조회 권한 */
        get: operations["StaffMemberSummaryController_todos"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/work-schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 이 직원의 근무스케줄 — 기간 필터 · 페이지. 근무일 내림차순, 같은 날은 시작 시각 순 */
        get: operations["StaffMemberWorkSchedulesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/retirement-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 퇴직이 확정될 때 정리될 근무스케줄 · 개인 TO-DO · 대기 계약. 확인창에 보여 준다. */
        get: operations["RetirementController_preview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/retirement": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 퇴직일 변경. 퇴직 예정이고 퇴직일 전날까지만 된다(그 밖은 409). */
        put: operations["RetirementController_changeDate"];
        /**
         * 퇴직 처리. 퇴직일만 저장하고 재직으로 둔다(퇴직 예정). 계약은 바꾸지 않는다. 퇴직일 다음 날 0시 배치가
         *     퇴직으로 바꾸며 정리하고, 지난 날짜면 지금 바로 정리한다. 가입 전 · 이미 퇴직 · 이미 퇴직 예정이면 409.
         */
        post: operations["RetirementController_retire"];
        /** 퇴직 취소. 퇴직 예정이고 퇴직일 전날까지만 된다(그 밖은 409). */
        delete: operations["RetirementController_cancel"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/staff-members/{id}/birth-date": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * 직원 생년월일 정정
         * @description 가입 때 잘못 넣은 생년월일을 관리자가 확인해 정정한다(WHALEERP-602). 직원 레코드의 계정 생년월일을 바꾸므로 같은 사람의 다른 BP 소속에도 같이 바뀐다. 계약서에 적힌 생년월일은 바꾸지 않고, 날인 대기 중인 계약이 있어도 막지 않는다. 날인 대기 계약은 날인 때 계약서 생년월일과 계정 생년월일을 다시 대조하므로 정정으로 대조가 풀릴 수도 있고(보통) 새로 어긋날 수도 있다(계정 하나라 다른 BP 의 계약도 같다). 정정은 계정 변경 이력(BIRTH_DATE · ADMIN_CORRECTION)에 남는다. 오류 응답은 `code` 로 가른다.
         */
        put: operations["StaffBirthDateController_correct"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PayslipsController_findAll"];
        put?: never;
        /** 직원 한 명의 초안. */
        post: operations["PayslipsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 점포 하나 · 급여 월 하나의 요약(로그인 후 홈 점포 하나 화면 직원 급여 카드, WHALEERP-621). `:id` 보다 먼저 선언해야
         *     한다.
         */
        get: operations["PayslipsController_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 작성 대상 — 그 달(1일 ~ 말일) 관리 범위 직원의 유효 계약 · 이미 있는 명세서 · 출퇴근 기록 유무. `:id` 보다 먼저
         *     선언해야 한다.
         */
        get: operations["PayslipsController_candidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 관리 범위 작성 대상 모두의 초안. 이미 있음 · 계약 없음은 건너뛰고 skipped 에 담는다. */
        post: operations["PayslipsController_bulkCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 그 달 확정 명세서 일괄 발송(목록 「확정 N건 발송」). 일부가 실패해도 보낸 것은 그대로이고 실패 대상을 이유와 함께 돌려준다. */
        post: operations["PayslipsController_sendMany"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/additional-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 「항목 추가」로 붙일 수 있는 추가 공제(사용 중인 급여 항목). `:id` 보다 먼저 선언해야 한다. */
        get: operations["PayslipsController_additionalItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 없는 명세서 · 관리 범위 밖 · 가려지는 명세서(본사 제공 동의 없는 가맹 점포 직원)는 모두 같은 404 다. */
        get: operations["PayslipsController_findOne"];
        /** 임시저장 — 금액 · 가산 · 3.3% · 추가 공제 붙이기 · 떼기. 상태는 그대로이고 상세를 돌려준다. */
        put: operations["PayslipsController_save"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/previous-values": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 같은 직원의 지난 명세서 값(공제 · 관리자가 넣는 지급). 화면이 칸을 채울 뿐 저장하지 않는다. */
        get: operations["PayslipsController_previousValues"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/recalculate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 출퇴근으로 다시 계산 — 기본급 · 주휴수당 · 연장수당을 지금 출퇴근 기록으로 다시 계산하고 고친 값은 버린다(WHALEERP-227). */
        post: operations["PayslipsController_recalculate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 확정 — 급여 기간이 끝나야 하고(그 전에 퇴직 · 계약 종료면 그 다음 날부터), 보이는 공제가 모두 있어야 한다. 검토 사유는 확인한 것으로 남는다. */
        post: operations["PayslipsController_confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/cancel-confirmation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 확정 취소 — 확정 · 발송 완료에서 검토 중으로. */
        post: operations["PayslipsController_cancelConfirmation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 발송 — 확정만. 직원 앱 계정 이메일로 보내고(앱 푸시는 아직 없음) 발송 완료로 바꾼다. */
        post: operations["PayslipsController_send"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payslips/{id}/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 재발송 — 발송 완료만(관리자 확인을 거친 뒤 부른다). 재발송 템플릿으로 보낸다. */
        post: operations["PayslipsController_resend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/payslips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MyPayslipsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/payslips/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MyPayslipsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/payslips/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 명세서 내보내기(PAY-2) — 상세와 같은 조건(본인 · 발송된 것 · 3년)의 명세서를 A4 PDF 로 내려준다. 파일 이름은
         *     `급여명세서_YYYY-MM_이름.pdf`(filename*), 한글을 못 읽는 곳에는 `payslip_YYYY-MM_id.pdf`(filename).
         */
        get: operations["MyPayslipsController_pdf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContractsController_list"];
        put?: never;
        /**
         * 근로계약서 초안 저장 — 직원 레코드와 계약을 만들고 곧바로 보낸다(2026-10-19 재영). 계정이 없는 번호면 가입 초대
         *     알림톡과 발송 대기, 계정이 있는 번호면 소속 추가 확인 요청과 발송 대기(직원이 수락하면 서명 대기, WHALEERP-130). 임시저장은
         *     보내지 않는다.
         */
        post: operations["ContractsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/store-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 작성 · 이어 쓰기의 근무지 선택지. 업무 범위(플랫폼 계정은 탭 BP) 안에서 지우지 않았고 폐점이 아닌 점포, 이름순. 작성 또는 수정 권한. */
        get: operations["ContractsController_storeOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/paper": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 종이 계약 등록(CTR-23). 당사자가 모두 날인한 근로계약서(필수) · 임금계약서(선택) 파일과 근로계약서 내용(data,
         *     JSON)을 multipart 한 번으로 받아 발송 · 날인 없이 체결 완료로 저장한다. 검사 · 대체 · 겹침 · 초대 유형 판별은
         *     초안 저장과 같다. 저장이 실패하면 올린 파일도 지운다.
         */
        post: operations["ContractsController_createPaper"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/minimum-wage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 지금 최저임금(공통코드 MINIMUM_WAGE · HOURLY) — 작성 · 이어 쓰기 화면이 시급 칸 도움말과 수습 중 시급 확인에 쓴다
         *     (WHALEERP-595). 저장도 같은 값으로 다시 본다. 공통코드를 쓸 수 없으면 hourlyWage 는 null, problem 이 저장 400 문장이다.
         *     `:contractId` 보다 먼저 둔다.
         */
        get: operations["ContractsController_minimumWage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/{contractId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 작성 화면을 다시 채울 값 — 임시저장 이어 쓰기 */
        get: operations["ContractsController_findOne"];
        /**
         * 임시저장 이어 쓰기. 폼 전체를 다시 보낸다. isTemporarySave 를 빼면 초안 저장으로 넘어가 곧바로 보낸다(POST 와 같다).
         *     직원이 수정을 요청한 계약(수정 요청)도 고친다 — 고쳐 저장하면 곧바로 서명 대기 · 새 기한으로 다시 보내고(번호를 계정이
         *     없는 번호로 고쳤으면 가입 초대 · 발송 대기), 임시저장은 할 수 없다(400).
         */
        put: operations["ContractsController_update"];
        post?: never;
        /** 임시저장 삭제. 계약 · 근무 요일 · 당사자 · 이력과 그 계약에만 쓰인 초안 직원 레코드를 지운다 */
        delete: operations["ContractsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/{contractId}/worker": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 날인 전 당사자 정보 수정(WHALEERP-125 · 126, CTR-28). 발송 대기 · 서명 대기 · 수정 요청 계약의 이름 · 번호 · 생년월일 ·
         *     성별 · 외국인 여부를 고친다. 저장하면 곧바로 새 서명 기한으로 다시 보내고 앞서 나간 링크는 무효다 — 가입 초대면
         *     발송 대기, 앱으로 받는 직원이면 서명 대기.
         */
        patch: operations["ContractsController_updateWorker"];
        trace?: never;
    };
    "/contracts/{contractId}/paper": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 임시저장을 이어 써서 종이 계약으로 등록한다. 받는 것 · 하는 일은 POST /contracts/paper 와 같다 */
        put: operations["ContractsController_updatePaper"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/{contractId}/documents/{contractDocumentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 종이 계약 날인본 내려받기 주소(300초). 받으면 원래 파일 이름으로 저장된다 */
        get: operations["ContractsController_documentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/{contractId}/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 재발송 — 발송 대기 · 서명 대기 · 거부 · 만료(WHALEERP-153)에서 새 서명 기한(30일)으로 다시 보낸다. 가입 전 · 계정 없는 번호는 가입 초대 알림톡을 새
         *     초대 코드로(상태 그대로, 앞서 나간 초대 코드는 무효), 가입한 직원은 앱 알림(근로계약서 발송 알림)으로 보낸다 — 발송 대기였으면
         *     서명 대기로 넘긴다(WHALEERP-611). 가입한 직원의 알림은 알림함 알림이고(앱 푸시는 #261 전까지 나가지 않는다), 알림 템플릿을
         *     쓸 수 없거나 탈퇴 계정이면 알림 없이 기한만 새로 잡는다. 계정은 있고 이 점포에 가입하지 않은 번호(소속 추가 확인 · 복귀
         *     확인)는 소속 추가 확인 요청 알림톡 · 메일을 새로 보내고 발송 대기로 둔다 — 날인 기한은 직원이 수락한 때부터라 응답의 기한은
         *     null 이다(WHALEERP-130).
         */
        post: operations["ContractSendController_send"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contracts/{contractId}/end": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 발송 대기 계약 종료(WHALEERP-327). 채용을 접을 때 계약을 종료로 닫고 나간 초대(코드 · 링크)를 무효로 한다. 행은 남고 상태
         *     이력에 남는다. 기존 계약을 바꾸므로 수정 권한이다.
         */
        post: operations["ContractSendController_end"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts/{contractId}/sign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 날인 — 서명 PNG(파일 칸 `signature`, 1MB)와 직원이 본 계약의 발송 일시(`sentAt`, 시간대 표기 필수). 날인 전에 계약서의 직원
         *     정보(이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부)를 가입 정보와 대조해, 다르면 409 IDENTITY_MISMATCH(mismatches)
         *     — 직원은 수정 요청을 낸다. 성별은 가입 때 필수라 다섯 가지를 늘 본다.
         */
        post: operations["MyContractsController_sign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts/{contractId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 거부 — 사유는 받지 않는다(WHALEERP-635, 본문은 읽지 않는다) */
        post: operations["MyContractsController_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts/{contractId}/correction-request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 수정 요청 — 계약서가 틀렸을 때(대조 결과와 상관없이). 사유는 필수(1~100자, WHALEERP-635) */
        post: operations["MyContractsController_requestCorrection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 근로계약 목록 — 서명 대기 이후(임시저장 · 발송 대기 제외). 소속 확인 대기 계약은 없다 */
        get: operations["MyContractViewsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts/{contractId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 근로계약 상세 — 계약서에 그릴 값 · 사용자 칸 · 본인 대조 미리보기(날인할 수 있는지 · 다른 항목) */
        get: operations["MyContractViewsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/contracts/{contractId}/documents/{contractDocumentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 근로계약 파일 내려받기 주소(300초) — 상세 documents 의 파일. 받으면 원래 파일 이름으로 저장된다 */
        get: operations["MyContractDocumentsController_downloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록과 미확인 건수. 종 팝오버는 pageSize=5 로 부른다. */
        get: operations["NotificationsController_findAll"];
        put?: never;
        post?: never;
        /** 선택 삭제. 내 것이 아닌 ID 는 조용히 빠진다. */
        delete: operations["NotificationsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 모두 읽음 */
        post: operations["NotificationsController_readAll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 알림을 눌러 이동할 때 읽음으로 바꾸고, 갈 곳(관련 업무)을 담은 그 한 줄을 준다. */
        post: operations["NotificationsController_read"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록 · 미확인 건수 · 줄마다 눌러 열 곳. 수신 설정으로 앱 푸시를 끈 알림도 보인다 */
        get: operations["MyNotificationsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 14일 안의 미확인을 모두 읽음 */
        post: operations["MyNotificationsController_readAll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 읽음 — 알림을 눌러 관련 화면으로 갈 때도 부른다 */
        post: operations["MyNotificationsController_read"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notifications/{id}/unread": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 안 읽음으로 되돌리기 */
        post: operations["MyNotificationsController_unread"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notification-preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 네 묶음(근로계약서 · 근무스케줄 · TO-DO · 급여명세서). 바꾼 적 없으면 켜짐 */
        get: operations["MyNotificationPreferencesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/notification-preferences/{category}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 한 묶음 켜고 끄기. 그 뒤에 생기는 알림부터 든다 */
        put: operations["MyNotificationPreferencesController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 점포 정보 관리 목록. 등록일 최신순, 기본은 미운영 · 운영. */
        get: operations["StoresController_list"];
        put?: never;
        /** 등록. 늘 미운영으로 만들고 점포코드를 채번한다. 가맹 계정은 403. */
        post: operations["StoresController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/excel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 엑셀(xlsx). 목록과 같은 검색 조건으로 전부 담고, 대표자 연락처만 가운데 자리를 가린다. 공통 엑셀 규칙을 따른다 —
         *     1만 건 미만은 바로 파일(200), 이상은 예약 생성(202, 다 만들어지면 등록한 이메일로 링크). 같은 사람 · 같은 화면은 생성
         *     중이면 409, 1분에 한 번(429). `:id` 보다 먼저 둔다.
         */
        get: operations["StoresController_excel"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/business-verifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 저장 전 사업자 인증 확인. 등록 또는 수정 권한이 있으면 된다. 저장할 때 서버가 다시 확인하므로 이 결과는
         *     화면 안내용이다.
         */
        post: operations["StoresController_verifyBusiness"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StoresController_detail"];
        /** 수정 · 상태 전환. 상세에서 받은 updatedAt 을 함께 보낸다 — 그 사이 다른 사람이 고쳤으면 409. */
        put: operations["StoresController_update"];
        post?: never;
        /** 삭제(논리 삭제). 미운영이면서 진행 중인 근로계약이 없을 때만. */
        delete: operations["StoresController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/{id}/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 변경 이력. 보존 기한(5년) 안의 것, 최신순. */
        get: operations["StoresController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/{id}/transition-check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 운영 · 폐점 · 삭제를 지금 할 수 있는가. 수정 화면이 폐점을 고를 때 다시 묻는다. */
        get: operations["StoresController_transitionCheck"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/{id}/image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * 대표 이미지 올리기 · 바꾸기(점포당 1장). multipart 의 `file` 한 개, JPG · PNG 5MB 이하 — 종류는 확장자가
         *     아니라 내용으로 본다. 등록 화면은 점포를 등록한 뒤 이 경로로 올린다. 수정 권한이 있어야 한다.
         *
         *     가드는 인터셉터보다 먼저 돌므로, 권한 없는 관리자의 요청은 AttachmentsInterceptor 가 multipart 본문
         *     (최대 5MB)을 받기 전에 403 이다.
         */
        put: operations["StoresController_putImage"];
        post?: never;
        /** 대표 이미지 지우기. 이미지가 없어도 204. 수정 권한이 있어야 한다. */
        delete: operations["StoresController_removeImage"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-notices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 최근 수정일 내림차순. */
        get: operations["PlatformNoticesController_list"];
        put?: never;
        /** 등록. 임시저장 · 게시 · 비공개 어느 상태로든 만든다. 게시하려면 노출 대상이 있어야 한다. */
        post: operations["PlatformNoticesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-notices/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlatformNoticesController_get"];
        /**
         * 수정. 게시 상태 · 상단 고정 · 노출 대상 · 첨부도 이 요청으로 바꾼다. 게시된 글이면 바로 사용자에게 보인다.
         *     첨부는 `files` 로 더하고 `removeAttachmentIds` 로 뺀다 — 남는 것과 더한 것이 합쳐 5개까지다.
         *     읽은 뒤 다른 관리자가 고쳤으면 409 — 다시 읽어 최신 내용을 본다.
         */
        put: operations["PlatformNoticesController_update"];
        post?: never;
        /** 지운다(지움 표시). 사용자에게 보이지 않고 행은 남는다. */
        delete: operations["PlatformNoticesController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-notices/{postId}/attachments/{postAttachmentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 첨부 내려받기 주소. 300초 동안 쓸 수 있는 서명 주소이고, 받으면 원래 파일 이름으로 저장된다. */
        get: operations["PlatformNoticesController_attachmentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-faqs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 최근 수정일 내림차순. */
        get: operations["PlatformFaqsController_list"];
        put?: never;
        /** 등록. 임시저장 · 게시 · 비공개 어느 상태로든 만든다. 게시하려면 노출 대상이 있어야 한다. */
        post: operations["PlatformFaqsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-faqs/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlatformFaqsController_get"];
        /** 수정. 게시된 글이면 바로 사용자에게 보인다. 읽은 뒤 다른 관리자가 고쳤으면 409 — 다시 읽어 최신 내용을 본다. */
        put: operations["PlatformFaqsController_update"];
        post?: never;
        /** 지운다(지움 표시). 사용자에게 보이지 않고 행은 남는다. */
        delete: operations["PlatformFaqsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-notices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportNoticesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-notices/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 가드가 권한을 본 뒤에 이전 · 다음을 읽어 붙인다 — 권한 없는 사람에게 다른 글 제목을 읽지 않는다. */
        get: operations["SupportNoticesController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-notices/{postId}/attachments/{postAttachmentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 첨부 내려받기 주소(#282). 그 관리자에게 보이는 공지사항(상세와 같은 판정)의 첨부가 아니면 404. */
        get: operations["SupportNoticesController_attachmentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-faqs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportFaqsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-notices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicNoticesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-notices/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicNoticesController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-notices/{postId}/attachments/{postAttachmentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 첨부 내려받기 주소. 300초 동안 쓸 수 있고, 받으면 원래 파일 이름으로 저장된다. */
        get: operations["PublicNoticesController_attachmentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-faqs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicFaqsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notification-templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 채널 탭 하나의 목록. 템플릿 코드순 */
        get: operations["NotificationTemplatesController_list"];
        put?: never;
        /** 등록. 기본 문구가 없어 되돌리기는 없다 */
        post: operations["NotificationTemplatesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notification-templates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세 — 변수 목록과 변경 이력(최근 것부터) */
        get: operations["NotificationTemplatesController_get"];
        /** 수정 — 모든 칸(NOTIFY-10). 읽은 뒤 누가 고쳤으면 409 */
        put: operations["NotificationTemplatesController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notification-templates/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 기본 문구로 되돌리기 — 제목 · 본문 · 변수 목록(NOTIFY-18) */
        post: operations["NotificationTemplatesController_restore"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notification-templates/{id}/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 사용 / 사용 안 함 */
        patch: operations["NotificationTemplatesController_setActive"];
        trace?: never;
    };
    "/leads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 도입문의 접수. 본문 없이 201 을 돌려준다 — 문의자가 상태를 조회하는 화면은 없다. */
        post: operations["LeadsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 도입문의 목록. 접수 최신순. */
        get: operations["LeadsAdminController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads/{leadId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 도입문의 상세 — 문의자 정보 · 동의 · 답변 · 처리 이력 · 내부 메모. */
        get: operations["LeadsAdminController_get"];
        put?: never;
        post?: never;
        /** 상담하지 않은(상담 완료일 없는) 도입문의를 지운다. 행을 남기지 않는다(개인정보 파기, CNT-11). */
        delete: operations["LeadsAdminController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads/{leadId}/processing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 처리중으로 바꾼다. 접수 상태에서만 된다. */
        post: operations["LeadsAdminController_startProcessing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads/{leadId}/reply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 답변을 저장하고 답변 완료로 바꾼다. 고칠 때도 이것으로 덮어쓴다. */
        put: operations["LeadsAdminController_reply"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads/{leadId}/reply-mail/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 저장된 지금 답변을 문의자 이메일로 다시 보낸다. 답변완료만, 같은 도입문의는 1분에 한 번. SMTP 가 실패해도 200 이고
         *     결과(`FAILED`)를 돌려준다 — 상세의 마지막 발송 결과에도 보통 같은 값이 남는다. 메일 발송 설정이 없으면 503.
         */
        post: operations["LeadsAdminController_resendReplyMail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-leads/{leadId}/internal-memo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 운영자 내부 메모. 문의자에게 보이지 않는다. */
        put: operations["LeadsAdminController_saveInternalMemo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 문의사항 목록. 접수 최신순. */
        get: operations["InquiriesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries/{inquiryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 문의사항 상세 — 답변 이력 · 첨부파일 · 처리 이력 · 내부 메모. */
        get: operations["InquiriesController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries/{inquiryId}/attachments/{inquiryAttachmentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 첨부파일 내려받기 주소. 300초 동안 쓸 수 있는 서명 주소이고, 받으면 원래 파일 이름으로 저장된다. 저장소 설정이 없는
         *     환경이면 503.
         */
        get: operations["InquiriesController_attachmentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries/{inquiryId}/processing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 처리중으로 바꾼다. 접수 상태에서만 된다. */
        post: operations["InquiriesController_startProcessing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries/{inquiryId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 답변을 저장하고 답변 완료로 바꾼다. 답변을 고칠 때도 이것으로 새 답변을 더한다. 첫 답변이면 등록한 관리자에게
         *     운영 알림과 메일이 간다.
         */
        post: operations["InquiriesController_reply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/platform-inquiries/{inquiryId}/internal-memo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 운영자 내부 메모. 문의자에게 보이지 않는다. */
        put: operations["InquiriesController_saveInternalMemo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-inquiries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 문의 목록. 등록 최신순. */
        get: operations["SupportInquiriesController_list"];
        put?: never;
        /**
         * 문의 등록. 텍스트 칸과 첨부파일(`files`, 선택)을 multipart 한 번으로 받는다. 첨부는 JPG · PNG · PDF, 5개까지,
         *     파일당 10MB 이고 종류는 파일 내용으로 확인한다. 등록한 뒤에는 첨부를 더하거나 빼지 않는다.
         */
        post: operations["SupportInquiriesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-inquiries/{inquiryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 문의 상세 — 마지막 답변만 보인다(운영 정책 CNT-17). */
        get: operations["SupportInquiriesController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-inquiries/{inquiryId}/attachments/{inquiryAttachmentId}/download-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 첨부파일 내려받기 주소. 300초 동안 쓸 수 있는 서명 주소이고, 받으면 원래 파일 이름으로 저장된다. */
        get: operations["SupportInquiriesController_attachmentDownloadUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/todos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 목록. 미완료 긴급 → 미완료 나머지 → 완료, 묶음 안은 수행 예정 일시 오름차순. 배정 그룹은 한 줄 */
        get: operations["TodosController_list"];
        put?: never;
        /** 등록. 배정 그룹을 펼쳐 행을 만든다. 배정 알림은 없다 */
        post: operations["TodosController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/todos/assignable-staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 등록의 직원 고르기 — 그 근무지에 체결 완료 계약이 있고 가입을 마쳤고 퇴직하지 않은 직원, 이름순 */
        get: operations["TodosController_assignableStaff"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/todos/{todoId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 상세 — 배정 대상 · 상태 이력, 그룹이면 직원별 상태 */
        get: operations["TodosController_findOne"];
        put?: never;
        post?: never;
        /** 대기만 지운다. 그룹이면 그룹의 대기인 행만(T-2) */
        delete: operations["TodosController_remove"];
        options?: never;
        head?: never;
        /** 제목 · 내용 · 수행 예정 일시 · 긴급 수정. 그룹이면 그룹 전체. 배정 대상 · 수행 방식은 못 바꾼다(400) */
        patch: operations["TodosController_update"];
        trace?: never;
    };
    "/todos/{todoId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 관리자가 직원 대신 상태를 바꾼다(T-1). 그룹이면 그 행만 */
        patch: operations["TodosController_changeStatus"];
        trace?: never;
    };
    "/staff-members/{id}/todos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 그 직원에게 배정된 TO-DO. 정렬은 TO-DO 목록과 같다 */
        get: operations["StaffMemberTodosController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/todos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 TO-DO. 근무지별로 묶을 때는 storeId 를 쓴다. 한 명 수행은 완료했으면 수행자 이름을 보인다(WORK-3) */
        get: operations["MyTodosController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/todos/{todoId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 대기 ↔ 진행 중 ↔ 완료. 한 명 수행은 먼저 저장된 완료만 인정한다 */
        patch: operations["MyTodosController_changeStatus"];
        trace?: never;
    };
    "/work-schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 주간 · 월간 보기 — 기간(42일 이하) 안 받을 수 있는 직원 행, 근무스케줄, 날마다 인원(30분 칸). 본사 계정에게 동의 없는
         *     가맹 직원은 행만 두고 누구인지 비운다(ATT-30)
         */
        get: operations["WorkSchedulesController_list"];
        put?: never;
        /** 등록. 종료가 시작보다 이르면 다음 날(자정 넘김). 겹치지 않으면 같은 날 여러 건 */
        post: operations["WorkSchedulesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 변경 이력(#608) — 등록 · 수정 · 삭제의 변경 전후 값 · 일시 · 주체, 새것부터. 기간은 변경 일시의 한국 날짜. 본사 계정에게
         *     동의 없는 가맹 직원의 이력은 빠진다(ATT-30)
         */
        get: operations["WorkSchedulesController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/assignable-staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 등록의 직원 선택지 — 가입을 마쳤고 그 근무일에 체결 완료 계약이 있고 퇴직일 전인 직원, 이름순(STAFF-29 · CTR-24) */
        get: operations["WorkSchedulesController_assignableStaff"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/defaults": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 기본값 — 근무일 요일의 계약 근무시간(STAFF-14). 「계약 값으로 되돌리기」도 이것을 부른다 */
        get: operations["WorkSchedulesController_defaults"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 여러 직원 일괄 등록(#199) — 근무일 하나, 직원별 줄. 줄마다 따로 저장해 규칙에 걸린 줄만 `failed` 로 돌려주고 나머지는
         *     저장한다. 알림은 바뀐 직원마다 한 번
         */
        post: operations["WorkSchedulesController_bulkCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/copy-last-week": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 지난 주 복사 미리보기(#204) — 쓰지 않는다. 넣을 주가 비어 있지 않으면 409 */
        get: operations["WorkSchedulesController_copyPreview"];
        put?: never;
        /**
         * 지난 주 복사(#200, STAFF-13) — 빈 주에서만, 원본은 직전 주. 받을 수 없는 날은 빼고 바로 반영한다. 알림은 생긴 직원마다
         *     한 번
         */
        post: operations["WorkSchedulesController_copyLastWeek"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/work-schedules/{workScheduleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 삭제. 시점 제한 없이 */
        delete: operations["WorkSchedulesController_remove"];
        options?: never;
        head?: never;
        /** 수정. 근무일 · 시각 · 휴게. 직원은 못 바꾼다. 지난 날짜도 경고 없이 */
        patch: operations["WorkSchedulesController_update"];
        trace?: never;
    };
    "/me/work-schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 소속 하나의 한 달 근무스케줄, 시작순. 앞달 말일에 시작해 1일로 넘어온 근무는 앞달 것이다 */
        get: operations["MyWorkSchedulesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/attendance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 출퇴근 화면 — 고른 근무지의 좌표 · 반경(1차 모두 100m), 동의 상태, 출근을 막는 까닭, 열린 출근, 오늘 근무스케줄 */
        get: operations["MyAttendanceController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/attendance/location-reads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 위치 읽음(ATT-22 v229) — 출퇴근 탭에 들어오거나 출근 · 퇴근 버튼을 눌러 위치를 읽을 때마다 부른다. 확인자료(수집 · 이용)를
         *     남기고, 버튼을 눌러 받은 locationReadId 를 이어서 보내는 출근 · 퇴근에 넣는다. 위치는 보내지 않는다
         */
        post: operations["MyAttendanceController_locationRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/attendance/check-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 출근. 기록 시각은 서버가 받은 시각이다 */
        post: operations["MyAttendanceController_checkIn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/attendance/check-out": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 퇴근. 고른 소속의 열린 출근을 닫는다 */
        post: operations["MyAttendanceController_checkOut"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/attendance/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 출퇴근 현황(WHALEERP-221 · 222) — 내 소속 하나의 기간(366일 이하) 기록. 보기만 한다(고치기는 관리자 웹뿐). 보정 · 대신 등록한 날에는
         *     이력이 붙는다(연필 시트)
         */
        get: operations["MyAttendanceController_myRecords"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/daily": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 일별 출퇴근 — 점포 조건(상단 범위 · 필터) 안 하루의 직원별 예정 · 출근 · 퇴근 · 상태. 업무 범위 밖 점포는 빠진다. 본사 계정에게
         *     동의 없는 가맹 직원은 줄도 상태별 건수도 빼고 센다(ATT-30, 운영 정책 v218 2026-10-27)
         */
        get: operations["AttendanceRecordsController_daily"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 기간 출퇴근 — 점포 조건 안 기간(92일 이하)의 직원 · 날 줄, 직원을 고르면 그 직원만(WHALEERP-217 「직원별 · 근무지별 · 기간」).
         *     근무스케줄이나 기록이 있는 날만. 본사 계정에게 동의 없는 가맹 직원은 줄 · 건수 모두에서 빠진다(ATT-30, 운영 정책 v218 2026-10-27)
         */
        get: operations["AttendanceRecordsController_period"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/proxy-staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 대신 등록 선택지 — 그날 대신 등록할 수 있는 직원(위치정보 동의 없음 · 일시 중지, 체결 완료 계약, ATT-20 · 26) */
        get: operations["AttendanceRecordsController_proxyStaff"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/proxy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 출퇴근 대신 등록(ATT-20 · 26). 최근 3개월 · 오늘까지, 사유 필수 */
        post: operations["AttendanceRecordsController_proxy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/{recordId}/correction": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 기록 보정 — 짝의 출근 · 퇴근 시각, 비었던 쪽은 새로. 보정 이력을 남기고 확인 필요 사유를 지운다(218 · ATT-19) */
        post: operations["AttendanceRecordsController_correct"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/{recordId}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 「이상 없음」 — 값은 그대로 두고 짝의 확인 필요 사유만 지운다(ATT-19) */
        post: operations["AttendanceRecordsController_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attendance-records/{recordId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 이력 — 짝의 보정 이력과 대신 등록, 새것부터 */
        get: operations["AttendanceRecordsController_history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 정보 — 계정 칸, 본사 제공 동의(계정에 하나), 위치정보 동의. 소속 근무지는 `GET /me/memberships` */
        get: operations["MyProfileController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/address": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * 주소 수정 (WHALEERP-189). 계정에 하나라 모든 소속에 같이 보인다. 이미 보낸 근로계약서에는 반영하지 않는다. 주소 세
         *     칸을 통째로 바꾸므로 상세 주소를 빼고 보내면 비워진다. 변경 전후 값을 계정 변경 이력에 남긴다. 같은 값이면 아무것도
         *     쓰지 않는다
         */
        put: operations["MyProfileController_updateAddress"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/password-change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 비밀번호 변경 (WHALEERP-192). 지금 비밀번호가 틀리거나 새 비밀번호가 규칙에 어긋나면 400 과 사유이고 바꾸지
         *     않는다. 바꾸면 이 기기는 로그인을 잇고 다른 기기는 다시 로그인한다
         */
        post: operations["MyProfileController_changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/email-change-pins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 이메일 변경 핀 요청 (WHALEERP-191). 지금 비밀번호가 맞으면 새 이메일로 15분짜리 핀을 보낸다. 이메일은 아직 바뀌지
         *     않는다 — 지금 이메일로 계속 로그인된다. 새 핀 메일이 나가면 앞의 핀은 무효다(보내지 못하면 앞의 핀을 그대로 쓴다)
         */
        post: operations["MyProfileController_requestEmailChangePin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/email-change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 이메일 변경 (WHALEERP-191). 받은 핀이 맞으면 계정 이메일을 핀을 낸 새 이메일로 바꾼다. 다음 로그인부터 새 이메일이고,
         *     지금 접속은 이어진다
         */
        post: operations["MyProfileController_changeEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/memberships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 소속 근무지 — TO-DO 와 같은 재직 직원 기준. 체결 완료 근로계약이 있고 가입 완료 · 퇴직 전인 직원 레코드. 퇴직 예정은
         *     퇴직일과 함께. `includeRetired=true` 면 퇴직한 레코드도 지금 소속 뒤에 퇴직일 최근 순으로 넣는다 — 퇴직일(retiredDate)이
         *     오늘보다 앞이면 퇴직, 오늘 · 뒤면 퇴직 예정이다(2026-10-28). 묶음은 재직 상태로 가르므로 퇴직 배치가 늦은 날에는 날짜와
         *     어긋날 수 있다.
         */
        get: operations["MyMembershipsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/memberships/{staffMemberId}/tax-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 그 소속의 신고 정보 (TAX-8). 주민등록번호 · 계좌번호는 가린 값만 준다 */
        get: operations["MyMembershipsController_taxProfile"];
        /**
         * 신고 정보 작성 · 수정 (WHALEERP-334). 직원 본인만 — 관리자 토큰은 403. 처음에는 주민등록번호 · 은행 · 계좌번호를 모두,
         *     고칠 때는 주민등록번호만 또는 급여 계좌(은행 · 계좌번호 함께)만 보낸다. 주민등록번호를 새로 받으면 수집 일시가 바뀌고
         *     이전 값은 남기지 않는다. 급여 계좌는 다음 급여부터 쓴다. 응답은 조회와 같다(가린 값만).
         *     이미 낸 신고 정보를 고칠 때는 `currentPassword`(지금 비밀번호)도 보낸다 — 처음 작성에는 필요 없다(2026-10-23).
         */
        put: operations["MyMembershipsController_saveTaxProfile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/location-consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 위치정보 동의 — 미동의 · 철회 상태에서. 지금 시행 중인 위치정보 약관 버전에 동의한 것으로 남는다 (ATT-23). 본문의
         *     `termsVersion`(화면이 보여 준 버전, 필수 · null 가능)이 그와 다르면 409 — 화면은 다시 받아 새 약관을 보인다. 빼면 400
         */
        post: operations["MyConsentController_agreeLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/location-consent/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 위치정보 잠시 멈춤 (ATT-26) */
        post: operations["MyConsentController_pauseLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/location-consent/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 위치정보 다시 켜기 (ATT-26) — 새로 동의하지 않는다 */
        post: operations["MyConsentController_resumeLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/location-consent/withdraw": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 위치정보 동의 철회 (ATT-23). 멈춘 동안에도 된다 */
        post: operations["MyConsentController_withdrawLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/hq-sharing-consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 본사 제공 동의 — 처음이든 철회 뒤든, 내 정보의 `needsReconsent` 로 다시 동의할 때든 (ATT-30). 계정에 하나라 소속 가맹
         *     점포 모두에 같이 적용된다. 본문의 `consentVersion`(화면이 보여 준 문구 버전, 필수)이 지금 버전과 다르면 409 — 화면은 새로
         *     고쳐 새 문구를 보인다(ATT-30 v252). 빼면 400
         */
        post: operations["MyConsentController_agreeHqSharing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/hq-sharing-consent/withdraw": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 본사 제공 동의 철회 (ATT-30) */
        post: operations["MyConsentController_withdrawHqSharing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/invitations/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 초대 확인(WHALEERP-141, 진입 · 가입 화면 가이드 ①·②). 초대 링크의 토큰, 또는 휴대전화번호와 초대 코드 가운데 하나로
         *     살아 있는 가입 초대를 찾아 근무지 · 고용 형태 · 유효 기간 · 화면이 채울 번호를 준다.
         */
        post: operations["StaffSignupController_check"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/account/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 직원 앱 가입(WHALEERP-601 · 142, 가이드 ③·④). 초대를 다시 확인하고 계정을 만들어 직원 레코드에 잇고(가입 완료) 초대를
         *     수락으로 둔다. 가입을 기다리던 근로계약서는 서명 대기가 된다. 계정 번호는 초대의 번호다. 마치면 로그인 응답과 같은
         *     모양으로 접속 상태를 준다. 가입하는 날 만 19세 미만이면 계정을 만들지 않고 초대를 「가입 불가」로 둔 뒤 400 이다.
         *     본사 제공 동의에 실은 문구 버전(hqSharingConsentVersion)이 지금과 달라도 가입은 마치고 동의만 남기지 않는다 — 응답의
         *     hqSharingConsentRecorded 가 false 다(ATT-30 v253).
         */
        post: operations["StaffSignupController_signup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내게 온 가입 초대 — 계정의 휴대전화번호로 나간, 아직 쓸 수 있는 가입 초대 · 재초대(보냄 · 기한 안 · 아직 계정 없는
         *     직원 레코드). 근로계약서 이름이 계정 이름과 다른 초대는 뺀다(본인 대조 규칙 — 번호 재활용 대비, 2026-10-28). 보낸 시각 최근 순. 근무지 · 고용 형태 · 직무 · 유효 기간과 본사 제공 동의를 물을지(직영이 아니고 계정이
         *     아직 동의하지 않았을 때) 준다.
         */
        get: operations["MyInvitationsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/invitations/{invitationId}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 근무지 더하기 — 목록에서 고른 초대를 다시 확인하고 그 근무지의 직원 레코드를 이 계정에 잇는다(가입 완료 · 초대 수락).
         *     가입을 기다리던 근로계약서는 서명 대기가 된다.
         */
        post: operations["MyInvitationsController_accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/affiliation-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 내 살아 있는 소속 추가 확인 요청 — 보냄 · 기한 안. 로그인 뒤 팝업과 나의 정보 - 소속 점포가 이 목록을 보인다. 없으면 빈 배열 */
        get: operations["MyAffiliationRequestsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/affiliation-requests/{invitationId}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 수락 — 그 점포의 직원 레코드를 이 계정에 잇고(가입 완료) 함께 온 근로계약서를 서명 대기로 넘긴다. 날인 기한은 지금부터 30일,
         *     날인 요청 직원 알림이 나간다.
         */
        post: operations["MyAffiliationRequestsController_accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/affiliation-requests/{invitationId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 거절 — 요청을 거절로 두고(사유 선택) 함께 온 근로계약서를 거부로 닫는다(같은 사유). 직원 레코드 · 지금 소속 · 계정은 그대로다.
         *     초안을 쓴 관리자에게 「소속 추가 확인 거절」 운영 알림이 간다.
         */
        post: operations["MyAffiliationRequestsController_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-holidays": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 월 캘린더 · 목록 — 계산한 날짜마다 한 줄과, 캘린더의 공식 휴일. */
        get: operations["BpHolidaysController_list"];
        put?: never;
        post: operations["BpHolidaysController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-holidays/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 변경 이력 — 기간(기본 이달 1일~오늘)에 생긴 등록 · 수정 · 강제 종료 · 삭제. 지운 휴일 포함. */
        get: operations["BpHolidaysController_histories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-holidays/overlaps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 겹치는 휴일 확인 — 저장 전에 부른다. 저장은 막지 않는다. */
        post: operations["BpHolidaysController_overlaps"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-holidays/{bpHolidayId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BpHolidaysController_detail"];
        /** 수정 — 시작 전이면 모두, 진행 중이면 휴일명 · 설명 · 점포만. 점포는 더하면 오늘부터, 빼면 어제까지. */
        put: operations["BpHolidaysController_update"];
        post?: never;
        /** 삭제(논리) — 시작일이 오늘 이후인 휴일만. 지운 휴일은 변경 이력에만 남는다. */
        delete: operations["BpHolidaysController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bp-holidays/{bpHolidayId}/terminate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 강제 종료 — 어제 날짜로 끝낸다. 되돌리지 않는다. 시작일이 어제 이전인 진행 중 휴일만. */
        post: operations["BpHolidaysController_terminate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/home/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 수치 카드 넷 · 점포별 현황 표(미조치 많은 순 일곱 곳 + 전체 수) */
        get: operations["HomeController_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/home/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 경고 밴드(갱신 예정 7일 안) · 처리 대기 유형 목록 */
        get: operations["HomeController_pending"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LoginDto: {
            /**
             * Format: email
             * @description 대소문자는 구분하지 않는다. 저장·조회 모두 소문자로 정규화한다.
             */
            email: string;
            password: string;
            /**
             * @description 기기를 구분하는 값. 같은 기기로 다시 로그인하면 그 기기의 이전 접속만
             *     종료된다. 없으면 기기 단위로 접속을 정리하지 못한다.
             */
            deviceIdentifier?: string;
            /**
             * @description 자동 로그인 (2026-10-20). 켜면(또는 빠지면) 접속을 마지막 사용 후 30일, 끄면 7일 유지한다. 갱신해도 그 길이로만
             *     민다 — 갱신 응답의 `refreshTokenExpiresAt` 이 그 기준이다.
             */
            rememberMe?: boolean;
        };
        /**
         * @description 가입 연결이 보류된 계정(`LINK_HOLD`)도 로그인된다. 이 값이 보류이면 앱은
         *     관리자 확인 중임을 보여 준다.
         * @enum {string}
         */
        AccountStatus: "JOINED" | "LINK_HOLD" | "WITHDRAWN";
        LoginAccountResponseDto: {
            /**
             * @description 가입 연결이 보류된 계정(`LINK_HOLD`)도 로그인된다. 이 값이 보류이면 앱은
             *     관리자 확인 중임을 보여 준다.
             */
            status: components["schemas"]["AccountStatus"];
            accountId: number;
            email: string;
            realName: string;
        };
        LoginResponseDto: {
            /** @description Authorization: Bearer <accessToken> 으로 API 를 호출한다. 15분 뒤 만료된다. */
            accessToken: string;
            /** @description 접속을 이어 갈 때 쓴다. 원문은 이 응답에만 있고 서버에는 해시만 남는다. */
            refreshToken: string;
            /**
             * Format: date-time
             * @description 마지막으로 사용한 때부터 30일(로그인 때 `rememberMe: false` 면 7일)이 되는 시각. 사용할 때마다 같은 길이로 뒤로 밀린다.
             */
            refreshTokenExpiresAt: string;
            account: components["schemas"]["LoginAccountResponseDto"];
        };
        LoginTooManyRequestsResponseDto: {
            statusCode: number;
            message: string;
            /** @description 잠금의 429 에만 있다(`Too Many Requests`). 요청 제한의 429 본문은 `statusCode` · `message` 뿐이다. */
            error?: string;
            /**
             * Format: date-time
             * @description 계정 잠금이 풀리는 시각. 요청 제한의 429 에는 없다.
             */
            lockExpiresAt?: string;
        };
        RefreshDto: {
            /** @description 로그인 응답으로 받은 갱신 토큰. */
            refreshToken: string;
        };
        RefreshResponseDto: {
            /** @description Authorization: Bearer <accessToken> 으로 API 를 호출한다. 15분 뒤 만료된다. */
            accessToken: string;
            /**
             * Format: date-time
             * @description 갱신 토큰은 새로 주지 않는다. 쓰던 것을 계속 쓰고, 이 시각이 마지막으로
             *     사용한 때부터 30일(자동 로그인을 끄고 로그인한 접속은 7일)이 되는 새 만료 시각이다.
             */
            refreshTokenExpiresAt: string;
        };
        RequestPasswordResetPinDto: {
            /**
             * Format: email
             * @description 비밀번호를 잊은 계정의 이메일. 대소문자는 구분하지 않는다.
             */
            email: string;
        };
        VerifyPasswordResetPinDto: {
            /** Format: email */
            email: string;
            /** @description 메일로 받은 핀. 앞뒤 공백과 대소문자는 서버가 정리한다. */
            pin: string;
        };
        ResetPasswordDto: {
            /** Format: email */
            email: string;
            /** @description 핀 확인에 쓴 핀을 다시 보낸다. 서버가 한 번 더 검증한다. */
            pin: string;
            /**
             * @description 새 비밀번호. 문자 종류와 길이 규칙은 서버가 검사하고 어긋나면 사유를 준다. 여기서는 터무니없이
             *     긴 입력(scrypt 에 큰 값을 먹이는 일)만 막는다.
             */
            newPassword: string;
        };
        EmailFindDto: {
            /** @description 본인인증 실명. 앞뒤 공백은 무시하고, 한글 자모가 풀려 와도(NFD) 같은 이름으로 본다. */
            name: string;
            /** @description 휴대전화번호. 하이픈 · 공백은 지우고 숫자 10~11자리만 받는다. */
            phone: string;
            /** @description 생년월일. YYYY-MM-DD 이고 있는 날짜여야 한다. */
            birthDate: string;
        };
        EmailFindResponseDto: {
            /**
             * @description 맞는 계정의 로그인 이메일을 가린 것. 휴대전화번호는 고유하지 않아 여럿일 수 있고(탈퇴 계정은 뺀다),
             *     가입 순서대로다. @ 앞은 처음 2글자와 마지막 1글자만 보이고(3글자 이하면 첫 글자만), 도메인은 그대로다.
             *     예: st*****m@gmail.com
             */
            emails: string[];
        };
        EmailFindTooManyRequestsResponseDto: {
            statusCode: number;
            message: string;
            /** @description 번호 잠금의 429 에만 있다(`Too Many Requests`). 요청 제한의 429 본문은 `statusCode` · `message` 뿐이다. */
            error?: string;
            /**
             * Format: date-time
             * @description 번호 잠금이 풀리는 시각. 요청 제한의 429 에는 없다.
             */
            lockExpiresAt?: string;
        };
        VerifyPasswordResetLinkDto: {
            /**
             * @description 메일 링크 fragment(`#token=`)의 token 값. base64url 모양이 아니어도 400 이 아니라 쓸 수 없는 링크(401)다. 비었거나
             *     문자열이 아니거나 200자를 넘으면 검증 단계의 400 이다.
             */
            token: string;
        };
        ResetPasswordWithLinkDto: {
            /** @description 메일 링크 fragment(`#token=`)의 token 값 */
            token: string;
            /**
             * @description 새 비밀번호. 문자 종류와 길이 규칙은 서버가 검사하고 어긋나면 사유를 준다(링크는 그대로). 여기서는 터무니없이
             *     긴 입력(scrypt 에 큰 값을 먹이는 일)만 막는다.
             */
            newPassword: string;
        };
        PasswordResetLinkResponseDto: {
            /**
             * Format: date-time
             * @description 링크를 보낸 시각
             */
            issuedAt: string;
            /**
             * Format: date-time
             * @description 링크가 쓸 수 없게 되는 시각 — 보낸 때부터 24시간
             */
            expiresAt: string;
        };
        AdminLoginDto: {
            /** @description 관리자 로그인ID. 대소문자를 구분한다. 형식은 검사하지 않는다 — 틀리면 없는 아이디와 같이 답한다. */
            loginId: string;
            /** @description 기존 비밀번호 또는 메일로 받은 임시 · 초기 비밀번호. */
            password: string;
            /** @description 브라우저를 구분하는 값. 같은 값으로 다시 로그인하면 그 브라우저의 이전 세션만 종료된다. */
            deviceInformation?: string;
        };
        AdminLoginInfoBpDto: {
            bpCodeId: number;
            /** @description BP+6자리. 플랫폼 BP 는 BP000000. */
            bpCode: string;
            tradeName: string;
            /** @description true 면 플랫폼 관리 사이트 계정(PM · PA). */
            isPlatform: boolean;
        };
        AdminLoginAccountResponseDto: {
            adminAccountId: number;
            loginId: string;
            name: string | null;
            /** @description 권한 유형 — 공통코드 `ROLE_TYPE`(PM · PA · BM · BA · FM · FA). */
            roleTypeCode: string;
            /** @description 소속 BP. front 는 로그인 뒤 브라우저에 두는 BP 데이터를 `bpCodeId` 로 구분한다. */
            bp: components["schemas"]["AdminLoginInfoBpDto"];
            /** @description true 면 닫을 수 없는 강제 비밀번호 변경 팝업을 띄운다. */
            isPasswordChangeRequired: boolean;
        };
        AdminLoginResponseDto: {
            /** @description Authorization: Bearer <accessToken> 으로 API 를 호출한다. 1시간 뒤 만료된다. */
            accessToken: string;
            /** @description 세션을 이어 갈 때 쓴다. 원문은 이 응답에만 있고 서버에는 해시만 남는다. */
            refreshToken: string;
            /**
             * Format: date-time
             * @description 마지막으로 사용한 때부터 1시간이 되는 시각. 임시 비밀번호로 들어왔으면 그 만료를 넘지 않는다.
             */
            refreshTokenExpiresAt: string;
            account: components["schemas"]["AdminLoginAccountResponseDto"];
        };
        AdminTemporaryPasswordDto: {
            /**
             * @description 앞뒤 공백은 무시하고, 한글 자모가 풀려 와도(NFD) 같은 이름으로 본다.
             * @example 홍길동
             */
            name: string;
            /** @example whale01 */
            loginId: string;
            /**
             * Format: email
             * @description 저장값은 소문자다(admin_accounts_email_lower).
             */
            email: string;
        };
        AdminTemporaryPasswordResponseDto: {
            /** @description 메일을 보낸 뒤에만 오는 응답이다. 맞는 계정이 없으면 404, 메일을 못 보내면 503 이다. */
            message: string;
        };
        AdminLoginIdFindDto: {
            /**
             * @description 앞뒤 공백은 무시하고, 한글 자모가 풀려 와도(NFD) 같은 이름으로 본다.
             * @example 홍길동
             */
            name: string;
            /**
             * Format: email
             * @description 저장값은 소문자다(admin_accounts_email_lower).
             */
            email: string;
        };
        AdminLoginIdFindResponseDto: {
            /** @description 앞 2자와 뒤 1자만 보이고 나머지는 길이만큼 `*` 다. 전체 아이디는 오지 않는다. 예: ha******1 */
            maskedLoginId: string;
        };
        AdminRefreshResponseDto: {
            /** @description 새 접근 토큰. 1시간 뒤 만료된다. */
            accessToken: string;
            /**
             * Format: date-time
             * @description 갱신 토큰은 새로 주지 않는다. 쓰던 것의 새 만료 시각이다.
             */
            refreshTokenExpiresAt: string;
        };
        AdminSignupSessionDto: {
            /** @description AdminSignupService.signup 이 가입 끝에 낸 10분짜리 토큰(signup.response.dto.ts 의 signupToken). */
            signupToken: string;
            /** @description 브라우저를 구분하는 값 — 로그인과 같다. 같은 값으로 다시 부르면 그 브라우저의 이전 세션만 종료된다. */
            deviceInformation?: string;
        };
        CodeValueDto: {
            /** @description 상세코드. 저장 · 전송 값. 예: KB */
            value: string;
            /** @description 코드명. 화면에 보이는 값. 예: 국민은행 */
            label: string;
            /** @description 선택지 순서. 1부터. */
            order: number;
        };
        AdminLoginInfoAccountDto: {
            adminAccountId: number;
            loginId: string;
            name: string | null;
            email: string | null;
            /** @description 권한 유형 — 공통코드 `ROLE_TYPE`(PM · PA · BM · BA · FM · FA). */
            roleTypeCode: string;
            bp: components["schemas"]["AdminLoginInfoBpDto"];
            /** @description true 면 닫을 수 없는 강제 비밀번호 변경 팝업을 띄운다. */
            isPasswordChangeRequired: boolean;
            /**
             * Format: date-time
             * @description 임시 비밀번호로 들어왔으면 그 만료 시각. 이때 세션도 끝난다. 아니면 null.
             */
            temporaryPasswordExpiresAt: string | null;
            /** @description true 면 강제 변경 팝업 아래에 약관 동의를 붙인다(플랫폼등록 계정의 첫 로그인). */
            isTermsAgreementRequired: boolean;
        };
        MenuPermissionDto: {
            read: boolean;
            create: boolean;
            update: boolean;
            delete: boolean;
        };
        AdminMenuDto: {
            children: components["schemas"]["AdminMenuDto"][];
            /** @description MN+6자리. 업무 API 의 메뉴 권한 판정도 이 코드로 한다. */
            menuCode: string;
            /** @description 이 메뉴가 속한 서비스 — 공통코드 `SERVICE`(예 `WHALE_ERP`). 사용 중인 서비스의 메뉴만 온다. */
            serviceCode: string;
            name: string;
            url: string | null;
            /** @description 1~3 */
            depth: number;
            /** @description 이 메뉴에서 할 수 있는 것. 하위 메뉴로 가는 길로만 들어간 상위 메뉴는 모두 false. */
            permission: components["schemas"]["MenuPermissionDto"];
        };
        AdminStoreDto: {
            storeId: number;
            storeCode: string;
            name: string;
            /** @description 공통코드 `STORE_TYPE` */
            storeTypeCode: string;
            /** @description 공통코드 `STORE_STATUS` */
            storeStatusCode: string;
        };
        AdminLoginInfoResponseDto: {
            /**
             * @description 그룹 코드 → 이 계정 BP 의 공통코드
             * @example {
             *       "STORE_TYPE": [
             *         {
             *           "value": "DIRECT",
             *           "label": "직영점포",
             *           "order": 1
             *         }
             *       ]
             *     }
             */
            codes: {
                [key: string]: components["schemas"]["CodeValueDto"][];
            };
            account: components["schemas"]["AdminLoginInfoAccountDto"];
            /** @description 조회 권한이 있는 메뉴 트리(최대 3단계). 표시 순서대로. */
            menus: components["schemas"]["AdminMenuDto"][];
            /** @description 관리 점포 — 점포 선택 목록. 플랫폼 계정은 빈 목록이다(BP 를 골라 일한다). */
            stores: components["schemas"]["AdminStoreDto"][];
        };
        AdminStoreListResponseDto: {
            /** @description 관리 점포 — 로그인 정보의 `stores` 와 같은 항목 · 순서(점포 이름순). 플랫폼 계정은 빈 목록이다. */
            items: components["schemas"]["AdminStoreDto"][];
            total: number;
        };
        AdminPasswordChangeDto: {
            /** @description 새 비밀번호 — 영문 · 숫자 · 특수문자 각 1자 이상 8~20자. 규칙 위반은 400 과 정책 문구 하나. */
            newPassword: string;
            /** @description 새 비밀번호 확인. */
            newPasswordConfirm: string;
            /**
             * @description 필수 약관(이용약관 · 개인정보 수집 · 이용) 둘 다 동의. `login-info.account.isTermsAgreementRequired` 가 true 인
             *     계정만 보내고, 그때 true 가 아니면 비밀번호도 바꾸지 않고 400 이다.
             */
            isTermsAgreed?: boolean;
        };
        AdminProfileResponseDto: {
            /** @description 아이디. 바꿀 수 없다. */
            loginId: string;
            /** @description 이름. */
            name: string;
            /** @description 연락처 — 하이픈 없이 숫자 9~12자리. */
            phone: string;
            /** @description 이메일. */
            email: string;
            /**
             * @description 권한 유형 — 공통코드 `ROLE_TYPE`(PM · PA · BM · BA · FM · FA). 한글은 enum 이 아니라
             *     공통코드라 `GET /enums`로 못 받는다(아직 공통코드 조회 API 가 없다, naming.md) — 틀린
             *     주석을 바로잡는다(코드 리뷰로 찾음, 2026-10-21).
             */
            roleTypeCode: string;
            /**
             * Format: date-time
             * @description 가입일시.
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 최근 로그인 일시 — 로그인한 적 없으면 null.
             */
            lastLoginAt: string | null;
            /**
             * Format: date-time
             * @description 저장할 때 동시 수정 검사에 그대로 돌려줘야 하는 값(PATCH 의 updatedAt).
             */
            updatedAt: string;
        };
        AdminProfileUpdateDto: {
            /**
             * @description 내 정보 조회 응답의 updatedAt 그대로. 그사이 다른 관리자가 이 계정을 고쳤으면 409
             *     (platform-admins update 와 같은 동시 수정 검사 — 코드 리뷰로 찾음, 2026-10-21. 전에는
             *     이 칸이 없어 동시에 고치면 먼저 연 쪽이 조용히 덮어썼다).
             */
            updatedAt: string;
            /**
             * @description 이름. 한글 · 영문 2~20자.
             * @example 이서준
             */
            name: string;
            /**
             * @description 연락처. 하이픈 없이 숫자 9~12자리.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 원래 값과 같으면 중복 검사를 하지 않는다.
             * @example seojun@whale.test
             */
            email: string;
        };
        AdminMyPasswordChangeDto: {
            /** @description 현재 비밀번호. */
            currentPassword: string;
            /** @description 새 비밀번호 — 영문 · 숫자 · 특수문자 각 1자 이상 8~20자. 규칙 위반은 400 과 정책 문구 하나. */
            newPassword: string;
            /** @description 새 비밀번호 확인. */
            newPasswordConfirm: string;
        };
        AdminPasswordVerificationDto: {
            /** @description 현재 비밀번호. */
            currentPassword: string;
        };
        WithdrawEligibilityResponseDto: {
            /** @description BP 상호명. */
            bpName: string;
            /** @description 함께 탈퇴될 하위 관리자 수(BP 관리자 · 가맹마스터 · 가맹관리자) — 요청한 BP 마스터 자신은 빼고 센다. */
            adminCount: number;
            /** @description 함께 강제 폐점될 점포 수 — 이미 폐점한 점포는 빼고 센다. */
            storeCount: number;
            /** @description 진행 중인 근로계약(임시저장 · 발송 대기 · 서명 대기 · 수정 요청 · 체결 완료)이 있으면 true — 있으면 탈퇴를 막는다. */
            hasInProgressContract: boolean;
        };
        CreateWithdrawalDto: {
            /** @description 현재 비밀번호. */
            currentPassword: string;
            /**
             * @description 탈퇴 사유 — 공통코드 WITHDRAW_REASON.
             * @enum {string}
             */
            reasonCode: "WD_CLOSE" | "WD_SWITCH" | "WD_COST" | "WD_FEATURE" | "WD_HARD" | "WD_INPUT";
            /** @description 탈퇴 사유 상세 — 직접입력(WD_INPUT)일 때 필수. 그 검사는 서비스에서 한다. */
            reasonDetail?: string;
        };
        AdminProfileEmailAvailabilityResponseDto: {
            /** @description true 면 이 이메일로 저장할 수 있다. */
            available: boolean;
        };
        BpProfileResponseDto: {
            /** @description 상호명. */
            tradeName: string;
            /** @description 사업자등록번호 — 하이픈 없이 숫자 10자리. 인증 결과로만 바뀐다. 미인증이면 빈 문자열. */
            bizRegistrationNumber: string;
            /** @description 대표자명. 인증 결과로만 바뀐다. 미인증이면 빈 문자열. */
            bizCeoName: string;
            /** @description 개업일자(YYYY-MM-DD). 인증 결과로만 바뀐다. 미인증이면 null. */
            bizOpenDate: string | null;
            /** @description 대표자 연락처 — 하이픈 없이 숫자. */
            bizCeoPhone: string;
            /** @description 대표자 이메일. */
            bizCeoEmail: string;
            /** @description 사업장 우편번호. */
            bizZipCode: string;
            /** @description 사업장 기본주소. */
            bizAddress: string;
            /** @description 사업장 상세주소. */
            bizAddressDetail: string;
            /** @description 업태. */
            bizCategory: string;
            /** @description 종목. */
            bizItem: string;
            /**
             * Format: date-time
             * @description 최종 인증일시 — 인증한 적 없으면 null.
             */
            bizVerifiedAt: string | null;
            /**
             * Format: date-time
             * @description 저장(PATCH)할 때 동시 수정 검사에 그대로 돌려줘야 하는 값 — 검사만 하는 인증(POST
             *     business-verification)은 저장이 아니라 받지 않는다.
             */
            updatedAt: string;
        };
        BpProfileUpdateDto: {
            /** @description 내 사업자정보 조회 응답의 updatedAt 그대로. 그사이 다른 저장이 있었으면 409. */
            updatedAt: string;
            /**
             * @description 상호명. 1~50자.
             * @example 한강상회
             */
            tradeName: string;
            /**
             * @description 대표자 연락처. 하이픈 없이 숫자 9~12자리(02 지역번호 · 050X 평생번호 포함). 비워 둘 수 있다.
             * @example 01012345678
             */
            bizCeoPhone?: string;
            /**
             * Format: email
             * @description 대표자 이메일. 비워 둘 수 있다.
             * @example ceo@hangang.co.kr
             */
            bizCeoEmail?: string;
            /**
             * @description 사업장 우편번호 — 주소 검색 컴포넌트가 고른 값만.
             * @example 04524
             */
            bizZipCode?: string;
            /**
             * @description 사업장 기본주소 — 주소 검색 컴포넌트가 고른 값만.
             * @example 서울특별시 중구 세종대로 110
             */
            bizAddress?: string;
            /**
             * @description 사업장 상세주소 — 직접 입력.
             * @example 3층
             */
            bizAddressDetail?: string;
            /**
             * @description 업태. 비워 둘 수 있다.
             * @example 도소매업
             */
            bizCategory?: string;
            /**
             * @description 종목. 비워 둘 수 있다.
             * @example 제과점
             */
            bizItem?: string;
            /**
             * @description POST /me/bp/business-verification 이 돌려준 10분짜리 토큰. 실으면 그 안의 사업자등록번호 ·
             *     대표자명 · 개업일자와 인증일시를 이 저장과 같은 트랜잭션에서 함께 반영한다(화면이 보낸 값은 믿지
             *     않는다 — admin-signup.service.ts 의 signup 과 같은 규칙). 비우면 인증 쪽 세 값은 그대로 둔다.
             */
            businessVerificationToken?: string;
            /**
             * @description 사업자등록번호 · 대표자명 · 개업일자 · 인증일시를 전부 비운다(사용자 결정, 2026-10-23) — 점포와
             *     달리 BP 자신의 사업자정보는 "다른 번호로 바꾸기"(재인증) 말고 "아예 지우기"도 된다. true 면 그 네
             *     칸을 null 로 쓴다. businessVerificationToken 과 함께 보내면 400(서비스에서 본다) — 같은 저장에서
             *     "새로 반영"과 "지우기"를 동시에 받을 수 없다. 구독 기록이 있으면 막아야 하지만(사용자 결정) 구독
             *     자체가 아직 없어(관련 테이블 없음, Manyfast S-JHQQNR 「1차 범위 밖」과 같은 이유) 지금은 검사하지
             *     않는다 — 구독이 생기면 여기에 그 검사를 더한다.
             */
            clearBusinessVerification?: boolean;
        };
        BpBusinessVerificationDto: {
            /**
             * @description 사업자등록번호. 하이픈을 넣어 보내도 숫자만 남겨 받는다.
             * @example 1058763602
             */
            bizRegistrationNumber: string;
            /**
             * @description 대표자명.
             * @example 김하늘
             */
            bizCeoName: string;
            /**
             * @description 개업일자(YYYY-MM-DD).
             * @example 2020-03-02
             */
            bizOpenDate: string;
        };
        BpBusinessVerificationResponseDto: {
            /**
             * @description 10분짜리 인증 토큰. 「저장」(PATCH /me/bp)의 businessVerificationToken 으로 그대로 보낸다 —
             *     그래야 세 값이 실제로 반영된다(점포 사업자정보와 같은 패턴).
             */
            verificationToken: string;
        };
        CodeItemsResponseDto: {
            /**
             * @example {
             *       "BANK": [
             *         {
             *           "value": "KB",
             *           "label": "국민은행",
             *           "order": 1
             *         }
             *       ]
             *     }
             */
            codes: {
                [key: string]: components["schemas"]["CodeValueDto"][];
            };
        };
        SignupDto: {
            /**
             * @description 영문 또는 영문·숫자 4~20자. 소문자로 정규화해 저장한다. 관리자 웹 로그인은 대소문자를 구분하므로(1팀),
             *     가입한 사람은 이 소문자 아이디로 로그인한다 — 가입 완료 화면이 응답의 loginId 를 보여 준다.
             */
            loginId: string;
            /** @description 영문·숫자·특수문자(!@#$%^&*()-_=+[]{}?)를 모두 포함해 8~20자 */
            password: string;
            /** @description 한글 또는 영문 2~20자 */
            name: string;
            /** @description 숫자만 9~12자리. 화면의 세 칸을 이어 붙인 값이다 */
            phone: string;
            /**
             * Format: email
             * @description 아이디 찾기·임시 비밀번호가 이 주소로 간다. 소문자로 정규화한다(admin_accounts_email_lower)
             */
            email: string;
            /** @description 상호명 1~50자. 사업자 인증 결과로 채우지 않고 직접 입력한다 */
            tradeName: string;
            /** @description 이용약관(TERMS_SERVICE) 동의. 필수라 true 만 받는다 */
            agreeTermsOfUse: boolean;
            /** @description 개인정보 수집·이용(PRIVACY_COLLECT) 동의. 필수라 true 만 받는다 */
            agreePrivacy: boolean;
            /**
             * @description 사업자정보 인증(선택)의 결과 토큰(POST /auth/signup/business-verifications, 10분). 사업자등록번호 ·
             *     대표자명 · 개업일자는 이 토큰에서 꺼내 저장한다 — 값을 따로 받지 않는다
             */
            bizVerificationToken?: string;
        };
        SignupResponseDto: {
            /**
             * @description 가입 완료 화면을 여는 토큰. 10분 동안만 쓸 수 있다. 액세스 토큰이 아니라 이것으로 API 를
             *     부를 수 없다 — 「웨일ERP 시작하기」가 이 토큰을 로그인 접속으로 바꾸는 API 는 관리자 웹 로그인과
             *     함께 만든다.
             */
            signupToken: string;
            /** @description 가입한 BP 상호명 */
            tradeName: string;
            /** @description 가입한 아이디(소문자로 정규화한 값) */
            loginId: string;
            /** @description 가입한 이메일(소문자로 정규화한 값). 가입 안내 메일이 가는 주소다 */
            email: string;
        };
        LoginIdAvailabilityDto: {
            /** @description 가입 화면의 아이디. 가입과 같이 소문자로 정규화해 본다 */
            loginId: string;
        };
        AvailabilityResponseDto: {
            /** @description 쓸 수 있으면 true. 누가 쓰는지는 알려 주지 않는다 */
            available: boolean;
        };
        SignupBusinessVerificationDto: {
            /** @description 숫자만 10자리. 화면이 하이픈을 걸러 보낸다 */
            bizRegistrationNumber: string;
            /** @description 대표자명 1~50자 */
            bizCeoName: string;
            /** @description 개업일자 YYYY-MM-DD. 실제로 있는 날짜만 받는다 */
            bizOpenDate: string;
        };
        SignupBusinessVerificationResponseDto: {
            /** @description 10분짜리 인증 토큰. 그 안에 가입 요청의 bizVerificationToken 으로 보낸다 */
            verificationToken: string;
        };
        EmailAvailabilityDto: {
            /**
             * Format: email
             * @description 가입 화면의 이메일. 가입과 같이 소문자로 정규화해 본다
             */
            email: string;
        };
        EnumValueDto: {
            /** @description 저장·전송 값. 예: PENDING_SEND */
            value: string;
            /** @description 화면에 보이는 한글. 예: 발송 대기 */
            label: string;
            /** @description 선택지 순서. 1부터. */
            order: number;
        };
        EnumCatalogResponseDto: {
            /**
             * @description enum 내용의 해시. 내용이 바뀌면 바뀐다 — 클라이언트는 이 값이 같으면 캐시를 그대로 쓴다.
             * @example 37eab9c919dce591
             */
            version: string;
            /**
             * @example {
             *       "ContractStatus": [
             *         {
             *           "value": "PENDING_SEND",
             *           "label": "발송 대기",
             *           "order": 1
             *         },
             *         {
             *           "value": "PENDING_SIGNATURE",
             *           "label": "서명 대기",
             *           "order": 2
             *         },
             *         {
             *           "value": "SIGNED",
             *           "label": "체결 완료",
             *           "order": 3
             *         }
             *       ]
             *     }
             */
            enums: {
                [key: string]: components["schemas"]["EnumValueDto"][];
            };
        };
        /**
         * @description 사용 상태.
         * @enum {string}
         */
        UseStatus: "ACTIVE" | "INACTIVE";
        CodeGroupResponseDto: {
            /**
             * @description 관리 주체. 공통코드 MANAGE_OWNER 값.
             * @enum {string}
             */
            manageOwnerCode: "PLATFORM_FIXED" | "PLATFORM_PROVIDED";
            /** @description 사용 상태. */
            status: components["schemas"]["UseStatus"];
            /**
             * @description 그룹 코드.
             * @example EMP_TYPE
             */
            groupCode: string;
            /** @description 그룹명. */
            groupName: string;
            /** @description BP 적용 여부. 플랫폼제공 그룹만 의미가 있다. */
            isBpApplied: boolean;
            /** @description 표시 순서. */
            sortOrder: number;
        };
        CodeGroupListResponseDto: {
            items: components["schemas"]["CodeGroupResponseDto"][];
            /** @description 조건에 맞는 전체 건수. */
            total: number;
        };
        CreateCodeGroupDto: {
            /**
             * @description 관리 주체. 플랫폼고정 · 플랫폼제공만. 등록 뒤 바꾸지 않는다.
             * @enum {string}
             */
            manageOwnerCode: "PLATFORM_FIXED" | "PLATFORM_PROVIDED";
            /**
             * @description 그룹 코드. 등록 뒤 바뀌지 않는다 — 수정 본문에서는 대상을 가리킬 뿐이다.
             * @example EMP_TYPE
             */
            groupCode: string;
            /** @description 그룹명. 앞뒤 공백을 지우고 1~50자. */
            groupName: string;
            /**
             * @description 사용 상태.
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE";
            /** @description 표시 순서. 화면이 끌어 옮긴 뒤 1부터 다시 매긴 값. */
            sortOrder: number;
        };
        CreateCodeGroupsDto: {
            /** @description 만들 그룹. 1~200행. 한 요청 안에서 그룹 코드가 겹치면 409. */
            items: components["schemas"]["CreateCodeGroupDto"][];
        };
        CodeGroupInputDto: {
            /**
             * @description 그룹 코드. 등록 뒤 바뀌지 않는다 — 수정 본문에서는 대상을 가리킬 뿐이다.
             * @example EMP_TYPE
             */
            groupCode: string;
            /** @description 그룹명. 앞뒤 공백을 지우고 1~50자. */
            groupName: string;
            /**
             * @description 사용 상태.
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE";
            /** @description 표시 순서. 화면이 끌어 옮긴 뒤 1부터 다시 매긴 값. */
            sortOrder: number;
        };
        UpdateCodeGroupsDto: {
            /** @description 고칠 그룹. 1~200행. 한 요청 안에서 그룹 코드가 겹치면 409. */
            items: components["schemas"]["CodeGroupInputDto"][];
        };
        CodeItemResponseDto: {
            /** @description 사용 상태. */
            status: components["schemas"]["UseStatus"];
            /**
             * @description 상세 코드.
             * @example FULL
             */
            itemCode: string;
            /**
             * @description 코드명.
             * @example 정규직
             */
            label: string;
            /** @description 표시 순서. */
            sortOrder: number;
        };
        CodeItemListResponseDto: {
            items: components["schemas"]["CodeItemResponseDto"][];
            /** @description 전체 건수. 상세 코드는 쪽을 나누지 않는다. */
            total: number;
        };
        CodeItemInputDto: {
            /**
             * @description 상세 코드. 등록 뒤 바뀌지 않는다 — 수정 본문에서는 대상을 가리킬 뿐이다. SERVICE 그룹이면 서비스 코드다.
             * @example FULL
             */
            itemCode: string;
            /**
             * @description 코드명. 앞뒤 공백을 지우고 1~50자. SERVICE 그룹이면 서비스명이다.
             * @example 정규직
             */
            label: string;
            /**
             * @description 사용 상태.
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE";
            /** @description 표시 순서. 화면이 끌어 옮긴 뒤 1부터 다시 매긴 값. */
            sortOrder: number;
        };
        CreateCodeItemsDto: {
            /** @description 만들 상세 코드. 1~500행. 한 요청 안에서 코드가 겹치면 409. */
            items: components["schemas"]["CodeItemInputDto"][];
        };
        UpdateCodeItemsDto: {
            /** @description 고칠 상세 코드. 1~500행. 한 요청 안에서 코드가 겹치면 409. */
            items: components["schemas"]["CodeItemInputDto"][];
        };
        DeleteCodeItemsDto: {
            /**
             * @description 지울 상세 코드. 1~500건, 등록과 같이 앞뒤 공백을 지우고 대문자로 받는다. 한 요청 안에서 겹치면 409.
             * @example [
             *       "INTERN"
             *     ]
             */
            itemCodes: string[];
        };
        BpApplicationResponseDto: {
            /** @description 적용 대상 BP 수(사용 중인 고객 BP). */
            bpCount: number;
            /** @description 복사한 플랫폼 원본 상세 코드 수. 지운 것은 빠지고 사용 안 함은 포함된다. */
            itemCount: number;
            /** @description 실제로 넣은 행 수. BP 에 이미 있던 행은 건너뛰어 세지 않는다. */
            createdCount: number;
        };
        /** @enum {string} */
        StoreType: "DIRECT" | "FRANCHISE";
        /** @enum {string} */
        BpAdminRole: "BA" | "FM" | "FA";
        /** @enum {string} */
        AdminAccountStatus: "ACTIVE" | "INACTIVE";
        BpAdminRoleGroupDto: {
            roleTypeCode: components["schemas"]["BpAdminRole"];
            roleGroupId: number;
            /**
             * @description 권한 코드.
             * @example BA000003
             */
            roleCode: string;
            name: string;
        };
        BpAdminSummaryResponseDto: {
            roleTypeCode: components["schemas"]["BpAdminRole"];
            accountStatus: components["schemas"]["AdminAccountStatus"];
            adminAccountId: number;
            loginId: string;
            name: string | null;
            roleGroup: components["schemas"]["BpAdminRoleGroupDto"];
            /** @description 전체 점포 담당. true 면 storeCount 는 0 */
            isAllStores: boolean;
            /** @description 매핑 점포 수(지운 점포 제외) */
            storeCount: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            lastLoginAt: string | null;
            /** @description 초기 비밀번호 미발송 — 등록 · 초기화 메일이 나가지 못했다. [비밀번호 초기화]로 다시 보낸다 */
            isInitialPasswordUnsent: boolean;
        };
        BpAdminListResponseDto: {
            items: components["schemas"]["BpAdminSummaryResponseDto"][];
            total: number;
            /** @description 상태 조건과 관계없이 같은 조건의 미사용 계정 수 */
            inactiveCount: number;
        };
        BpAdminRoleGroupListResponseDto: {
            items: components["schemas"]["BpAdminRoleGroupDto"][];
        };
        BpAdminStoreOptionDto: {
            storeTypeCode: components["schemas"]["StoreType"];
            storeId: number;
            storeCode: string;
            name: string;
            /** @description NOT_OPERATING · OPERATING — 폐점은 선택지에 없다 */
            storeStatusCode: string;
        };
        BpAdminStoreOptionListResponseDto: {
            items: components["schemas"]["BpAdminStoreOptionDto"][];
        };
        LoginIdAvailabilityResponseDto: {
            /** @description 쓸 수 있는가. 삭제한 계정의 아이디도 쓸 수 없다. */
            available: boolean;
        };
        BpAdminStoreDto: {
            storeId: number;
            storeCode: string;
            name: string;
            /** @description 공통코드 STORE_STATUS — NOT_OPERATING · OPERATING · CLOSED */
            storeStatusCode: string;
            /** @description 보는 사람의 관리 범위 밖 — 수정에서 「범위 밖 매핑」으로 읽기 전용, 저장해도 남는다 */
            isOutOfScope: boolean;
        };
        BpAdminAccountRefDto: {
            adminAccountId: number;
            loginId: string;
            name: string | null;
        };
        BpAdminActionsDto: {
            isSelf: boolean;
            canUpdate: boolean;
            canResetPassword: boolean;
            canChangeScope: boolean;
            canChangeRoleGroup: boolean;
        };
        BpAdminDetailResponseDto: {
            roleTypeCode: components["schemas"]["BpAdminRole"];
            accountStatus: components["schemas"]["AdminAccountStatus"];
            adminAccountId: number;
            loginId: string;
            name: string | null;
            roleGroup: components["schemas"]["BpAdminRoleGroupDto"];
            /** @description 전체 점포 담당. true 면 storeCount 는 0 */
            isAllStores: boolean;
            /** @description 매핑 점포 수(지운 점포 제외) */
            storeCount: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            lastLoginAt: string | null;
            /** @description 초기 비밀번호 미발송 — 등록 · 초기화 메일이 나가지 못했다. [비밀번호 초기화]로 다시 보낸다 */
            isInitialPasswordUnsent: boolean;
            phone: string | null;
            email: string | null;
            /** Format: date-time */
            statusChangedAt: string | null;
            createdByName: string | null;
            /** Format: date-time */
            updatedAt: string;
            updatedByName: string | null;
            /** @description 이 BP 의 지우지 않은 점포 수 — 「전체 점포 — 지금 N개점」 */
            bpStoreCount: number;
            /** @description 일부 점포일 때 매핑 점포, 이름순 */
            stores: components["schemas"]["BpAdminStoreDto"][];
            /** @description 가맹 관리자의 연결 가맹 마스터. 다른 역할은 null */
            franchiseMaster: components["schemas"]["BpAdminAccountRefDto"] | null;
            /** @description 역할 규칙으로 정한 버튼. 메뉴 권한(수정)은 화면이 함께 본다 */
            actions: components["schemas"]["BpAdminActionsDto"];
        };
        BpAdminHistoryResponseDto: {
            changeId: number;
            field: string;
            beforeValue: string | null;
            afterValue: string | null;
            /** Format: date-time */
            changedAt: string;
            changedByName: string | null;
        };
        BpAdminHistoryListResponseDto: {
            items: components["schemas"]["BpAdminHistoryResponseDto"][];
            total: number;
        };
        BpAdminUpdateImpactResponseDto: {
            /** @description 함께 미사용이 되는 사용 중 가맹 관리자 수 */
            deactivatedCount: number;
            firstDeactivatedLoginId: string | null;
            /** @description 점포 매핑이 빠지는 가맹 관리자 수 */
            unmappedCount: number;
            firstUnmappedLoginId: string | null;
        };
        CreateBpAdminDto: {
            /** @description 계정 역할. 본사는 BA · FM, 가맹 마스터는 FA 만. 등록 뒤 바꾸지 않는다. */
            roleTypeCode: components["schemas"]["BpAdminRole"];
            /**
             * @description 아이디. 영문 또는 영문 · 숫자 4~20자. 삭제 · 탈퇴한 계정까지 포함해 겹칠 수 없고 바꿀 수 없다.
             * @example jisu01
             */
            loginId: string;
            /**
             * @description 이름. 한글 · 영문 2~20자.
             * @example 한지수
             */
            name: string;
            /**
             * @description 연락처. 하이픈 없이 숫자 9~12자리 — 1팀 연락처 범위(02 지역번호 9자리 · 050X 평생번호 12자리)를
             *     그대로 받는다. 중복 검사는 하지 않는다.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 관리자 계정끼리 겹칠 수 없다.
             * @example jisu@whale.test
             */
            email: string;
            /** @description 권한 그룹. BP 관리자는 그 BP 의 BA 그룹, 가맹 마스터는 고정 FM000001, 가맹 관리자는 연결 가맹 마스터의 FA 그룹. */
            roleGroupId: number;
            /** @description 전체 점포. BP 관리자에게만, 전체 점포를 맡은 사람만 줄 수 있다. */
            isAllStores: boolean;
            /** @description 일부 점포일 때 맡길 점포 — 호출자의 관리 범위 안. 전체 점포면 무시한다. 1000개까지. */
            storeIds: number[];
        };
        CreateBpAdminResponseDto: {
            adminAccountId: number;
            /** @description 초기 비밀번호 메일을 보냈는가. false 면 계정은 남고 「미발송」으로 보인다 */
            isMailSent: boolean;
        };
        UpdateBpAdminDto: {
            /** @description 계정 상태. 가맹 마스터를 미사용으로 바꾸면 연결된 사용 중 가맹 관리자도 미사용이 된다. */
            accountStatus: components["schemas"]["AdminAccountStatus"];
            /** @description 상세에서 받은 최종수정일시 그대로. 그 사이 다른 사람이 고쳤으면 저장하지 않고 409. */
            updatedAt: string;
            /**
             * @description 이름. 한글 · 영문 2~20자.
             * @example 한지수
             */
            name: string;
            /**
             * @description 연락처. 하이픈 없이 숫자 9~12자리 — 1팀 연락처 범위(02 지역번호 9자리 · 050X 평생번호 12자리)를
             *     그대로 받는다. 중복 검사는 하지 않는다.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 관리자 계정끼리 겹칠 수 없다.
             * @example jisu@whale.test
             */
            email: string;
            /** @description 권한 그룹. BP 관리자는 그 BP 의 BA 그룹, 가맹 마스터는 고정 FM000001, 가맹 관리자는 연결 가맹 마스터의 FA 그룹. */
            roleGroupId: number;
            /** @description 전체 점포. BP 관리자에게만, 전체 점포를 맡은 사람만 줄 수 있다. */
            isAllStores: boolean;
            /** @description 일부 점포일 때 맡길 점포 — 호출자의 관리 범위 안. 전체 점포면 무시한다. 1000개까지. */
            storeIds: number[];
        };
        ResetBpAdminPasswordResponseDto: {
            isMailSent: boolean;
            /**
             * Format: date-time
             * @description 초기화가 올린 최종수정일시 — 다음 저장의 updatedAt 으로 쓴다
             */
            updatedAt: string;
        };
        BpCodeGroupResponseDto: {
            /**
             * @description 관리 주체 — 늘 플랫폼제공이다. 그룹 단계에는 BP전용이 없고, 플랫폼고정 그룹은 BP 화면에 보이지 않는다(목록 ·
             *     total 에서 빠진다, 2026-10-27 사용자 결정).
             * @enum {string}
             */
            manageOwnerCode: "PLATFORM_PROVIDED";
            /** @description 사용 상태(플랫폼이 정한다). BP 화면에는 사용 중인 그룹만 나오므로 늘 사용이다 — 사용중지 그룹은 목록에서 빠진다. */
            status: components["schemas"]["UseStatus"];
            /**
             * @description 그룹 코드.
             * @example EMP_TYPE
             */
            groupCode: string;
            /** @description 그룹명. */
            groupName: string;
            /** @description 표시 순서. */
            sortOrder: number;
        };
        BpCodeGroupListResponseDto: {
            items: components["schemas"]["BpCodeGroupResponseDto"][];
            /** @description 조건에 맞는 전체 건수. */
            total: number;
        };
        BpCodeItemResponseDto: {
            /** @description 사용 상태. */
            status: components["schemas"]["UseStatus"];
            /**
             * @description 관리 주체 — 플랫폼이 등록해 복사된 코드는 플랫폼제공, 이 BP 가 더하거나 되살린 코드는 BP전용.
             * @enum {string}
             */
            manageOwnerCode: "PLATFORM_PROVIDED" | "BP_ONLY";
            /**
             * @description 상세 코드. 등록 뒤 바뀌지 않는다.
             * @example FULL
             */
            itemCode: string;
            /**
             * @description 코드명. 플랫폼제공 그룹이면 이 BP 의 값(복사된 뒤 고쳤으면 고친 값)이다.
             * @example 정직원
             */
            label: string;
            /** @description 표시 순서. */
            sortOrder: number;
            /**
             * @description 플랫폼 원본이 사용중지인가(안내용). BP전용은 늘 거짓. 플랫폼제공 그룹에서 BP 는 이 값과 관계없이 사용 상태를
             *     자유롭게 바꾼다(2026-10-22 결정).
             */
            isPlatformInactive: boolean;
        };
        BpCodeItemListResponseDto: {
            items: components["schemas"]["BpCodeItemResponseDto"][];
            /** @description 전체 건수. 상세 코드는 쪽을 나누지 않는다. */
            total: number;
        };
        PlatformRoleGroupResponseDto: {
            /**
             * @description 권한 유형. 플랫폼 마스터 PM · 플랫폼 관리자 PA.
             * @enum {string}
             */
            roleTypeCode: "PM" | "PA";
            roleGroupId: number;
            /**
             * @description 권한 코드.
             * @example PA000001
             */
            roleCode: string;
            /** @description 권한명. */
            name: string;
        };
        PlatformAdminSummaryResponseDto: {
            /**
             * @description 계정 상태. 사용 · 미사용.
             * @enum {string}
             */
            accountStatus: "ACTIVE" | "INACTIVE";
            adminAccountId: number;
            /**
             * @description 아이디.
             * @example seojun01
             */
            loginId: string;
            name: string | null;
            /** @description 사용자 권한 */
            roleGroup: components["schemas"]["PlatformRoleGroupResponseDto"];
            phone: string | null;
            email: string | null;
            /**
             * Format: date-time
             * @description 최근 로그인. 없으면 null — 화면은 「로그인 기록 없음」.
             */
            lastLoginAt: string | null;
            /**
             * Format: date-time
             * @description 등록일시
             */
            createdAt: string;
            /** @description 초기 비밀번호 미발송 — 계정 생성 · 초기화 메일이 실패했다. 다시 초기화하면 보낸다. */
            isInitialPasswordUnsent: boolean;
        };
        PlatformAdminListResponseDto: {
            items: components["schemas"]["PlatformAdminSummaryResponseDto"][];
            /** @description 조건에 맞는 전체 건수 */
            total: number;
            /** @description 검색어 · 권한 조건에 맞는 미사용 계정 수 — 목록 머리의 「미사용 N」. 상태 조건은 보지 않는다(사용만 골라도 센다) */
            inactiveCount: number;
        };
        PlatformRoleGroupListResponseDto: {
            items: components["schemas"]["PlatformRoleGroupResponseDto"][];
        };
        PlatformAdminDetailResponseDto: {
            /**
             * @description 계정 상태. 사용 · 미사용.
             * @enum {string}
             */
            accountStatus: "ACTIVE" | "INACTIVE";
            adminAccountId: number;
            /**
             * @description 아이디.
             * @example seojun01
             */
            loginId: string;
            name: string | null;
            /** @description 사용자 권한 */
            roleGroup: components["schemas"]["PlatformRoleGroupResponseDto"];
            phone: string | null;
            email: string | null;
            /**
             * Format: date-time
             * @description 최근 로그인. 없으면 null — 화면은 「로그인 기록 없음」.
             */
            lastLoginAt: string | null;
            /**
             * Format: date-time
             * @description 등록일시
             */
            createdAt: string;
            /** @description 초기 비밀번호 미발송 — 계정 생성 · 초기화 메일이 실패했다. 다시 초기화하면 보낸다. */
            isInitialPasswordUnsent: boolean;
            department: string | null;
            jobTitle: string | null;
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            /**
             * Format: date-time
             * @description 계정 상태가 바뀐 일시 — 미사용이면 「언제부터 미사용」
             */
            statusChangedAt: string | null;
            /** @description 등록자 이름. 시스템이 만든 계정이면 null. */
            createdByName: string | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 수정할 때 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            /** @description 최종수정자 이름. 등록 뒤 고친 적이 없으면 null. */
            updatedByName: string | null;
        };
        PlatformAdminHistoryResponseDto: {
            changeId: number;
            /** @description 변경 항목. */
            field: string;
            beforeValue: string | null;
            afterValue: string | null;
            /** Format: date-time */
            changedAt: string;
            /** @description 처리자 이름. 시스템이 처리했으면 null. */
            changedByName: string | null;
        };
        PlatformAdminHistoryListResponseDto: {
            items: components["schemas"]["PlatformAdminHistoryResponseDto"][];
            total: number;
        };
        CreatePlatformAdminDto: {
            /**
             * @description 아이디. 영문 또는 영문 · 숫자 4~20자. 삭제한 계정까지 포함해 겹칠 수 없고 바꿀 수 없다.
             * @example seojun01
             */
            loginId: string;
            /**
             * @description 이름. 한글 · 영문 2~20자.
             * @example 이서준
             */
            name: string;
            /**
             * @description 연락처. 하이픈 없이 숫자 9~12자리.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 계정끼리 겹칠 수 없다.
             * @example seojun@whale.test
             */
            email: string;
            /** @description 소속 부서. 선택, 30자까지. */
            department?: string | null;
            /** @description 직책. 선택, 30자까지. */
            jobTitle?: string | null;
            /** @description 우편번호. 선택 — 주소 검색 결과로 채운다. */
            zipCode?: string | null;
            /** @description 기본주소. 선택 — 주소 검색 결과로 채운다. */
            address?: string | null;
            /** @description 상세주소. 선택, 100자까지. */
            addressDetail?: string | null;
            /** @description 사용자 권한 — 플랫폼 BP 의 PM · PA 권한 그룹 하나. 플랫폼 관리자는 PM 그룹을 줄 수 없다. */
            roleGroupId: number;
        };
        CreatePlatformAdminResponseDto: {
            adminAccountId: number;
            /** @description 초기 비밀번호 메일을 보냈는가. 실패해도 계정은 만들어졌다 — 상세에서 비밀번호 초기화로 다시 보낸다. */
            isMailSent: boolean;
        };
        UpdatePlatformAdminDto: {
            /**
             * @description 계정 상태. 사용 · 미사용. 미사용이면 다음 요청부터 메뉴 권한을 보는 API 가 403 으로 막는다(이미 받은 토큰 · 세션은 그대로).
             * @enum {string}
             */
            accountStatus: "ACTIVE" | "INACTIVE";
            /** @description 상세에서 받은 최종수정일시 그대로. 그 사이 다른 사람이 고쳤으면 저장하지 않고 409. */
            updatedAt: string;
            /**
             * @description 이름. 한글 · 영문 2~20자.
             * @example 이서준
             */
            name: string;
            /**
             * @description 연락처. 하이픈 없이 숫자 9~12자리.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 계정끼리 겹칠 수 없다.
             * @example seojun@whale.test
             */
            email: string;
            /** @description 소속 부서. 선택, 30자까지. */
            department?: string | null;
            /** @description 직책. 선택, 30자까지. */
            jobTitle?: string | null;
            /** @description 우편번호. 선택 — 주소 검색 결과로 채운다. */
            zipCode?: string | null;
            /** @description 기본주소. 선택 — 주소 검색 결과로 채운다. */
            address?: string | null;
            /** @description 상세주소. 선택, 100자까지. */
            addressDetail?: string | null;
            /** @description 사용자 권한 — 플랫폼 BP 의 PM · PA 권한 그룹 하나. 플랫폼 관리자는 PM 그룹을 줄 수 없다. */
            roleGroupId: number;
        };
        ResetPasswordResponseDto: {
            /** @description 초기화 메일을 보냈는가. 실패해도 기존 비밀번호는 이미 막혔다 — 다시 초기화한다. */
            isMailSent: boolean;
            /**
             * Format: date-time
             * @description 초기화 뒤의 최종수정일시. 초기화가 이 값을 올리므로, 상세 화면은 다음 수정 저장에 이 값을 쓴다.
             */
            updatedAt: string;
        };
        BpRoleGroupManagerResponseDto: {
            adminAccountId: number;
            loginId: string;
            name: string | null;
        };
        RoleGroupActorResponseDto: {
            name: string | null;
            loginId: string;
        };
        BpRoleGroupSummaryResponseDto: {
            /**
             * @description 권한 유형 — BP 관리자 BA · 가맹 관리자 FA. 한글은 공통코드 ROLE_TYPE.
             * @enum {string}
             */
            roleTypeCode: "BA" | "FA";
            /** @description 관리계정 — FA 그룹을 만든 가맹 마스터. BA 는 null. */
            manager: components["schemas"]["BpRoleGroupManagerResponseDto"] | null;
            /** @description 호출자 본인이 연결된 그룹인가 — 「본인」 배지. */
            isSelfLinked: boolean;
            /** @description 조회가 켜진 메뉴 수(묶음 메뉴 포함) — 「등록 N개」. 0 이면 「미등록」. */
            menuCount: number;
            roleGroupId: number;
            /**
             * @description 권한 코드 — 유형 + 6자리.
             * @example PA000002
             */
            roleCode: string;
            /** @description 권한명. */
            name: string;
            description: string | null;
            /** @description 고정 권한(PM000001 · BM000001 · FM000001 같은 마이그레이션 시드). 지울 수 없다. */
            isMaster: boolean;
            /** @description 메뉴 등록 여부 — 서비스와 관계없이 조회가 켜진 메뉴가 하나라도 있으면 true. 아니면 「미등록」. */
            isMenuRegistered: boolean;
            /** Format: date-time */
            createdAt: string;
            createdBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 권한명 · 설명 수정, 메뉴 저장, 삭제가 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            updatedBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /** @description 연결된 지우지 않은 관리자 수(미사용 포함) — 삭제 대화상자가 대체 권한을 고르게 할지 가른다. */
            adminCount: number;
        };
        BpRoleGroupListResponseDto: {
            /**
             * @description 이 호출자가 등록할 때 만들어지는 유형 — BP 마스터 BA, 가맹 마스터 FA, 나머지 null(등록 불가). 메뉴 등록 권한은
             *     보지 않는다 — 화면은 메뉴 권한과 합쳐 버튼을 보인다.
             * @enum {string|null}
             */
            creatableRoleTypeCode: "BA" | "FA" | null;
            /** @description 권한 코드 순(BA 다음 FA). 고정 권한 · 지운 그룹은 싣지 않는다. */
            items: components["schemas"]["BpRoleGroupSummaryResponseDto"][];
            total: number;
        };
        CreatePlatformRoleGroupDto: {
            /** @description 권한명. 앞뒤 공백을 지우고 1~20자. 플랫폼 권한(PM · PA · BM · FM) 안에서 겹칠 수 없다. */
            name: string;
            /**
             * @description 설명. 선택, 앞뒤 공백을 지우고 100자까지. 비우면 null.
             * @example 커뮤니티관리·BP 조회
             */
            description?: string | null;
        };
        CreatePlatformRoleGroupResponseDto: {
            roleGroupId: number;
            /**
             * @description 채번한 권한 코드.
             * @example PA000005
             */
            roleCode: string;
        };
        /**
         * @description 바꿀 수 없는 이유. 한글은 GET /enums/PlatformRoleMenuBlockReason. 바꿀 수 있으면 null.
         * @enum {string}
         */
        PlatformRoleMenuBlockReason: "PM_FIXED" | "READ_ONLY" | "SELF_LINKED" | "PLATFORM_MENU_FOR_BP" | "OUT_OF_SCOPE";
        RoleGroupMenuCellResponseDto: {
            /** @description 바꿀 수 없는 이유. 한글은 GET /enums/PlatformRoleMenuBlockReason. 바꿀 수 있으면 null. */
            blockedReason: components["schemas"]["PlatformRoleMenuBlockReason"] | null;
            value: boolean;
            /** @description 바꿀 수 있는가. */
            editable: boolean;
        };
        RoleGroupMenuNodeResponseDto: {
            menuId: number;
            /** @example MN000213 */
            menuCode: string;
            name: string;
            /** @description 단계 1~3 */
            depth: number;
            /** @description 묶음 메뉴 — 보이는 하위가 있다. 칸은 서버가 하위에서 다시 정한다(하위에 조회가 있으면 조회만). */
            isGroup: boolean;
            read: components["schemas"]["RoleGroupMenuCellResponseDto"];
            create: components["schemas"]["RoleGroupMenuCellResponseDto"];
            update: components["schemas"]["RoleGroupMenuCellResponseDto"];
            delete: components["schemas"]["RoleGroupMenuCellResponseDto"];
            children: components["schemas"]["RoleGroupMenuNodeResponseDto"][];
        };
        RoleGroupMenuServiceResponseDto: {
            /**
             * @description 공통코드 SERVICE.
             * @example PLATFORM
             */
            serviceCode: string;
            name: string;
            /** @description 보이는 메뉴 트리. 비면 「이 서비스에 등록된 메뉴가 없습니다」. */
            menus: components["schemas"]["RoleGroupMenuNodeResponseDto"][];
        };
        BpRoleGroupMenuTreeResponseDto: {
            /** @enum {string} */
            roleTypeCode: "BA" | "FA" | "FM";
            roleGroupId: number;
            roleCode: string;
            name: string;
            /**
             * Format: date-time
             * @description 저장할 때 그대로 돌려보낸다.
             */
            updatedAt: string;
            /**
             * @description 저장할 수 있는가 — 플랫폼 마스터 권한 · 권한 관리 수정 권한 없음 · 본인 연결이면 false. 칸이 본인 범위 밖으로
             *     막힌 것은 여기서 보지 않는다(칸별 blockedReason).
             */
            isSavable: boolean;
            /** @description 사용 중인 서비스(공통코드 SERVICE 순서)별 메뉴. 숨겨진 메뉴는 빠진다. */
            services: components["schemas"]["RoleGroupMenuServiceResponseDto"][];
        };
        /**
         * @description 고칠 수 없는 이유. 한글은 GET /enums/PlatformRoleGroupLockReason.
         * @enum {string}
         */
        PlatformRoleGroupLockReason: "FIXED_ROLE" | "NO_PERMISSION" | "SELF_LINKED";
        BpRoleGroupDetailResponseDto: {
            /**
             * @description 권한 유형 — BP 관리자 BA · 가맹 관리자 FA. 한글은 공통코드 ROLE_TYPE.
             * @enum {string}
             */
            roleTypeCode: "BA" | "FA";
            /** @description 고칠 수 없는 이유. 한글은 GET /enums/PlatformRoleGroupLockReason. */
            editBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            deleteBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            /**
             * @description 역할로 권한명 · 설명을 고칠 수 있는가 — BM 은 그 BP 의 BA, FM 은 본인 FA. 본인이 연결된 그룹도 고친다(재영
             *     2026-10-30). false 의 이유는 editBlockedReason. 메뉴 칸은 메뉴 트리의 칸별 값을 본다(본인 연결은 거기서 막힌다).
             */
            isEditable: boolean;
            /**
             * @description 역할로 지울 수 있고 본인이 연결된 그룹도 아닌가. false 의 이유는 deleteBlockedReason. 연결 사용자가 있는데 대체
             *     후보가 없는 것은 삭제 후보 조회로 알린다.
             */
            isDeletable: boolean;
            /** @description 관리계정 — FA 그룹을 만든 가맹 마스터. BA 는 null. */
            manager: components["schemas"]["BpRoleGroupManagerResponseDto"] | null;
            /** @description 호출자 본인이 연결된 그룹인가 — 「본인」 배지. */
            isSelfLinked: boolean;
            /** @description 조회가 켜진 메뉴 수(묶음 메뉴 포함) — 「등록 N개」. 0 이면 「미등록」. */
            menuCount: number;
            roleGroupId: number;
            /**
             * @description 권한 코드 — 유형 + 6자리.
             * @example PA000002
             */
            roleCode: string;
            /** @description 권한명. */
            name: string;
            description: string | null;
            /** @description 고정 권한(PM000001 · BM000001 · FM000001 같은 마이그레이션 시드). 지울 수 없다. */
            isMaster: boolean;
            /** @description 메뉴 등록 여부 — 서비스와 관계없이 조회가 켜진 메뉴가 하나라도 있으면 true. 아니면 「미등록」. */
            isMenuRegistered: boolean;
            /** Format: date-time */
            createdAt: string;
            createdBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 권한명 · 설명 수정, 메뉴 저장, 삭제가 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            updatedBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /** @description 연결된 지우지 않은 관리자 수(미사용 포함) — 삭제 대화상자가 대체 권한을 고르게 할지 가른다. */
            adminCount: number;
        };
        UpdatePlatformRoleGroupDto: {
            /** @description 상세에서 받은 최종수정일시 그대로. 그 사이 다른 사람이 고쳤으면 저장하지 않고 409. */
            updatedAt: string;
            /** @description 권한명. 앞뒤 공백을 지우고 1~20자. 플랫폼 권한(PM · PA · BM · FM) 안에서 겹칠 수 없다. */
            name: string;
            /**
             * @description 설명. 선택, 앞뒤 공백을 지우고 100자까지. 비우면 null.
             * @example 커뮤니티관리·BP 조회
             */
            description?: string | null;
        };
        RoleGroupMenuCellsDto: {
            menuId: number;
            read: boolean;
            create: boolean;
            update: boolean;
            delete: boolean;
        };
        SaveRoleGroupMenusDto: {
            /** @description 메뉴 트리 · 상세에서 받은 최종수정일시 그대로. 그 사이 다른 사람이 고쳤으면 저장하지 않고 409. */
            updatedAt: string;
            menus: components["schemas"]["RoleGroupMenuCellsDto"][];
        };
        SaveRoleGroupMenusResponseDto: {
            /**
             * Format: date-time
             * @description 저장 뒤 최종수정일시. 이어서 권한명 · 설명이나 메뉴를 저장할 때 이 값을 보낸다.
             */
            updatedAt: string;
        };
        PreviewRoleGroupMenusDto: {
            menus: components["schemas"]["RoleGroupMenuCellsDto"][];
        };
        RoleGroupMenuRevocationPreviewResponseDto: {
            revokedCells: number;
            affectedRoleGroupCount: number;
            affectedAdminCount: number;
        };
        DeletionCandidateAdminResponseDto: {
            adminAccountId: number;
            loginId: string;
            name: string | null;
            /** @description 계정 상태 — 사용 ACTIVE · 미사용 INACTIVE */
            accountStatusCode: string;
        };
        DeletionCandidateRoleGroupResponseDto: {
            roleGroupId: number;
            roleCode: string;
            name: string;
        };
        RoleGroupDeletionCandidatesResponseDto: {
            /** @description 옮겨야 할 연결 사용자 — 지우지 않은 관리자(미사용 포함). 비어 있으면 대체 권한 없이 지운다. */
            admins: components["schemas"]["DeletionCandidateAdminResponseDto"][];
            /** @description 대체 권한 후보 — 같은 유형(PA)의 지우지 않은 다른 추가 권한. 고정 권한은 빠진다. */
            candidates: components["schemas"]["DeletionCandidateRoleGroupResponseDto"][];
        };
        DeletePlatformRoleGroupDto: {
            updatedAt: string;
            /** @description 대체 권한 — 같은 유형(PA)의 지우지 않은 다른 추가 권한. 고정 권한은 고를 수 없다. */
            replacementRoleGroupId?: number;
        };
        PlatformRoleGroupSummaryResponseDto: {
            /**
             * @description 권한 유형 — 플랫폼 마스터 PM · 플랫폼 관리자 PA · BP 마스터 BM · 가맹 마스터 FM. 한글은 공통코드 ROLE_TYPE.
             * @enum {string}
             */
            roleTypeCode: "PM" | "PA" | "BM" | "FM";
            roleGroupId: number;
            /**
             * @description 권한 코드 — 유형 + 6자리.
             * @example PA000002
             */
            roleCode: string;
            /** @description 권한명. */
            name: string;
            description: string | null;
            /** @description 고정 권한(PM000001 · BM000001 · FM000001 같은 마이그레이션 시드). 지울 수 없다. */
            isMaster: boolean;
            /** @description 메뉴 등록 여부 — 서비스와 관계없이 조회가 켜진 메뉴가 하나라도 있으면 true. 아니면 「미등록」. */
            isMenuRegistered: boolean;
            /** Format: date-time */
            createdAt: string;
            createdBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 권한명 · 설명 수정, 메뉴 저장, 삭제가 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            updatedBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /** @description 연결된 지우지 않은 관리자 수(미사용 포함) — 삭제 대화상자가 대체 권한을 고르게 할지 가른다. */
            adminCount: number;
        };
        PlatformRoleGroupSummaryListResponseDto: {
            /** @description 고정 권한 PM · PA · BM · FM 다음 플랫폼 관리자 추가 권한을 코드 순으로. BP 관리자 · 가맹 관리자 그룹은 싣지 않는다. */
            items: components["schemas"]["PlatformRoleGroupSummaryResponseDto"][];
            total: number;
        };
        PlatformRoleGroupDetailResponseDto: {
            /**
             * @description 권한 유형 — 플랫폼 마스터 PM · 플랫폼 관리자 PA · BP 마스터 BM · 가맹 마스터 FM. 한글은 공통코드 ROLE_TYPE.
             * @enum {string}
             */
            roleTypeCode: "PM" | "PA" | "BM" | "FM";
            /** @description 고칠 수 없는 이유. 고칠 수 있으면 null. 한글은 GET /enums/PlatformRoleGroupLockReason. */
            editBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            deleteBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            /** @description 권한명 · 설명을 고칠 수 있는가. 본인이 연결된 권한도 고친다(재영 2026-10-30). 메뉴 칸은 메뉴 트리의 칸별 값을 본다. */
            isEditable: boolean;
            /** @description 지울 수 있는가. 연결 사용자가 있는데 대체 후보가 없는 것은 삭제 후보 조회로 알린다. */
            isDeletable: boolean;
            roleGroupId: number;
            /**
             * @description 권한 코드 — 유형 + 6자리.
             * @example PA000002
             */
            roleCode: string;
            /** @description 권한명. */
            name: string;
            description: string | null;
            /** @description 고정 권한(PM000001 · BM000001 · FM000001 같은 마이그레이션 시드). 지울 수 없다. */
            isMaster: boolean;
            /** @description 메뉴 등록 여부 — 서비스와 관계없이 조회가 켜진 메뉴가 하나라도 있으면 true. 아니면 「미등록」. */
            isMenuRegistered: boolean;
            /** Format: date-time */
            createdAt: string;
            createdBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 권한명 · 설명 수정, 메뉴 저장, 삭제가 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            updatedBy: components["schemas"]["RoleGroupActorResponseDto"] | null;
            /** @description 연결된 지우지 않은 관리자 수(미사용 포함) — 삭제 대화상자가 대체 권한을 고르게 할지 가른다. */
            adminCount: number;
        };
        RoleGroupMenuTreeResponseDto: {
            /** @enum {string} */
            roleTypeCode: "PM" | "PA" | "BM" | "FM";
            roleGroupId: number;
            roleCode: string;
            name: string;
            /**
             * Format: date-time
             * @description 저장할 때 그대로 돌려보낸다.
             */
            updatedAt: string;
            /**
             * @description 저장할 수 있는가 — 플랫폼 마스터 권한 · 권한 관리 수정 권한 없음 · 본인 연결이면 false. 칸이 본인 범위 밖으로
             *     막힌 것은 여기서 보지 않는다(칸별 blockedReason).
             */
            isSavable: boolean;
            /** @description 사용 중인 서비스(공통코드 SERVICE 순서)별 메뉴. 숨겨진 메뉴는 빠진다. */
            services: components["schemas"]["RoleGroupMenuServiceResponseDto"][];
        };
        PlatformMenuServiceResponseDto: {
            /** @description 서비스 사용 상태. 사용중지 서비스도 고르고 편집할 수 있지만 사용자 화면에는 보이지 않는다. */
            status: components["schemas"]["UseStatus"];
            /**
             * @description 서비스 코드.
             * @example PLATFORM
             */
            serviceCode: string;
            /** @description 서비스 이름(공통코드 표시명). */
            name: string;
            /** @description 지우지 않은 메뉴 수. */
            menuCount: number;
            /** @description 그중 사용 상태가 사용인 메뉴 수(상위가 사용중지라 숨은 것도 센다). */
            activeMenuCount: number;
            inactiveMenuCount: number;
        };
        PlatformMenuServiceListResponseDto: {
            items: components["schemas"]["PlatformMenuServiceResponseDto"][];
            total: number;
        };
        PlatformMenuServiceRefResponseDto: {
            status: components["schemas"]["UseStatus"];
            serviceCode: string;
            name: string;
        };
        PlatformMenuNodeResponseDto: {
            status: components["schemas"]["UseStatus"];
            children: components["schemas"]["PlatformMenuNodeResponseDto"][];
            menuId: number;
            /**
             * @description 메뉴 코드 — MN + 6자리.
             * @example MN000215
             */
            menuCode: string;
            /** @description 노출 메뉴명. */
            name: string;
            /** @description 메뉴 URL. 묶음 메뉴는 보통 null. */
            url: string | null;
            /** @description 메뉴 계층 1~3. */
            depth: number;
            /** @description 형제 안의 순서 — 1부터. */
            sortOrder: number;
            /** @description 하위가 있는 메뉴(묶음). */
            isGroup: boolean;
            /** @description 사용자 화면에 보이지 않는가 — 자신 · 조상 · 서비스 중 하나라도 사용중지. 자기 상태 값은 사용일 수 있다. */
            isHidden: boolean;
        };
        PlatformMenuTreeResponseDto: {
            service: components["schemas"]["PlatformMenuServiceRefResponseDto"];
            items: components["schemas"]["PlatformMenuNodeResponseDto"][];
            total: number;
        };
        PlatformMenuParentResponseDto: {
            menuId: number;
            menuCode: string;
            name: string;
        };
        PlatformMenuActorResponseDto: {
            name: string | null;
            loginId: string;
        };
        PlatformMenuDetailResponseDto: {
            status: components["schemas"]["UseStatus"];
            menuId: number;
            menuCode: string;
            serviceCode: string;
            serviceName: string;
            /** @description 상위 메뉴. 최상위(1단계)면 null. */
            parent: components["schemas"]["PlatformMenuParentResponseDto"] | null;
            /**
             * @description 최상위부터 이 메뉴까지의 노출 메뉴명.
             * @example [
             *       "시스템관리",
             *       "플랫폼 메뉴 관리"
             *     ]
             */
            path: string[];
            name: string;
            url: string | null;
            depth: number;
            sortOrder: number;
            isGroup: boolean;
            /** @description 사용자 화면에 보이지 않는가 — 자신 · 조상 · 서비스 중 하나라도 사용중지. 사용중지 상위 아래의 메뉴면 「사용자에게는 보이지 않는다」를 알린다. */
            isHidden: boolean;
            /** Format: date-time */
            createdAt: string;
            createdBy: components["schemas"]["PlatformMenuActorResponseDto"] | null;
            /**
             * Format: date-time
             * @description 최종수정일시 — 저장할 때 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            updatedBy: components["schemas"]["PlatformMenuActorResponseDto"] | null;
        };
        CreatePlatformMenuDto: {
            /** @description 사용 상태. 생략하면 사용(ACTIVE). */
            status?: components["schemas"]["UseStatus"];
            /**
             * @description 서비스 코드 — 공통코드 SERVICE 값(사용중지 서비스도 된다).
             * @example PLATFORM
             */
            serviceCode: string;
            /** @description 상위 메뉴. 생략하거나 null 이면 최상위(1단계). 같은 서비스의 2단계까지의 메뉴여야 한다. */
            parentMenuId?: number | null;
            /** @description 노출 메뉴명. 앞뒤 공백을 지우고 1~20자. 같은 상위 아래 같은 이름도 받는다. */
            name: string;
            /**
             * @description 메뉴 URL. 선택 — 하위를 묶기만 하는 메뉴는 비운다(비우면 null). `/소문자-숫자` 구간, 200자까지. 새로 넣는 URL 은
             *     1뎁스 한 구간만 받는다(`/staff/content` 가 아니라 `/staff-content` — 등록과, 수정에서 바꿀 때 400). 그대로 둔 기존 URL 은
             *     여러 구간이어도 받는다. 사용 중 메뉴끼리 같거나 한쪽이 다른 쪽 아래 경로면 409.
             * @example /staff-content
             */
            url?: string | null;
        };
        CreatePlatformMenuResponseDto: {
            menuId: number;
            /**
             * @description 저장할 때 채번한 메뉴 코드.
             * @example MN000223
             */
            menuCode: string;
        };
        UpdatePlatformMenuDto: {
            /** @description 사용 상태. 미사용이면 사용자 화면과 신규 권한 부여에서 빠지고, 이미 준 권한은 남는다. */
            status: components["schemas"]["UseStatus"];
            /** @description 상세에서 받은 최종수정일시 그대로. 그 사이 다른 사람이 고쳤으면 저장하지 않고 409. */
            updatedAt: string;
            /** @description 노출 메뉴명. 앞뒤 공백을 지우고 1~20자. 같은 상위 아래 같은 이름도 받는다. */
            name: string;
            /**
             * @description 메뉴 URL. 선택 — 하위를 묶기만 하는 메뉴는 비운다(비우면 null). `/소문자-숫자` 구간, 200자까지. 새로 넣는 URL 은
             *     1뎁스 한 구간만 받는다(`/staff/content` 가 아니라 `/staff-content` — 등록과, 수정에서 바꿀 때 400). 그대로 둔 기존 URL 은
             *     여러 구간이어도 받는다. 사용 중 메뉴끼리 같거나 한쪽이 다른 쪽 아래 경로면 409.
             * @example /staff-content
             */
            url?: string | null;
        };
        MovePlatformMenuDto: {
            /** @description 새 상위 메뉴. null 이면 최상위. */
            parentMenuId: number | null;
            /** @description 새 상위 아래의 자리 — 0 이 맨 앞, 형제 수 이상이면 맨 끝. */
            index: number;
        };
        PublicHolidayResponseDto: {
            publicHolidayId: number;
            /**
             * @description 날짜.
             * @example 2026-03-02
             */
            holidayDate: string;
            /**
             * @description 휴일명.
             * @example 삼일절
             */
            name: string;
            /**
             * @description 비고. 없으면 null(대체공휴일이면 그 사유).
             * @example 대체공휴일 — 삼일절
             */
            note: string | null;
        };
        PublicHolidaySynchronizationResponseDto: {
            /**
             * @description 성공한 마지막 동기화 시각(ISO 8601). 동기화한 적이 없으면 null.
             * @example 2026-09-01T03:00:00.000Z
             */
            lastSynchronizedAt: string | null;
            /**
             * @description 올해 · 다음 해(한국 날짜 기준) 중 마지막 동기화가 실패한 연도. 없으면 빈 배열.
             * @example [
             *       2027
             *     ]
             */
            failedYears: number[];
        };
        PublicHolidayListResponseDto: {
            /** @description 고른 연도. */
            year: number;
            /** @description 고른 월. 연도 전체를 조회했으면 null. */
            month: number | null;
            items: components["schemas"]["PublicHolidayResponseDto"][];
            /** @description 공식 휴일 수(고른 달, 또는 그 해). */
            total: number;
            synchronization: components["schemas"]["PublicHolidaySynchronizationResponseDto"];
        };
        BpListItemResponseDto: {
            bpCodeId: number;
            /** @example BP000012 */
            bpCode: string;
            /**
             * @description 상호.
             * @example 고래커피
             */
            tradeName: string;
            /**
             * @description 공통코드 `ACCOUNT_STATUS` 값 그대로(사용 · 미사용 · 탈퇴).
             * @example ACTIVE
             */
            accountStatusCode: string;
        };
        BpListResponseDto: {
            /** @description 최신 등록순. 미삭제 고객 BP 를 상태와 상관없이(withMaster 면 BP 마스터 계정이 있는 BP 만). */
            items: components["schemas"]["BpListItemResponseDto"][];
            total: number;
        };
        BpStoreListResponseDto: {
            /** @description 점포 이름순. 운영 상태와 상관없이 미삭제 점포 전체. 항목 모양은 로그인 정보의 `stores` 와 같다. */
            items: components["schemas"]["AdminStoreDto"][];
            total: number;
        };
        BpStoresVersionResponseDto: {
            /**
             * @description 점포 목록 버전 — 이전에 받은 값과 다르면 점포 목록을 다시 받는다. 형식은 정해 두지 않으니 비교에만 쓴다.
             * @example q3Zr8l0b2nXyK1pV0aWmTg
             */
            version: string;
        };
        BpMasterSummaryResponseDto: {
            /**
             * @description BP 상태. 사용 · 미사용 · 탈퇴.
             * @enum {string}
             */
            accountStatus: "ACTIVE" | "INACTIVE" | "WITHDRAWN";
            /**
             * @description 가입경로. 회원가입 · 플랫폼등록.
             * @enum {string}
             */
            joinPath: "SIGNUP" | "PLATFORM_REGISTERED";
            bpCodeId: number;
            /**
             * @description BP 코드.
             * @example BP000012
             */
            bpCode: string;
            /**
             * @description BP 마스터 아이디. 탈퇴해도 남는다.
             * @example hangang01
             */
            loginId: string;
            /** @description BP 마스터 이름 · 연락처 · 이메일. 탈퇴한 BP 는 null — 화면은 「탈퇴로 삭제됨」. */
            name: string | null;
            phone: string | null;
            email: string | null;
            /** @description 상호명 */
            tradeName: string;
            /** @description 사업자등록번호(숫자 10자리). 미인증이면 null. */
            bizRegistrationNumber: string | null;
            /**
             * Format: date-time
             * @description 등록 일시
             */
            createdAt: string;
            /** @description 등록자 이름. 회원가입한 BP 는 null. */
            createdByName: string | null;
        };
        BpMasterListResponseDto: {
            items: components["schemas"]["BpMasterSummaryResponseDto"][];
            /** @description 조건에 맞는 전체 건수 */
            total: number;
        };
        ExcelScheduledResponseDto: {
            /**
             * @description 다운로드 이력 ID — 메일 링크와 `GET /excel-downloads/{id}` 가 쓴다.
             * @example 41
             */
            excelDownloadId: number;
            /**
             * @description 담길 건수(요청 때 센 값).
             * @example 12480
             */
            rowCount: number;
            /** @description 화면에 그대로 보일 안내. */
            message: string;
        };
        VerifyBpMasterBusinessDto: {
            /**
             * @description 사업자등록번호. 하이픈을 넣어 보내도 숫자만 남겨 받는다.
             * @example 1058763602
             */
            bizRegistrationNumber: string;
            /**
             * @description 대표자명.
             * @example 김하늘
             */
            bizCeoName: string;
            /**
             * @description 개업일자(YYYY-MM-DD).
             * @example 2020-03-02
             */
            bizOpenDate: string;
            /** @description 수정 중인 BP. 등록이면 비운다. */
            bpCodeId?: number;
        };
        BpMasterBusinessVerificationResponseDto: {
            /** @description 10분짜리 토큰. 등록 · 수정 저장에 실어야 반영된다. */
            verificationToken: string;
        };
        BpMasterWithdrawalResponseDto: {
            /**
             * Format: date-time
             * @description 탈퇴 일시 — 탈퇴로 BP 마스터 계정 상태가 바뀐 시각. 기록이 없으면 null(탈퇴 흐름은 늘 채운다).
             */
            withdrawnAt: string | null;
            /**
             * @description 탈퇴 사유 한글(공통코드 WITHDRAW_REASON). 표에 없는 코드는 코드 그대로, 사유 코드가 없으면 null.
             * @example 폐업·사업 종료
             */
            reasonLabel: string | null;
            /** @description 직접 입력한 사유. 직접입력이 아니면 null. */
            reasonDetail: string | null;
        };
        BpMasterDeletionResponseDto: {
            /** @description 지금 지울 수 있는가 */
            isDeletable: boolean;
            /** @description 지울 수 없는 이유. 화면 말풍선에 그대로 보인다. 지울 수 있으면 빈 배열. */
            reasons: string[];
        };
        BpMasterDetailResponseDto: {
            /**
             * @description BP 상태. 사용 · 미사용 · 탈퇴.
             * @enum {string}
             */
            accountStatus: "ACTIVE" | "INACTIVE" | "WITHDRAWN";
            /**
             * @description 가입경로. 회원가입 · 플랫폼등록.
             * @enum {string}
             */
            joinPath: "SIGNUP" | "PLATFORM_REGISTERED";
            /** @description 탈퇴 정보 — 탈퇴한 BP 만, 아니면 null. 화면 「사유 보기」 팝업이 쓴다. */
            withdrawal: components["schemas"]["BpMasterWithdrawalResponseDto"] | null;
            /** @description BP 마스터 계정 id */
            adminAccountId: number;
            /**
             * Format: date-time
             * @description BP 상태가 바뀐 일시 — 미사용이면 「언제부터 미사용」. 바뀐 적이 없으면 null.
             */
            statusChangedAt: string | null;
            /** @description 대표자명 · 개업일자(YYYY-MM-DD) — 사업자 진위확인 결과. 미인증이면 null. */
            bizCeoName: string | null;
            bizOpenDate: string | null;
            bizCeoPhone: string | null;
            bizCeoEmail: string | null;
            bizZipCode: string | null;
            bizAddress: string | null;
            bizAddressDetail: string | null;
            bizCategory: string | null;
            bizItem: string | null;
            /**
             * Format: date-time
             * @description 최종 인증 일시. null 이면 미인증.
             */
            bizVerifiedAt: string | null;
            /** @description 소속 점포 수 — 폐점 · 삭제한 점포는 세지 않는다. */
            storeCount: number;
            /** @description 하위 관리자 수 — 이 BP 의 BP 관리자 · 가맹 마스터 · 가맹 관리자 중 지우지 않은 계정. */
            subAdminCount: number;
            /**
             * Format: date-time
             * @description 최근 로그인. 없으면 null.
             */
            lastLoginAt: string | null;
            /**
             * Format: date-time
             * @description 약관 동의 일시. 플랫폼등록 BP 는 첫 로그인 전까지 null.
             */
            termsAgreedAt: string | null;
            /** @description 강제 비밀번호 변경 대상 */
            isPasswordChangeRequired: boolean;
            /** @description 초기 비밀번호 미발송 — 등록 · 초기화 메일이 실패했다. 비밀번호 초기화로 다시 보낸다. */
            isInitialPasswordUnsent: boolean;
            /**
             * Format: date-time
             * @description 최종수정 일시 — BP 나 BP 마스터 계정을 마지막으로 고친 시각(bp_codes.updated_at).
             */
            updatedAt: string;
            /** @description 최종수정자 이름. 고친 적이 없거나 회원가입 그대로면 null. */
            updatedByName: string | null;
            deletion: components["schemas"]["BpMasterDeletionResponseDto"];
            bpCodeId: number;
            /**
             * @description BP 코드.
             * @example BP000012
             */
            bpCode: string;
            /**
             * @description BP 마스터 아이디. 탈퇴해도 남는다.
             * @example hangang01
             */
            loginId: string;
            /** @description BP 마스터 이름 · 연락처 · 이메일. 탈퇴한 BP 는 null — 화면은 「탈퇴로 삭제됨」. */
            name: string | null;
            phone: string | null;
            email: string | null;
            /** @description 상호명 */
            tradeName: string;
            /** @description 사업자등록번호(숫자 10자리). 미인증이면 null. */
            bizRegistrationNumber: string | null;
            /**
             * Format: date-time
             * @description 등록 일시
             */
            createdAt: string;
            /** @description 등록자 이름. 회원가입한 BP 는 null. */
            createdByName: string | null;
        };
        BpMasterHistoryResponseDto: {
            /** Format: date-time */
            changedAt: string;
            /**
             * @description 변경 항목.
             * @example 상호명
             */
            field: string;
            beforeValue: string | null;
            afterValue: string | null;
            /** @description 처리자 이름. 시스템이 처리했으면 null. */
            changedByName: string | null;
            /** @description 비고 — 사업자 번호 인증으로 바뀐 줄의 「사업자 번호 인증」. 탈퇴한 BP 는 이력을 409 로 거절하므로 탈퇴 사유는 상세의 withdrawal 로 본다. */
            note: string | null;
        };
        BpMasterHistoryListResponseDto: {
            items: components["schemas"]["BpMasterHistoryResponseDto"][];
            total: number;
        };
        CreateBpMasterDto: {
            /**
             * @description BP 마스터 아이디. 영문 또는 영문 · 숫자 4~20자, 소문자로 저장한다. 삭제 · 탈퇴한 계정까지 겹칠 수 없다.
             * @example hangang01
             */
            loginId: string;
            /**
             * @description BP 마스터 이름. 한글 · 영문 2~20자.
             * @example 김하늘
             */
            name: string;
            /**
             * @description BP 마스터 연락처. 하이픈 없이 숫자 10~11자리.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description BP 마스터 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 관리자 계정끼리 겹칠 수 없다.
             * @example ceo@hangang.co.kr
             */
            email: string;
            /**
             * @description 상호명. 1~50자.
             * @example 한강상회
             */
            tradeName: string;
            /** @description 대표자 연락처. 숫자 9~11자리. 비워 둘 수 있다. */
            bizCeoPhone?: string | null;
            /**
             * Format: email
             * @description 대표자 이메일. 비워 둘 수 있다.
             */
            bizCeoEmail?: string | null;
            /** @description 사업장 우편번호 — 주소 검색 결과. */
            bizZipCode?: string | null;
            /** @description 사업장 기본주소 — 주소 검색 결과. */
            bizAddress?: string | null;
            /** @description 사업장 상세주소 — 직접 입력. */
            bizAddressDetail?: string | null;
            /** @description 업태. 50자까지. */
            bizCategory?: string | null;
            /** @description 종목. 50자까지. */
            bizItem?: string | null;
            /**
             * @description POST /bp-masters/business-verifications 가 준 10분짜리 토큰. 실으면 그 안의 사업자등록번호 · 대표자명 ·
             *     개업일자와 인증일시를 함께 저장한다. 비우면 그 세 값은 그대로 둔다(등록이면 미인증).
             */
            verificationToken?: string;
        };
        CreateBpMasterResponseDto: {
            bpCodeId: number;
            /**
             * @description 새 BP 코드.
             * @example BP000013
             */
            bpCode: string;
            /** @description 초기 비밀번호를 보낸 주소 */
            email: string;
            /** @description 초기 비밀번호 메일을 보냈는가. 실패해도 BP 는 만들어졌다 — 상세에서 비밀번호 초기화로 다시 보낸다. */
            isMailSent: boolean;
        };
        UpdateBpMasterDto: {
            /**
             * @description BP 마스터 이름. 한글 · 영문 2~20자.
             * @example 김하늘
             */
            name: string;
            /**
             * @description BP 마스터 연락처. 하이픈 없이 숫자 10~11자리.
             * @example 01012345678
             */
            phone: string;
            /**
             * Format: email
             * @description BP 마스터 이메일. 소문자로 저장한다. 지우지 않은 사용 · 미사용 관리자 계정끼리 겹칠 수 없다.
             * @example ceo@hangang.co.kr
             */
            email: string;
            /**
             * @description 상호명. 1~50자.
             * @example 한강상회
             */
            tradeName: string;
            /** @description 대표자 연락처. 숫자 9~11자리. 비워 둘 수 있다. */
            bizCeoPhone?: string | null;
            /**
             * Format: email
             * @description 대표자 이메일. 비워 둘 수 있다.
             */
            bizCeoEmail?: string | null;
            /** @description 사업장 우편번호 — 주소 검색 결과. */
            bizZipCode?: string | null;
            /** @description 사업장 기본주소 — 주소 검색 결과. */
            bizAddress?: string | null;
            /** @description 사업장 상세주소 — 직접 입력. */
            bizAddressDetail?: string | null;
            /** @description 업태. 50자까지. */
            bizCategory?: string | null;
            /** @description 종목. 50자까지. */
            bizItem?: string | null;
            /**
             * @description POST /bp-masters/business-verifications 가 준 10분짜리 토큰. 실으면 그 안의 사업자등록번호 · 대표자명 ·
             *     개업일자와 인증일시를 함께 저장한다. 비우면 그 세 값은 그대로 둔다(등록이면 미인증).
             */
            verificationToken?: string;
        };
        ChangeBpMasterStatusDto: {
            /**
             * @description 바꿀 상태. 미사용이면 그 BP 의 관리자 계정 전부가, 사용이면 BP 마스터만 함께 바뀐다.
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE";
        };
        ResetBpMasterPasswordResponseDto: {
            /** @description 초기화 메일을 보냈는가. 실패해도 기존 비밀번호는 이미 막혔다 — 다시 초기화한다. */
            isMailSent: boolean;
        };
        ExcelDownloadLinkResponseDto: {
            /** @description S3 서명 주소(5분). */
            url: string;
            /** @example 점포목록_20261028.xlsx */
            fileName: string;
            /**
             * @description 내려받기 기한(완료 + 24시간).
             * @example 2026-10-29T05:05:00.000Z
             */
            expiresAt: string;
        };
        TermsVersionResponseDto: {
            /** @description 약관 유형 코드 — 공통코드 `TERMS_TYPE`. 예: PRIVACY_COLLECT */
            termsTypeCode: string;
            /** @description 탭 이름 — 공통코드 `TERMS_TYPE` 의 코드명. 예: 개인정보 수집·이용 동의(BP 사업자 회원가입용) */
            label: string;
            /** @description 본문 제목. 예: [필수] 개인정보 수집·이용 동의 */
            title: string;
            /** @description 버전 번호. 예: v1.0 */
            version: string;
            /** @description 시행일(YYYY-MM-DD). 예: 2026-10-01 */
            effectiveDate: string;
        };
        TermsVersionListResponseDto: {
            /** @description 약관 유형마다 지금 시행 중인 한 건, 공통코드 `TERMS_TYPE` 정렬 순서. 시행 중인 버전이 없는 유형은 빠진다. */
            items: components["schemas"]["TermsVersionResponseDto"][];
            /** @description items 개수(페이지를 나누지 않는다) */
            total: number;
        };
        TermsVersionDetailResponseDto: {
            /** @description 약관 유형 코드 — 공통코드 `TERMS_TYPE`. 예: PRIVACY_COLLECT */
            termsTypeCode: string;
            /** @description 탭 이름 — 공통코드 `TERMS_TYPE` 의 코드명. 예: 개인정보 수집·이용 동의(BP 사업자 회원가입용) */
            label: string;
            /** @description 본문 제목. 예: [필수] 개인정보 수집·이용 동의 */
            title: string;
            /** @description 버전 번호. 예: v1.0 */
            version: string;
            /** @description 시행일(YYYY-MM-DD). 예: 2026-10-01 */
            effectiveDate: string;
            /** @description 약관 본문(Markdown) */
            content: string;
        };
        BulkExportPreviewResponseDto: {
            /** @description 범위 점포 수 */
            storeCount: number;
            /** @description 담을 직원 수(재직 + 퇴직). 0 이면 요청 버튼을 끈다 */
            staffCount: number;
            /** @description 재직 */
            employedCount: number;
            /** @description 퇴직(퇴직일 다음 날부터 3년 안) */
            retiredCount: number;
            /** @description 같은 범위의 파일을 만드는 중인가 */
            inProgress: boolean;
        };
        CreateBulkExportDto: {
            /**
             * @description 업무 범위 점포. 비거나 없으면 관리하는 점포 전부. 관리하지 않는 점포가 섞이면 400
             * @example [
             *       3,
             *       5
             *     ]
             */
            storeIds?: number[];
        };
        /** @enum {string} */
        BulkExportStatus: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
        BulkExportItemDto: {
            status: components["schemas"]["BulkExportStatus"];
            bulkExportId: number;
            /** @description 요청의 업무 범위 점포(오름차순) — 「다시 요청」이 같은 범위로 보낸다 */
            storeIds: number[];
            /** @description 요청 일시(ISO) */
            requestedAt: string;
            /** @description 요청한 관리자 이름(없으면 로그인 아이디) */
            requesterName: string;
            /** @description 담은 직원 수 */
            staffCount: number;
            /** @description 완료 일시(ISO) */
            completedAt: string | null;
            /** @description 받을 수 있는 기한(ISO) — 완료 + 7일 */
            expiresAt: string | null;
            /** @description 기한이 지났는가 */
            isExpired: boolean;
            /** @description 실패 사유 */
            failureReason: string | null;
        };
        BulkExportListResponseDto: {
            items: components["schemas"]["BulkExportItemDto"][];
            total: number;
        };
        BulkExportDownloadResponseDto: {
            /** @description 5분짜리 내려받기 주소 */
            url: string;
            fileName: string;
            /** @description 파일을 받을 수 있는 기한(ISO) */
            expiresAt: string;
        };
        /** @enum {string} */
        EmploymentStatus: "EMPLOYED" | "RETIRED";
        /** @enum {string} */
        EmploymentType: "FULL_TIME" | "PART_TIME";
        /** @enum {string} */
        StaffJoinState: "JOINED" | "LINK_HOLD" | "UNDER_AGE" | "AFFILIATION_PENDING" | "RETURN_PENDING" | "INVITED" | "EXPIRED" | "REJECTED" | "DRAFT";
        StaffMemberStoreDto: {
            storeId: number;
            name: string;
            /** @description 공통코드 STORE_TYPE — DIRECT 직영 · FRANCHISE 가맹 */
            storeType: string;
        };
        /** @enum {string} */
        InvitationType: "SIGNUP" | "REINVITE" | "AFFILIATION_CONFIRM" | "RETURN_CONFIRM";
        /** @enum {string} */
        InvitationStatus: "SENT" | "ACCEPTED" | "EXPIRED" | "REJECTED" | "REJECTED_UNDER_AGE";
        StaffMemberInvitationDto: {
            invitationType: components["schemas"]["InvitationType"];
            status: components["schemas"]["InvitationStatus"];
            /**
             * Format: date-time
             * @description 이 초대를 보낸 일시
             */
            lastSentAt: string;
            /** Format: date-time */
            expiresAt: string;
            /**
             * @deprecated
             * @description contract.canResend 와 같은 값이다 — 초대 행이 없는 줄(이 변경 전 요청 없이 서명 대기가 된 옛 소속 확인 계약)은 invitation 이
             *     null 이라 이 칸으로는 보일 수 없어 contract.canResend 로 옮겼다(api #164 리뷰). 화면이 옮겨 가면 뺀다.
             */
            canResend: boolean;
        };
        /** @enum {string} */
        LinkHoldMismatchReason: "PHONE_MISMATCH" | "NAME_MISMATCH";
        StaffMemberLinkHoldDto: {
            mismatchReason: components["schemas"]["LinkHoldMismatchReason"];
            linkHoldId: number;
            /** @description 가입자가 본인인증한 번호의 끝 4자리 */
            verifiedPhoneLast4: string;
            /** Format: date-time */
            heldAt: string;
        };
        /** @enum {string} */
        ContractStatus: "DRAFT" | "PENDING_SEND" | "PENDING_SIGNATURE" | "CORRECTION_REQUESTED" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
        /** @enum {string} */
        Weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        ContractDetailWorkDayDto: {
            weekday: components["schemas"]["Weekday"];
            breakStartTime: string | null;
            breakEndTime: string | null;
            startTime: string;
            endTime: string;
        };
        StaffMemberContractDto: {
            status: components["schemas"]["ContractStatus"] | null;
            /**
             * @description 근무 요일 — 월→일, 시각 HH:mm. 근로계약은 자정을 넘지 않는다(contract_work_days CHECK). 없으면 빈 배열.
             *     null 은 「근로계약 조회 권한 없음」 — 근무 시간 · 근무요일은 근로계약 조항에서 나온 값이라 근로계약 관리 메뉴 조회
             *     권한이 없는 관리자에게는 주지 않는다(재영 결정 2026-10-27)
             */
            workDays: components["schemas"]["ContractDetailWorkDayDto"][] | null;
            contractId: number;
            /** Format: date-time */
            signDeadlineAt: string | null;
            /**
             * Format: date-time
             * @description 마지막으로 보낸 때(계약 상세 lastSentAt 과 같은 값). 초대 재발송 본문 expectedSentAt 으로 그대로 보낸다 — 두 화면에서 같은 계약을
             *     두 번 다시 보내지 않게(api #158 셀프 code-review). 보낸 적 없으면 null
             */
            lastSentAt: string | null;
            /** @description 계약 종료일(YYYY-MM-DD). 비면 무기한 */
            endDate: string | null;
            /**
             * Format: date-time
             * @description 최종 수정 일시. 거부일을 따로 저장하지 않아 「거부 · MM-DD」는 이 값으로 보인다
             */
            updatedAt: string | null;
            /**
             * @description 가입 · 인증 칸 재발송용 — 근로계약 상세의 canResend 와 달리 가입한 직원은 거짓이다(가입한 직원의 앱 알림 재발송은 근로계약
             *     상세에서). 이 칸의 버튼은 이 값 하나만 본다. 참이면 이 계약으로 근로계약 재발송(POST
             *     /contracts/{contractId}/send)이 가입 초대 알림톡 또는 소속 추가 확인 요청을 보낸다(설정 누락 503 · 그사이 바뀐 상태 409 · 발송
             *     실패 502 는 남는다). 발송 대기 · 서명 대기(거부 · 만료 재발송은 근로계약 상세에서, WHALEERP-153) 위에 모두 맞을 때만 참이다: 가입 전 ·
             *     가입 상태가 초대 발송 · 초대 만료 · 소속 추가 확인 · 복귀 확인(연결 보류 · 만 19세 미만 · 거절은 거짓), 또는 초안이고 이
             *     계약이 소속 추가 확인 · 복귀 확인으로 판별된 것(WHALEERP-130 전 요청 없이 서명 대기가 된 옛 계약) · 보이는 초대가 수락되지
             *     않음 · 휴대폰 번호 · 가린 줄 아님. 간격 제한은 없다.
             */
            canResend: boolean;
        };
        StaffMemberListItemDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            joinState: components["schemas"]["StaffJoinState"] | null;
            employmentStatus: components["schemas"]["EmploymentStatus"] | null;
            staffMemberId: number | null;
            isMasked: boolean;
            name: string | null;
            phone: string | null;
            store: components["schemas"]["StaffMemberStoreDto"];
            invitation: components["schemas"]["StaffMemberInvitationDto"] | null;
            linkHold: components["schemas"]["StaffMemberLinkHoldDto"] | null;
            contract: components["schemas"]["StaffMemberContractDto"] | null;
            /** @description 퇴직일(YYYY-MM-DD). 재직이면서 값이 있으면 퇴직 예정 */
            retiredDate: string | null;
        };
        StaffMemberListResponseDto: {
            items: components["schemas"]["StaffMemberListItemDto"][];
            total: number;
        };
        /**
         * @description 본사 제공 동의 상태 — 가맹 점포 직원만 동의 · 미동의, 직영 점포 직원은 null. 계정의 동의 칸이라 철회하면 바로
         *     미동의이고, 가입 전(계정 없음)은 미동의다. 본사 역할(BM · BA)은 미동의 직원의 상세를 열지 못한다(404, ATT-30)
         * @enum {string}
         */
        HqSharingConsentState: "AGREED" | "NOT_AGREED";
        StaffMemberEmploymentPeriodDto: {
            staffMemberId: number;
            /** @description 입사일(YYYY-MM-DD). 채우기 전 레코드는 null */
            hiredDate: string | null;
            /** @description 퇴직일(YYYY-MM-DD) — 퇴직 예정이면 정한 날. 정하지 않았으면 null */
            retiredDate: string | null;
        };
        StaffMemberDetailResponseDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            joinState: components["schemas"]["StaffJoinState"] | null;
            employmentStatus: components["schemas"]["EmploymentStatus"] | null;
            /**
             * @description 본사 제공 동의 상태 — 가맹 점포 직원만 동의 · 미동의, 직영 점포 직원은 null. 계정의 동의 칸이라 철회하면 바로
             *     미동의이고, 가입 전(계정 없음)은 미동의다. 본사 역할(BM · BA)은 미동의 직원의 상세를 열지 못한다(404, ATT-30)
             */
            hqSharingConsent: components["schemas"]["HqSharingConsentState"] | null;
            /**
             * @description 직원 계정의 현재 이메일(회원 ID · 로그인 아이디). 근무지에 직접 와서 물은 직원에게 관리자가 알려 줄 수 있게, 상세를
             *     볼 수 있는 관리자(직원 정보 관리 조회 권한)에게 낸다. 본사 역할(BM · BA)이 동의로만 보는 가맹 점포 직원이거나,
             *     가입 전 · 탈퇴 계정 · 퇴직 레코드면 null. 관리자는 고치지 못한다(관리자 요청에 email 칸이 없다).
             */
            email: string | null;
            /** @description 직무 */
            jobTitle: string;
            /** @description 입사일(YYYY-MM-DD) — 그 점포에서 처음 체결 완료된 근로계약의 시작일. 채우기 전 레코드는 null */
            hiredDate: string | null;
            /**
             * @description 생년월일(YYYY-MM-DD). 가입한 계정 값이고, 가입 전 · 탈퇴 계정이면 생년월일이 적힌 가장 최근 계약의 값이다. 둘 다 없으면
             *     null
             */
            birthDate: string | null;
            /**
             * @description 관리자가 생년월일을 정정할 수 있는 레코드인가(PUT /staff-members/:id/birth-date, WHALEERP-602). 계정이 있고 가입 완료
             *     (`JOINED`, 탈퇴 · 연결 보류 아님)이며 퇴직하지 않았을 때 true(퇴직일이 지났는데 배치 전인 레코드는 퇴직으로 보아 false) — 정정 API 가
             *     409 로 막는 경우(BIRTH_DATE_NOT_JOINED · BIRTH_DATE_RETIRED)와 같은 판정이다. `joinState` 는 직원 레코드의 가입 상태라
             *     계정이 탈퇴 · 연결 보류여도 JOINED 로 오므로 버튼 표시에는 이 칸을 쓴다. 수정 권한은 보지 않는다 — 화면이 권한으로 가린다.
             *     같은 값이라는 409(BIRTH_DATE_UNCHANGED)는 값을 넣어 봐야 아는 것이라 담지 않는다
             */
            birthDateCorrectable: boolean;
            /**
             * @description 이전 재직 기간 — 퇴직 뒤 같은 점포에 다시 입사해 이은 옛 레코드들(WHALEERP-615), 가까운 것부터. 누르면 그 레코드의
             *     상세로 간다. 체결 완료된 계약이 없는 레코드와 이 관리자에게 가려지는 레코드는 빠진다
             */
            previousRecords: components["schemas"]["StaffMemberEmploymentPeriodDto"][];
            /**
             * @description 이후 재직 기간 — 이 레코드 뒤에 다시 입사한 레코드들, 가까운 것부터. 체결 완료 전(임시저장 · 발송만 한) 레코드와 가려지는
             *     레코드는 빠진다
             */
            laterRecords: components["schemas"]["StaffMemberEmploymentPeriodDto"][];
            staffMemberId: number | null;
            isMasked: boolean;
            name: string | null;
            phone: string | null;
            store: components["schemas"]["StaffMemberStoreDto"];
            invitation: components["schemas"]["StaffMemberInvitationDto"] | null;
            linkHold: components["schemas"]["StaffMemberLinkHoldDto"] | null;
            contract: components["schemas"]["StaffMemberContractDto"] | null;
            /** @description 퇴직일(YYYY-MM-DD). 재직이면서 값이 있으면 퇴직 예정 */
            retiredDate: string | null;
        };
        StaffMemberPayrollAccountDto: {
            /** @description 은행 이름(BANK 공통코드 이름, 예 KB국민은행). 공통코드에 없으면 은행 코드 그대로 */
            bankName: string;
            /** @description 계좌번호 전체 — 하이픈 없음, 가리지 않음 */
            accountNumber: string;
        };
        /** @enum {string} */
        ContractMethod: "ELECTRONIC" | "PAPER";
        StaffMemberContractSummaryDto: {
            /** @description 계약 유형. 임시저장이면 비어 있을 수 있다 */
            employmentType: components["schemas"]["EmploymentType"] | null;
            contractMethod: components["schemas"]["ContractMethod"] | null;
            status: components["schemas"]["ContractStatus"] | null;
            contractId: number;
            /** @description 계약 시작일(YYYY-MM-DD) */
            startDate: string | null;
            /** @description 계약 종료일(YYYY-MM-DD). 비면 무기한 */
            endDate: string | null;
            /**
             * Format: date-time
             * @description 최근 발송 일시 — 발송 · 재발송 때 바뀐다. 보낸 적이 없으면 null
             */
            lastSentAt: string | null;
            /**
             * @description 갱신 예정일(YYYY-MM-DD) — 체결 완료이고 종료일이 오늘 이후일 때 종료일 30일 전. 종료일이 30일 안이면 이미 지난
             *     날짜일 수 있다. 아니면 null
             */
            renewalDate: string | null;
        };
        StaffMemberContractSummaryResponseDto: {
            /**
             * @description 신고 정보의 급여 계좌 — 은행 이름 · 계좌번호 전체(하이픈 없음, 가리지 않음). 신고 정보가 없으면 null. 계약이 없어도
             *     신고 정보가 있으면 오고, 급여 지급 방식(계좌 · 현금)과 상관없다. canViewPayrollAccount 가 false 이면 신고 정보를
             *     읽지 않고 항상 null
             */
            payrollAccount: components["schemas"]["StaffMemberPayrollAccountDto"] | null;
            /** @description 계약이 없으면 null */
            contract: components["schemas"]["StaffMemberContractSummaryDto"] | null;
            /**
             * @description 이 관리자가 이 직원의 급여 계좌를 볼 수 있는가. 본사 역할(BP 마스터 · BP 관리자)이 가맹 점포 직원을 보면 false —
             *     본사 제공 동의를 했어도 그렇다(동의 범위에 신고 정보가 없고 계좌는 가맹 점포 사업주가 받는 정보, 운영 정책 TAX-07 ·
             *     TAX-08, 재영 2026-10-29). 그 밖(직영 점포 직원, 가맹마스터 · 가맹관리자)은 true. false 이면 화면은 「급여 계좌」 줄
             *     자체를 숨긴다
             */
            canViewPayrollAccount: boolean;
        };
        StaffMemberWeekScheduleItemDto: {
            workScheduleId: number;
            storeId: number;
            storeName: string;
            /** @description 근무일(YYYY-MM-DD) — 시작 일시의 한국 날짜 */
            workDate: string;
            /** @description 시작 HH:mm(한국 시각) */
            startTime: string;
            /** @description 종료 HH:mm(한국 시각). 시작보다 이르면 다음 날이다 */
            endTime: string;
            breakMinutes: number;
            /** @description 근무시간(분) — 종료 − 시작 − 휴게 */
            workMinutes: number;
        };
        StaffMemberWeekScheduleResponseDto: {
            /** @description 그 주 월요일(YYYY-MM-DD) */
            weekStart: string;
            /** @description 그 주 일요일(YYYY-MM-DD) */
            weekEnd: string;
            /** @description 시작 일시 순 */
            items: components["schemas"]["StaffMemberWeekScheduleItemDto"][];
            /** @description 주간 근무시간 합계(분) */
            totalWorkMinutes: number;
        };
        /** @enum {string} */
        PayslipStatus: "DRAFTING" | "REVIEWING" | "CONFIRMED" | "SENT";
        StaffMemberRecentPayslipDto: {
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            /** @description 급여 기간 시작일(YYYY-MM-DD) */
            periodStartDate: string;
            /** @description 급여 기간 종료일(YYYY-MM-DD) */
            periodEndDate: string;
            /**
             * @description 기본급 — 기본급(BASE_PAY) 항목의 관리자 수정값 ?? 시스템 계산값 ?? 0(명세서 지급 총액과 같은 기준). 항목이 없거나
             *     넣지 않은 줄(isEntered = false)이면 null
             */
            basePayAmount: number | null;
            /** @description 수당 — 지급 총액 − 기본급. 기본급이 null 이면 지급 총액 그대로다(지금은 늘 숫자) */
            allowanceAmount: number | null;
            totalDeductionAmount: number;
            netPayAmount: number;
        };
        StaffMemberPayslipSummaryResponseDto: {
            /** @description 이 직원의 명세서 최근 3건 — 상태와 관계없이(작성 중 포함) 급여 기간 시작일 최신순, 같으면 명세서 ID 내림차순 */
            recent: components["schemas"]["StaffMemberRecentPayslipDto"][];
            /** @description 발송 완료가 아닌 명세서 수 — 작성 중 · 검토 중 · 확정 */
            unsentCount: number;
        };
        /** @enum {string} */
        StaffSendKind: "SIGNUP_INVITE" | "AFFILIATION_REQUEST";
        /**
         * @description 비즈뿌리오 접수 기준. 접수 여부 모름(UNCONFIRMED)은 다시 보내면 두 번 갈 수 있다
         * @enum {string}
         */
        StaffSendResult: "SUCCEEDED" | "FAILED" | "UNCONFIRMED";
        StaffMemberSendLogDto: {
            kind: components["schemas"]["StaffSendKind"];
            /** @description 비즈뿌리오 접수 기준. 접수 여부 모름(UNCONFIRMED)은 다시 보내면 두 번 갈 수 있다 */
            result: components["schemas"]["StaffSendResult"];
            /** @description 알림톡 발송 이력 ID(alimtalk_send_logs) */
            sendLogId: number;
            /** @description 보낸 근로계약 */
            contractId: number;
            /** @description 같은 계약으로 앞서 직원에게 나갔을 수 있는 발송(성공 · 접수 여부 모름)이 있었다 — 재발송 · 고쳐 다시 보냄. 계약 재발송 횟수와는 다를 수 있다 */
            isResend: boolean;
            /** @description 관리자에게 보일 실패 사유. 성공이면 null */
            failureReason: string | null;
            /** @description 다시 보내도 되는가 — 확실히 나가지 않은 실패만 true, 접수 여부 모름은 false. 성공이면 null */
            retryable: boolean | null;
            /** Format: date-time */
            sentAt: string;
        };
        StaffMemberSendLogResponseDto: {
            /** @description 이 직원 레코드의 모든 근로계약 발송, 최근 순 */
            items: components["schemas"]["StaffMemberSendLogDto"][];
        };
        /** @enum {string} */
        TodoStatus: "PENDING" | "IN_PROGRESS" | "DONE";
        /**
         * @description 바꾼 쪽 — 관리자 · 직원 · 시스템. 한 명 수행이면 다른 직원일 수 있어 누구인지는 내지 않는다
         * @enum {string}
         */
        StatusChangeActor: "ADMIN" | "STAFF" | "SYSTEM";
        StaffMemberTodoHistoryDto: {
            fromStatus: components["schemas"]["TodoStatus"] | null;
            toStatus: components["schemas"]["TodoStatus"];
            /** @description 바꾼 쪽 — 관리자 · 직원 · 시스템. 한 명 수행이면 다른 직원일 수 있어 누구인지는 내지 않는다 */
            actor: components["schemas"]["StatusChangeActor"];
            todoStatusHistoryId: number;
            todoId: number;
            title: string;
            /** @description 긴급 표시를 바꾼 이력 */
            isUrgentChanged: boolean;
            /** Format: date-time */
            changedAt: string;
        };
        StaffMemberTodoSummaryResponseDto: {
            /** @description 이 직원에게 배정된, 지우지 않은 TO-DO 수 */
            total: number;
            /** @description 완료(DONE) 수 — 한 명 수행은 다른 배정자가 끝내도 완료다 */
            doneCount: number;
            /** @description 대기 · 진행 중 수. total = doneCount + notDoneCount */
            notDoneCount: number;
            /**
             * @description 최근 변경 이력 5건, 바뀐 일시 내림차순. 등록(fromStatus 가 null) · 상태 변경 · 긴급 표시 변경(isUrgentChanged)을 모두
             *     담는다(2026-10-21 노영주). 다른 배정자의 퇴직 배정 해제 행은 담지 않는다
             */
            recentHistories: components["schemas"]["StaffMemberTodoHistoryDto"][];
        };
        /** @enum {string} */
        StaffWorkSchedulePeriod: "THIS_WEEK" | "LAST_4_WEEKS" | "LAST_3_MONTHS" | "LAST_1_YEAR" | "ALL";
        StaffMemberWorkScheduleListItemDto: {
            workScheduleId: number;
            /** @description 근무일(YYYY-MM-DD) — 시작 일시의 한국 날짜 */
            workDate: string;
            /** @description 근무지 점포 이름 */
            storeName: string;
            /** @description 시작 HH:mm(한국 시각) */
            startTime: string;
            /** @description 종료 HH:mm(한국 시각). 시작보다 이르면 다음 날이다 */
            endTime: string;
        };
        StaffMemberWorkScheduleListResponseDto: {
            /** @description 근무일 내림차순 → 같은 날은 시작 시각 오름차순 → 근무스케줄 ID */
            items: components["schemas"]["StaffMemberWorkScheduleListItemDto"][];
            /** @description 기간 안의 지우지 않은 근무스케줄 수(모든 페이지) */
            total: number;
            /** @description 기간 안의 근무시간 합계(분, 페이지와 무관) — 건마다 종료 − 시작 − 휴게(직원 상세 요약의 workMinutes 와 같다). 0건이면 0 */
            totalWorkMinutes: number;
        };
        ContractToEndDto: {
            /** @description 임시저장 · 발송 대기 · 서명 대기 · 수정 요청 */
            status: components["schemas"]["ContractStatus"];
            contractId: number;
        };
        RetirementPreviewResponseDto: {
            /** @description 퇴직일 다음 날부터의 근무스케줄 수 — 지운다 */
            schedulesToRemove: number;
            /** @description 개인으로 배정된 미완료 TO-DO 수 — 배정을 푼다 */
            todosToUnassign: number;
            /** @description 임시저장 · 발송 대기 · 서명 대기 · 수정 요청 계약 — 종료로 닫는다 */
            contractsToEnd: components["schemas"]["ContractToEndDto"][];
        };
        RetirementDateDto: {
            /**
             * @description 퇴직일(YYYY-MM-DD, 한국 날짜). 그날까지 재직이고 다음 날 0시에 퇴직이 확정된다. 오늘 이후이거나 최근
             *     3개월 안의 지난 날짜만 받고, 입사일보다 앞설 수 없다.
             * @example 2026-10-31
             */
            retiredDate: string;
        };
        BirthDateCorrectionDto: {
            /**
             * @description 정정할 생년월일(YYYY-MM-DD, 한국 날짜). 오늘(KST) 뒤 날짜(내일부터)이거나 한국 오늘 기준 만 19세 미만이면 받지 않는다.
             * @example 1990-05-17
             */
            birthDate: string;
        };
        /**
         * @description 급여명세서 검토 사유 — 출퇴근 누락 · 계약 만료 후 기록 · 기간 중 계약 변경 · 공제 미입력 · 확인 필요 기록 포함
         * @enum {string}
         */
        PayslipReviewReason: "MISSING_ATTENDANCE" | "AFTER_CONTRACT_END" | "CONTRACT_CHANGED" | "DEDUCTION_MISSING" | "ATTENDANCE_NEEDS_REVIEW";
        PayslipListItemDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            status: components["schemas"]["PayslipStatus"] | null;
            /**
             * @description 검토 대기 사유(WHALEERP-234) — 확인하지 않은 검토 사유와 공제 미입력(공제 칸으로 판정, 운영 정책 v221 PAY-06). 하나라도
             *     있으면 검토 대기다. 사유 다섯 — 출퇴근 누락 · 계약 만료 후 기록 · 기간 중 계약 변경 · 공제 미입력 · 확인 필요 기록 포함 — 의
             *     순서. 작성 중 · 검토 중이 아니면 빈 배열, 가린 줄은 null
             */
            pendingReviewReasons: components["schemas"]["PayslipReviewReason"][] | null;
            payslipId: number | null;
            isMasked: boolean;
            staffName: string | null;
            storeId: number;
            storeName: string;
            /** @description 급여 기간 시작일(YYYY-MM-DD) */
            periodStartDate: string;
            /** @description 급여 기간 종료일(YYYY-MM-DD) */
            periodEndDate: string;
            /**
             * @description 출퇴근 확인 여부. 검토 대기 사유 「출퇴근 누락」(MISSING_ATTENDANCE)이 없거나 확인(acknowledgedAt)됐으면 true,
             *     확인 전이면 false. 누락 일수는 스키마에 칸이 없어(사유 상세는 글자) 내지 않는다
             */
            isAttendanceConfirmed: boolean | null;
            /**
             * Format: date-time
             * @description 발송일 — 성공한 발송 이력 중 가장 늦은 시각. 발송 전이면 null
             */
            lastSentAt: string | null;
        };
        PayslipStatusCountsDto: {
            DRAFTING: number;
            REVIEWING: number;
            CONFIRMED: number;
            SENT: number;
        };
        PayslipListResponseDto: {
            items: components["schemas"]["PayslipListItemDto"][];
            /** @description 모든 필터(상태 · 점포 · 직원명)를 건 건수(페이지 수 계산용) */
            total: number;
            /** @description 그 달 · 관리 범위의 상태 건수. 상태 필터와 상관없고 점포 · 직원명 필터는 따른다 — 직원명으로 거르면 가린 줄은 빼고, 아니면 가린 줄도 센다 */
            statusCounts: components["schemas"]["PayslipStatusCountsDto"];
            /** @description 그 달 · 고른 점포(직원명으로 거르면 그 이름)의 검토 대기 명세서 수 — 본사 역할에게 가린 줄은 세지 않는다(ATT-30, 운영 정책 v218 — 검토 대기(근태 이상 · 공제 미입력) 여부가 드러나지 않게). 관리자 웹 건수 줄의 「검토 대기 N」 꼬리표 */
            reviewPendingCount: number;
        };
        PayslipSummaryGroupDto: {
            count: number;
            grossPayAmount: number;
        };
        PayslipSummaryResponseDto: {
            /** @example 2026-09 */
            month: string;
            total: components["schemas"]["PayslipSummaryGroupDto"];
            /** @description 정직원(명세서의 고용형태 FULL_TIME) */
            fullTime: components["schemas"]["PayslipSummaryGroupDto"];
            /** @description 파트타이머(PART_TIME) */
            partTime: components["schemas"]["PayslipSummaryGroupDto"];
        };
        PayslipCandidateDto: {
            /** @description 계약 유형 — 유효한 근로계약의 값, 없으면 직원 레코드의 값 */
            employmentType: components["schemas"]["EmploymentType"];
            staffMemberId: number;
            staffName: string;
            storeId: number;
            storeName: string;
            /** @description 급여 기간에 걸친 체결 완료 근로계약 중 가장 늦게 시작한 것. 없으면 null — 초안을 만들 수 없다 */
            contractId: number | null;
            /** @description 이 달 명세서가 이미 있으면 그 ID — 새로 만들지 않는다 */
            payslipId: number | null;
            /** @description 급여 기간에 출퇴근 기록이 한 건이라도 있는가. 없으면 초안에 「출퇴근 누락」 검토 사유가 붙는다 */
            hasAttendance: boolean;
        };
        PayslipCandidatesResponseDto: {
            /** @description 급여 기간 시작일(YYYY-MM-DD) */
            periodStartDate: string;
            /** @description 급여 기간 종료일(YYYY-MM-DD) */
            periodEndDate: string;
            items: components["schemas"]["PayslipCandidateDto"][];
        };
        CreatePayslipDto: {
            /**
             * @description 급여 월(YYYY-MM). 급여 기간은 그 달 1일 ~ 말일이다
             * @example 2026-10
             */
            month: string;
            staffMemberId: number;
        };
        PayslipCreatedDto: {
            payslipId: number;
        };
        PayslipMonthDto: {
            /** @example 2026-10 */
            month: string;
        };
        PayslipBulkCreatedItemDto: {
            payslipId: number;
            staffMemberId: number;
            staffName: string;
            /** @description 출퇴근 기록이 없어 「출퇴근 누락」 검토 사유를 붙였는가 */
            hasMissingAttendance: boolean;
        };
        /**
         * @description EXISTS — 이 달 명세서가 이미 있음 · NO_CONTRACT — 급여 기간에 유효한 근로계약 없음
         * @enum {string}
         */
        PayslipSkipReason: "EXISTS" | "NO_CONTRACT";
        PayslipBulkSkippedItemDto: {
            /** @description EXISTS — 이 달 명세서가 이미 있음 · NO_CONTRACT — 급여 기간에 유효한 근로계약 없음 */
            reason: components["schemas"]["PayslipSkipReason"];
            staffMemberId: number;
            staffName: string;
        };
        PayslipBulkCreateResponseDto: {
            created: components["schemas"]["PayslipBulkCreatedItemDto"][];
            skipped: components["schemas"]["PayslipBulkSkippedItemDto"][];
        };
        SendPayslipsDto: {
            /**
             * @description 급여 월(YYYY-MM) — 급여 기간 시작일이 그 달인 명세서
             * @example 2026-10
             */
            month: string;
            /** @description 점포 ID 목록. 관리 범위 밖은 조용히 빠진다. 없으면 관리 범위 전체 */
            storeIds?: number[];
            /** @description 점포 유형(상단 점포 범위의 직영 · 가맹, 목록과 같다). 주면 그 유형 점포만이고 폐점 점포는 뺀다 */
            storeTypes?: ("DIRECT" | "FRANCHISE")[];
            /** @description 직원명 부분 일치(목록과 같다). 앞뒤 공백을 지우고 비면 없는 것으로 본다 */
            staffName?: string;
        };
        PayslipSentItemDto: {
            payslipId: number;
            staffName: string;
        };
        /**
         * @description MAIL_NOT_CONFIGURED 메일 설정 없음 · APP_URL_NOT_CONFIGURED 직원 앱 주소 없음 · NO_EMAIL 직원 앱 계정 없음(가입 전 ·
         *     탈퇴) · CONFLICT 그사이 다른 요청이 고침 · MAIL_FAILED 메일 발송 실패 · MASKED 본사 제공 동의가 없어 이 관리자가 보낼 수 없음
         * @enum {string}
         */
        PayslipSendFailure: "MAIL_NOT_CONFIGURED" | "APP_URL_NOT_CONFIGURED" | "NO_EMAIL" | "CONFLICT" | "MAIL_FAILED" | "MASKED";
        PayslipSendFailedItemDto: {
            /**
             * @description MAIL_NOT_CONFIGURED 메일 설정 없음 · APP_URL_NOT_CONFIGURED 직원 앱 주소 없음 · NO_EMAIL 직원 앱 계정 없음(가입 전 ·
             *     탈퇴) · CONFLICT 그사이 다른 요청이 고침 · MAIL_FAILED 메일 발송 실패 · MASKED 본사 제공 동의가 없어 이 관리자가 보낼 수 없음
             */
            reason: components["schemas"]["PayslipSendFailure"];
            /** @description 가린 명세서(MASKED)는 null */
            payslipId: number | null;
            /** @description 가린 명세서(MASKED)는 null */
            staffName: string | null;
            /** @description 화면에 그대로 보일 문장 */
            message: string;
        };
        PayslipSendResultDto: {
            sent: components["schemas"]["PayslipSentItemDto"][];
            failed: components["schemas"]["PayslipSendFailedItemDto"][];
        };
        PayslipAdditionalItemDto: {
            payslipItemMasterId: number;
            itemCode: string;
            name: string;
        };
        PayslipAdditionalItemsResponseDto: {
            items: components["schemas"]["PayslipAdditionalItemDto"][];
        };
        PayslipContractDto: {
            status: components["schemas"]["ContractStatus"] | null;
            contractId: number;
            wageAmount: number | null;
        };
        /** @enum {string} */
        PayslipItemCategory: "EARNING" | "BASIC" | "ADDITIONAL" | "WITHHOLDING";
        PayslipItemDto: {
            itemCategory: components["schemas"]["PayslipItemCategory"];
            payslipItemId: number;
            payslipItemMasterId: number;
            /** @description 급여 항목 코드(예: BASE_PAY) */
            itemCode: string;
            /** @description 발송 당시 항목 이름 */
            itemName: string;
            isTaxFree: boolean;
            /** @description 시스템 계산값 — 지급 항목만 */
            calculatedAmount: number | null;
            /** @description 관리자 수정값 */
            adjustedAmount: number | null;
            /** @description 입력 여부 — 공제 미입력과 0 을 가른다 */
            isEntered: boolean;
        };
        PayslipReviewReasonDto: {
            reviewReason: components["schemas"]["PayslipReviewReason"];
            payslipReviewReasonId: number;
            /** @description 상세 — 누락 일수 등(글자) */
            detail: string | null;
            /** Format: date-time */
            acknowledgedAt: string | null;
        };
        /** @enum {string} */
        PayslipLogType: "DRAFT" | "EDIT" | "CONFIRM" | "CANCEL_CONFIRMATION" | "SEND";
        PayslipLogDto: {
            logType: components["schemas"]["PayslipLogType"];
            fromStatus: components["schemas"]["PayslipStatus"] | null;
            toStatus: components["schemas"]["PayslipStatus"] | null;
            payslipLogId: number;
            summary: string;
            /** @description 처리한 관리자 ID. 시스템 처리는 null */
            changedBy: number | null;
            /** @description 처리한 관리자 이름. 시스템 처리 · 이름 없는 계정은 null */
            changedByName: string | null;
            /** Format: date-time */
            changedAt: string;
        };
        /** @enum {string} */
        PayslipDispatchChannel: "EMAIL" | "PUSH";
        /** @enum {string} */
        DispatchResult: "SUCCEEDED" | "FAILED";
        PayslipDispatchDto: {
            channel: components["schemas"]["PayslipDispatchChannel"];
            status: components["schemas"]["DispatchResult"];
            payslipDispatchId: number;
            /** Format: date-time */
            sentAt: string;
        };
        PayslipDetailResponseDto: {
            employmentType: components["schemas"]["EmploymentType"];
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            staffMemberId: number;
            staffName: string;
            storeId: number;
            storeName: string;
            contractId: number;
            /** @description YYYY-MM-DD */
            periodStartDate: string;
            /** @description YYYY-MM-DD */
            periodEndDate: string;
            isPremiumApplied: boolean;
            isWithholdingApplied: boolean;
            grossPayAmount: number;
            totalDeductionAmount: number;
            /** @description 실지급액 */
            netPayAmount: number;
            /** @description 출퇴근 참조 시작일(YYYY-MM-DD) */
            attendanceStartDate: string;
            /** @description 출퇴근 참조 종료일(YYYY-MM-DD) */
            attendanceEndDate: string;
            /** @description 목록과 같은 출퇴근 확인 여부 */
            isAttendanceConfirmed: boolean;
            /** Format: date-time */
            confirmedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            contract: components["schemas"]["PayslipContractDto"];
            /** @description 지급 · 공제 항목, 급여 항목 순서 */
            items: components["schemas"]["PayslipItemDto"][];
            /** @description 검토 대기 사유 */
            reviewReasons: components["schemas"]["PayslipReviewReasonDto"][];
            /** @description 처리 이력, 최근 것이 위 */
            logs: components["schemas"]["PayslipLogDto"][];
            /** @description 발송 이력, 보낸 순서 */
            dispatches: components["schemas"]["PayslipDispatchDto"][];
        };
        PayslipPreviousItemDto: {
            itemCategory: components["schemas"]["PayslipItemCategory"];
            payslipItemMasterId: number;
            itemCode: string;
            itemName: string;
            amount: number;
        };
        PayslipPreviousDto: {
            payslipId: number;
            /** @description 급여 기간 시작일(YYYY-MM-DD) */
            periodStartDate: string;
            /** @description 급여 기간 종료일(YYYY-MM-DD) */
            periodEndDate: string;
            /** @description 공제(기본 · 추가 · 원천징수)와 관리자가 넣는 지급 항목(시스템 계산 항목 제외) */
            items: components["schemas"]["PayslipPreviousItemDto"][];
        };
        PayslipPreviousResponseDto: {
            /** @description 같은 직원의 지난 명세서(급여 기간이 앞선 것 중 가장 늦은 것). 없으면 null */
            previous: components["schemas"]["PayslipPreviousDto"] | null;
        };
        PayslipItemAmountDto: {
            /** @description 원, 0 이상. null 이면 미입력 — 시스템 계산 항목은 계산값으로 돌아간다 */
            amount: number | null;
            payslipItemMasterId: number;
        };
        SavePayslipDto: {
            /** @description 상세 응답의 updatedAt 그대로 — 그사이 누가 고쳤으면 409 */
            updatedAt: string;
            /** @description 연장 · 야간 · 휴일 가산 적용(PAY-05) */
            isPremiumApplied: boolean;
            /** @description 3.3% 원천징수 적용(PAY-03). 파트타이머 명세서만 켤 수 있다 — 정직원이 true 면 400 */
            isWithholdingApplied: boolean;
            items: components["schemas"]["PayslipItemAmountDto"][];
        };
        PayslipStatusChangeDto: {
            /** @description 상세 응답의 updatedAt 그대로 — 그사이 누가 고쳤으면 409 */
            updatedAt: string;
        };
        MyPayslipThisMonthDto: {
            /** @description YYYY-MM — 한국 시간 기준 이번 달 */
            month: string;
            /** @description 받은 명세서 수(검토 중인 것은 빼고). 0 이면 앱이 「이번 달에 받은 명세서가 없습니다」를 적는다 */
            count: number;
            /** @description 실지급액 합계 */
            totalNetPayAmount: number;
            /** @description 받은 명세서의 점포 이름 — 겹치지 않게, 최근에 받은 것부터 */
            storeNames: string[];
        };
        MyPayslipStoreDto: {
            storeId: number;
            storeName: string;
        };
        MyPayslipLogDto: {
            /** @description SEND · CANCEL_CONFIRMATION 만 온다 */
            logType: components["schemas"]["PayslipLogType"];
            payslipLogId: number;
            /** Format: date-time */
            changedAt: string;
        };
        MyPayslipSummaryDto: {
            employmentType: components["schemas"]["EmploymentType"];
            /** @description 보통 SENT. 발송 뒤 확정을 취소해 고치는 중이면 그때 상태(검토 중 · 확정) — correcting 이 true 다 */
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            /** @description YYYY-MM-DD */
            periodStartDate: string;
            /** @description YYYY-MM-DD */
            periodEndDate: string;
            /** @description 검토 중 — 보낸 뒤 확정을 취소해 관리자가 고치는 중이다. 금액 · 항목은 다시 보낼 때까지 싣지 않는다(null · 빈 목록) */
            correcting: boolean;
            /** @description 검토 중이면 null */
            grossPayAmount: number | null;
            /** @description 검토 중이면 null */
            totalDeductionAmount: number | null;
            /** @description 검토 중이면 null */
            netPayAmount: number | null;
            /**
             * Format: date-time
             * @description 만든 일시 — 보존 기간(3년)의 기준
             */
            createdAt: string;
            /** @description 근무지 점포 ID */
            storeId: number;
            /** @description 근무지 점포 이름 */
            storeName: string;
            /**
             * Format: date-time
             * @description 받은 날 — 가장 최근 발송 시각(다시 보냈으면 그때). 발송 이력이 없으면 null
             */
            sentAt: string | null;
            /** @description 발송 · 확정 취소 이력, 최근 것이 위 */
            logs: components["schemas"]["MyPayslipLogDto"][];
        };
        MyPayslipListResponseDto: {
            thisMonth: components["schemas"]["MyPayslipThisMonthDto"];
            /** @description 이름순 */
            stores: components["schemas"]["MyPayslipStoreDto"][];
            /** @description 점포 · 연도로 거른 명세서, 급여 기간 최신순 · 같은 달이면 최근에 받은(발송일) 것이 위 */
            items: components["schemas"]["MyPayslipSummaryDto"][];
        };
        MyPayslipItemDto: {
            itemCategory: components["schemas"]["PayslipItemCategory"];
            payslipItemId: number;
            /** @description 급여 항목 코드(예: BASE_PAY) */
            itemCode: string;
            /** @description 발송 당시 항목 이름 */
            itemName: string;
            isTaxFree: boolean;
            calculatedAmount: number | null;
            adjustedAmount: number | null;
            isEntered: boolean;
        };
        MyPayslipDetailResponseDto: {
            employmentType: components["schemas"]["EmploymentType"];
            /** @description 보통 SENT. 발송 뒤 확정을 취소해 고치는 중이면 그때 상태(검토 중 · 확정) — correcting 이 true 다 */
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            /** @description YYYY-MM-DD */
            periodStartDate: string;
            /** @description YYYY-MM-DD */
            periodEndDate: string;
            /** @description 검토 중 — 보낸 뒤 확정을 취소해 관리자가 고치는 중이다. 금액 · 항목은 다시 보낼 때까지 싣지 않는다(null · 빈 목록) */
            correcting: boolean;
            /** @description 검토 중이면 null */
            grossPayAmount: number | null;
            /** @description 검토 중이면 null */
            totalDeductionAmount: number | null;
            /** @description 검토 중이면 null */
            netPayAmount: number | null;
            /**
             * Format: date-time
             * @description 만든 일시 — 보존 기간(3년)의 기준
             */
            createdAt: string;
            /** @description 근무지 점포 ID */
            storeId: number;
            /** @description 근무지 점포 이름 */
            storeName: string;
            /**
             * Format: date-time
             * @description 받은 날 — 가장 최근 발송 시각(다시 보냈으면 그때). 발송 이력이 없으면 null
             */
            sentAt: string | null;
            /** @description 발송 · 확정 취소 이력, 최근 것이 위 */
            logs: components["schemas"]["MyPayslipLogDto"][];
            /** @description 3.3% 원천징수 적용 — 원천징수 · 소득세 줄을 어떻게 보일지 화면이 정한다 */
            isWithholdingApplied: boolean;
            /** @description 지급 · 공제 항목, 급여 항목 순서. 검토 중이면 빈 목록 */
            items: components["schemas"]["MyPayslipItemDto"][];
        };
        /**
         * @description 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null
         * @enum {string}
         */
        ContractDraftAction: "SIGNUP_INVITE" | "AFFILIATION_CONFIRM" | "RETURN_CONFIRM" | "IMMEDIATE_SEND";
        ContractListItemDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            contractMethod: components["schemas"]["ContractMethod"] | null;
            /**
             * @description YYYY-MM-DD
             * @example 2026-09-01
             */
            startDate: string | null;
            /**
             * @description YYYY-MM-DD. 비어 있으면 기간의 정함이 없는 계약
             * @example null
             */
            endDate: string | null;
            /** @description 원. 시급 — 고용 형태와 상관없이 시급이다(2026-10-12) */
            wageAmount: number | null;
            status: components["schemas"]["ContractStatus"] | null;
            /** @description 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null */
            draftAction: components["schemas"]["ContractDraftAction"] | null;
            /** @description 발송 일시 (ISO 8601). 발송 전이면 null */
            sentAt: string | null;
            /** @description 날인 기한 (ISO 8601) */
            signDeadlineAt: string | null;
            /**
             * @description 직원의 지금 가입 · 초대 상태(직원 목록 joinState 와 같은 규칙, WHALEERP-133). draftAction 은 저장 때 판별한 값이라 초대가
             *     만료 · 거절돼도 남는다 — 상태 칸의 「가입 대기 중」 · 「소속 확인 중」은 이 값으로 정한다
             */
            staffJoinState: components["schemas"]["StaffJoinState"];
            /**
             * @description 갱신 예정일 YYYY-MM-DD — 체결 완료이고 종료일이 오늘 이후면 종료일 30일 전(직원 상세 요약과 같은 규칙, WHALEERP-156).
             *     종료일이 30일 안이면 이미 지난 날짜다. 이미 재계약했으면(진행 중이거나 체결을 거친 재계약이 있음) null, 그 밖에도 null
             * @example 2026-11-01
             */
            renewalDate: string | null;
            /** @description 재계약이면 직전 계약 ID(WHALEERP-156) — 상태 칸에 「재계약」을 붙인다. 아니면 null */
            previousContractId: number | null;
            contractId: number;
            staffMemberId: number;
            /** @description 직원 레코드의 이름(초안 입력값) */
            staffMemberName: string;
            storeId: number;
            /** @description 점포가 지워졌어도 이름은 보인다 */
            storeName: string | null;
            /** @description 직원이 퇴직했는가(재직 상태 퇴직) — 상태 칸에 「퇴직」을 붙인다. 퇴직 예정(퇴직일 전)은 false */
            staffRetired: boolean;
        };
        ContractStatusCountsDto: {
            DRAFT: number;
            PENDING_SEND: number;
            PENDING_SIGNATURE: number;
            CORRECTION_REQUESTED: number;
            SIGNED: number;
            REJECTED: number;
            EXPIRED: number;
            ENDED: number;
        };
        ContractListResponseDto: {
            items: components["schemas"]["ContractListItemDto"][];
            /** @description 거른 결과 전체 건수 */
            total: number;
            /**
             * @description 상태별 계약 수(WHALEERP-133). 목록과 같은 조건에서 상태 필터만 뺀 개수 — 점포 · 점포명 · 직원명 필터를 따르고, 본사 역할에게
             *     가려지는 가맹 점포의 본사 제공 동의 안 한 직원 계약은 세지 않는다(점포 하나로 좁혀 그 사람의 계약 상태가 드러나지 않게, api #146
             *     리뷰 — ATT-30 이 점포 단위 개수를 허용하는지는 기획 확인 대기). 상태가 빈 옛 계약은 세지 않아 개수의 합이 total 과 다를 수 있다
             */
            statusCounts: components["schemas"]["ContractStatusCountsDto"];
        };
        StoreOptionDto: {
            storeId: number;
            /** @description 점포명 */
            name: string;
        };
        StoreOptionListResponseDto: {
            items: components["schemas"]["StoreOptionDto"][];
            total: number;
        };
        /**
         * @description 성별 — 남 · 여. 가입 때 직원이 넣은 값과 본인 대조한다(WHALEERP-125). 임시저장은 비워도 된다
         * @enum {string}
         */
        Gender: "MALE" | "FEMALE";
        ContractWorkDayDto: {
            weekday: components["schemas"]["Weekday"];
            /** @description 시업 HH:mm */
            startTime: string;
            /** @description 종업 HH:mm. 시업보다 뒤, 같은 날 안 */
            endTime: string;
            breakStartTime?: string;
            breakEndTime?: string;
        };
        /** @enum {string} */
        PayMonth: "CURRENT_MONTH" | "NEXT_MONTH";
        /**
         * @description 급여 지급 방식 — 계좌 · 현금
         * @enum {string}
         */
        PayMethod: "ACCOUNT" | "CASH";
        CreateContractDto: {
            /** @description 성별 — 남 · 여. 가입 때 직원이 넣은 값과 본인 대조한다(WHALEERP-125). 임시저장은 비워도 된다 */
            gender?: components["schemas"]["Gender"];
            employmentType: components["schemas"]["EmploymentType"];
            /**
             * @description 전자계약 · 종이 계약. 임시저장이면 비워도 된다. 종이 계약은 날인본 파일과 함께 `POST /contracts/paper`
             *     (이어 쓰기는 `PUT /contracts/:contractId/paper`)로 등록하고 체결 완료가 된다(CTR-23). 여기(JSON)로는 임시저장만 된다.
             */
            contractMethod?: components["schemas"]["ContractMethod"];
            /**
             * @description 주휴일 — 근무하지 않는 요일 하나(노무사 확인 2026-10-14). 주 소정근로시간이 15시간 이상이면 넣어야 하고,
             *     15시간 미만이면 주휴가 없어 비운다(contracts.service checkWeeklyHoliday).
             */
            weeklyHoliday?: components["schemas"]["Weekday"];
            workDays?: components["schemas"]["ContractWorkDayDto"][];
            payMonth?: components["schemas"]["PayMonth"];
            /** @description 급여 지급 방식 — 계좌 · 현금 */
            payMethod?: components["schemas"]["PayMethod"];
            /** @description 앞뒤 공백은 지운다(NFC) — 같은 사람의 가입 전 레코드를 이름으로 찾으므로 공백 하나로 갈리지 않게. */
            name: string;
            /** @description 숫자만 10~11자리 (예: 01090145563) */
            phone: string;
            /** @description YYYY-MM-DD. 계약 시작일 기준 만 19세 미만이면 저장하지 않는다 */
            birthDate?: string;
            /** @description 외국인 여부 — 체크하지 않으면 내국인(false). 본인 대조에 쓴다(WHALEERP-125) */
            isForeigner?: boolean;
            storeId: number;
            jobTitle: string;
            /** @description YYYY-MM-DD */
            startDate?: string;
            /** @description YYYY-MM-DD. 비우면 기간의 정함이 없는 계약 */
            endDate?: string;
            /** @description 원. 시급 — 고용 형태와 상관없이 시급만 받는다(2026-10-12) */
            wageAmount?: number;
            mealAllowanceAmount?: number;
            /** @description 자가운전보조금 — 원, 비과세 수당 */
            carAllowanceAmount?: number;
            /** @description 육아수당 — 원, 비과세 수당 */
            childcareAllowanceAmount?: number;
            /** @description 월 기본시간 — 시간, 30분 단위 */
            baseHours?: number;
            /** @description 월간 연장근무 — 시간, 30분 단위 */
            monthlyOvertimeHours?: number;
            /** @description 기본시간 중 야간근무 — 시간, 30분 단위 */
            baseNightHours?: number;
            /** @description 기본시간 중 휴일근무 — 시간, 30분 단위. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            baseHolidayHours?: number;
            /** @description 월간 추가 휴일근무 — 시간, 30분 단위. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            monthlyExtraHolidayHours?: number;
            /** @description 연차휴가 조항 문구. 기본 문구는 작성 화면이 채운다 */
            annualLeaveTerms?: string;
            /** @description 퇴직금 조항 문구. 기본 문구는 작성 화면이 채운다 */
            severancePayTerms?: string;
            /** @description 1~31. 31 은 말일 */
            payDay?: number;
            /**
             * @description 수습 기간 — 개월, 1~3. 비우면 수습 없음. 정직원이고 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둔다
             *     (노무사 확인 2026-10-14). 감액률과 함께 넣는다.
             */
            probationMonths?: number;
            /** @description 수습 중 임금 감액률 — %, 0~10. 수습 중 시급 = 시급 × (1 − 감액률). 수습 기간과 함께 넣는다 */
            probationWageReductionRate?: number;
            /** @description 계약서 근무 장소 조항에 적는 주소. 근무지 점포와 따로다 */
            workLocation?: string;
            isHealthPensionInsured?: boolean;
            isEmploymentInjuryInsured?: boolean;
            /** @description true 면 임시저장(DRAFT) — 초대 · 계약서를 보내지 않는다. 없으면 초안 저장(발송 대기) */
            isTemporarySave?: boolean;
            /**
             * @description 재계약의 직전 계약(WHALEERP-156) — 저장(POST)에서만 본다. 체결 완료이거나 체결 뒤 종료된 같은 근무지 · 같은 번호의
             *     계약이어야 하고, 이미 체결을 거친 재계약이 있으면 409 다(진행 중 재계약은 같은 점포 진행 중 계약처럼 대체를 묻는다). 그 직원이 재직 중이면(퇴직 · 퇴직 예정이
             *     아니면) 연장이라 같은 직원 레코드에 새 계약을 붙인다 — 가입한 재직 직원이어도 막지 않는다. 퇴직한 직원이면 재입사라 지금처럼
             *     새 레코드를 만든다(가입한 직원이 퇴직 예정이면 아직 재직이라 409 — 퇴직 뒤에). 앞 계약은 새 계약이 체결 완료이고 그 시작일이
             *     되면 하루 배치가 종료로 바꾼다(2026-10-26 김민식). 고르지 않아도 이 점포에 같은 번호로 가입한 재직 직원이 있으면 그 사람의
             *     가장 최근 체결 계약에 잇는 재계약으로 저장한다(WHALEERP-130, 2026-10-26 재영 — 재직 중인 직원에게 새 계약을 보내는 것이 곧
             *     재계약). 재계약의 시작일은 직전 계약 시작일보다 하루 이상 뒤여야 하고(400), 그러면 직전 계약과 기간이 겹쳐도 된다
             *     (2026-10-26 김민식 · 재영 확인). 고르지 않은 종이 계약이 가입 전 레코드의 그 계약보다 늦게 시작하지 않으면 재계약이 아니라
             *     같은 계약서를 다시 올린 것으로 본다 — 겹치면 SIGNED_CONTRACT_OVERLAP 이다.
             */
            previousContractId?: number;
            /**
             * @description 잘못 올린 계약 바로잡기(WHALEERP-156) — 종이 계약 등록에서만 쓴다(그 밖이면 400). 종이 계약은 체결 완료 계약을 대체하지 않고,
             *     같은 점포 · 같은 번호에 기간이 겹치는 체결 완료 계약이 있으면 409(code SIGNED_CONTRACT_OVERLAP)다. 잘못 올린 계약을 고치려면
             *     이 값을 켜고 그 409 의 contracts id 를 모두 replaceContractIds 로 넣어 다시 보낸다 — 체결 완료 계약도 곧바로 종료한다(수정
             *     권한). 재계약이 아니다 — previousContractId 와 함께 보낼 수 없고(400), 직전 계약을 저절로 찾지 않는다. 사유는 받지 않는다.
             */
            correctSignedContracts?: boolean;
            /**
             * @description 대체할 진행 중 계약(WHALEERP-129). 같은 점포에 같은 번호의 진행 중 계약(임시저장 · 발송 대기 · 서명 대기 · 수정 요청)이
             *     있으면 409(code CONTRACT_IN_PROGRESS)가 그 목록(id · 상태 · 직원 이름 · 계약 기간)을 준다. 관리자가 대체를 확인하면
             *     그 id 를 모두 넣어 다시 보낸다 — 임시저장은 지우고 발송 대기 · 서명 대기 · 수정 요청은 종료한다. 종이 계약 바로잡기
             *     (correctSignedContracts)면 체결 완료도 묻고 종료한다. 체결 완료는 같은 번호로 퇴직 · 재입사가 되풀이되면 쌓이므로 상한을 넉넉히 둔다 — 409 목록을 모두
             *     다시 보낼 수 없으면 그 번호로는 종이 계약을 등록할 수 없다(api #49 리뷰, WHALEERP-600).
             */
            replaceContractIds?: number[];
        };
        CreatedContractResponseDto: {
            /** @description 저장한 뒤의 상태 — 임시저장 · 발송 대기 · 서명 대기 · 체결 완료(종이 계약) 등 */
            status: components["schemas"]["ContractStatus"];
            /**
             * @description 시스템이 실제로 한 처리(WHALEERP-132). 보내지 않은 저장(임시저장 · 종이 계약 등록)은 null, 가입한 직원에게 앱으로 보냈으면
             *     즉시 발송(IMMEDIATE_SEND), 아니면 판별한 초대 유형 — 가입 초대(알림톡) · 소속 추가 확인 · 복귀 확인(소속 · 복귀를 확인하기
             *     전까지 직원에게 알림이 가지 않는다). 보내기 전에 다른 요청이 초대를 무효로 해 되돌렸거나, 판별값이 없는 옛 계약의 가입 전
             *     직원이라 나간 것이 없으면 null(상태는 지금 상태). 계약에 저장한 draftAction(상세 · 목록)과 다를 수 있다
             */
            draftAction: components["schemas"]["ContractDraftAction"] | null;
            contractId: number;
            staffMemberId: number;
        };
        MinimumWageResponseDto: {
            /**
             * @description 시급(원). 공통코드를 쓸 수 없으면 null
             * @example 10320
             */
            hourlyWage: number | null;
            /**
             * @description 공통코드를 쓸 수 없는 까닭(없음 · 사용 중지 · 코드명이 숫자 아님) — 수습이 있는 계약을 저장하면 이 문장으로 400 이다.
             *     쓸 수 있으면 null
             * @example null
             */
            problem: string | null;
        };
        ContractStatusHistoryDto: {
            /** @description 처음 만든 줄은 null */
            fromStatus: components["schemas"]["ContractStatus"] | null;
            toStatus: components["schemas"]["ContractStatus"];
            actor: components["schemas"]["StatusChangeActor"];
            /** @description ISO 8601 */
            changedAt: string;
        };
        /**
         * @description 종이 계약 근로계약서 · 임금계약서 · 보낸 원본 · 처리 완료본
         * @enum {string}
         */
        ContractDocumentKind: "SENT_ORIGINAL" | "SIGNED_COPY" | "PAPER_EMPLOYMENT_CONTRACT" | "WAGE_CONTRACT" | "SIGNATURE";
        ContractDocumentDto: {
            /** @description 종이 계약 근로계약서 · 임금계약서 · 보낸 원본 · 처리 완료본 */
            kind: components["schemas"]["ContractDocumentKind"];
            contractDocumentId: number;
            /** @description 올린 파일의 원래 이름 */
            fileName: string;
        };
        /** @enum {string} */
        ContractTaxProfileState: "OK" | "NONE" | "HIDDEN" | "UNAVAILABLE";
        ContractTaxProfileDto: {
            status: components["schemas"]["ContractTaxProfileState"];
            /** @description 가린 주민등록번호 — 앞 6자리 + 뒷자리 첫 자(예 900101-1******). 원문은 API 밖으로 나가지 않는다 */
            rrnMasked: string | null;
            /** @description 은행 이름(BANK 공통코드 이름, 예 KB국민은행). 공통코드에 없으면 은행 코드 그대로 */
            bankName: string | null;
            /** @description 계좌번호 전체 — 하이픈 없음, 가리지 않음(직원 상세 급여 계좌와 같다) */
            accountNumber: string | null;
        };
        ContractDetailDto: {
            startDate: string | null;
            endDate: string | null;
            workLocation: string | null;
            weeklyHoliday: components["schemas"]["Weekday"] | null;
            /** @description 원. 시급 — 고용 형태와 상관없이 시급이다(2026-10-12) */
            wageAmount: number | null;
            /** @description 식대 — 원 */
            mealAllowanceAmount: number | null;
            /** @description 자가운전보조금 — 원 */
            carAllowanceAmount: number | null;
            /** @description 육아수당 — 원 */
            childcareAllowanceAmount: number | null;
            /** @description 월 기본시간 — 시간(0.5 단위) */
            baseHours: number | null;
            /** @description 월간 연장근무 — 시간 */
            monthlyOvertimeHours: number | null;
            /** @description 기본시간 중 야간근무 — 시간 */
            baseNightHours: number | null;
            /** @description 기본시간 중 휴일근무 — 시간. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            baseHolidayHours: number | null;
            /** @description 월간 추가 휴일근무 — 시간. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            monthlyExtraHolidayHours: number | null;
            /** @description 연차휴가 조항 문구 */
            annualLeaveTerms: string | null;
            /** @description 퇴직금 조항 문구 */
            severancePayTerms: string | null;
            payMonth: components["schemas"]["PayMonth"] | null;
            payDay: number | null;
            /** @description 급여 지급 방식 — 계좌 · 현금 */
            payMethod: components["schemas"]["PayMethod"] | null;
            /** @description 수습 기간 — 개월(1~3). 수습이 없으면 null */
            probationMonths: number | null;
            /** @description 수습 중 임금 감액률 — %(0~10). 수습이 없으면 null */
            probationWageReductionRate: number | null;
            isHealthPensionInsured: boolean | null;
            isEmploymentInjuryInsured: boolean | null;
            workDays: components["schemas"]["ContractDetailWorkDayDto"][];
            status: components["schemas"]["ContractStatus"] | null;
            employmentType: components["schemas"]["EmploymentType"];
            /** @description 점포가 지워졌어도 이름은 보인다. 점포 행이 없으면 null */
            storeName: string | null;
            /** @description YYYY-MM-DD */
            birthDate: string | null;
            gender: components["schemas"]["Gender"] | null;
            contractMethod: components["schemas"]["ContractMethod"] | null;
            /** @description 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null */
            draftAction: components["schemas"]["ContractDraftAction"] | null;
            /** @description 상태 변경 이력. 최근 것부터 */
            histories: components["schemas"]["ContractStatusHistoryDto"][];
            /** @description 종이 계약 날인본(근로계약서 · 임금계약서). 전자계약 · 임시저장이면 빈 배열 */
            documents: components["schemas"]["ContractDocumentDto"][];
            /**
             * @description 처음 보낸 때(ISO 8601) — 상태 이력에서 발송 대기 · 서명 대기로 처음 간 때(WHALEERP-328). 보낸 적 없는 임시저장 · 종이
             *     계약이면 null
             */
            firstSentAt: string | null;
            /** @description 마지막으로 보낸 때(ISO 8601) — 재발송 · 고쳐 다시 보내면 바뀐다. 보낸 적 없으면 null */
            lastSentAt: string | null;
            /** @description 날인 기한(ISO 8601) — 마지막으로 보낸 때부터 30일. 보낸 적 없으면 null */
            signDeadlineAt: string | null;
            /** @description 최종 처리일(ISO 8601) — 가장 최근 상태 변경 일시. 이력이 없으면 null */
            lastProcessedAt: string | null;
            /**
             * @description 직원이 남긴 수정 요청 사유(1~100자, WHALEERP-635) — 수정 요청된 계약에만, 그 밖은 null. 사유를 받기 전의 수정 요청도 null.
             *     고쳐 다시 보내도 행에는 남지만 다른 상태에서는 주지 않는다(지난 사유가 지금 사유처럼 읽히지 않게)
             */
            correctionReason: string | null;
            /** @description 재계약으로 만든 계약이면 직전 계약 ID. 재계약(WHALEERP-156) 전이라 지금은 늘 null */
            previousContractId: number | null;
            /** @description 종이 계약 등록일(ISO 8601) — 체결 완료가 된 때. 종이 계약만 — 전자계약 · 등록 전 임시저장(등록 전에 종료된 것 포함)은 null */
            registeredAt: string | null;
            /**
             * @description 종이 계약을 작성한 관리자 — 등록한 종이 계약만(registeredAt 이 있을 때), 그 밖은 null. 이름이 없으면 로그인 아이디. 임시저장을 다른 관리자가 이어 써 등록했어도
             *     처음 작성한 관리자다(상태 이력은 관리자를 남기지 않는다)
             */
            registeredBy: string | null;
            /**
             * @description 이 계약을 직전 계약으로 둔 체결을 거친 재계약 ID(WHALEERP-156) — 있으면 상세가 「새 계약」을 띄우지 않는다. 진행 중 재계약은 치지
             *     않는다(새 재계약을 저장할 때 대체를 묻는다). 없으면 null
             */
            renewedBy: number | null;
            contractId: number;
            staffMemberId: number;
            name: string;
            phone: string;
            jobTitle: string;
            storeId: number;
            /** @description 외국인 여부 — 체크하지 않았으면 false */
            isForeigner: boolean;
            /**
             * @description 재발송 횟수 — 처음 발송 뒤 다시 보낸 횟수(재발송 · 고쳐 다시 보냄). 알림 없이 날인 기한만 새로 잡은 것도 센다. 알림톡이 나가지
             *     않으면 되돌려 빼지만, 드물게 다른 요청과 겹친 실패 · 그사이 다른 요청이 초대를 무효로 해 보내지 않은 재발송은 빼지 못해 실제보다
             *     클 수 있다. 이 칸이 생기기 전의 재발송은 세지 않았다.
             *     재발송 여부는 이 값으로 본다(firstSentAt · lastSentAt 은 시각 출처가 달라 첫 발송에도 ms 가 다를 수 있다)
             */
            resendCount: number;
            /**
             * @description 재발송(POST …/send)을 정책상 할 수 있는가 — 발송 대기 · 서명 대기 · 거부 · 만료(WHALEERP-153). 가입한 직원은 앱 알림, 가입 전
             *     직원은 가입 초대이거나 그 번호에 계정이 있으면 소속 추가 확인 요청이다(WHALEERP-130). 거부 · 만료는 되살릴 수 없거나
             *     (REOPEN_BLOCKED) 다른 점포 근무 시간과 겹치면(WORK_TIME_OVERLAP) false. 상세 화면이 재발송 버튼을 이 값으로 보인다. 정책만
             *     본다 — 유선번호(409 SEND_PHONE_NOT_MOBILE) · 발송 설정 없음(503) · 그 계정이 이 점포에 재직 중(409)은 true 여도 보낼 때 막힌다
             */
            canResend: boolean;
            /** @description 직원이 가입을 마쳤는가 — 거부 · 만료 재발송이 앱(서명 대기)으로 가는지 가입 초대(발송 대기)로 가는지 확인창 문구를 가른다 */
            staffJoined: boolean;
            /** @description 직원의 신고 정보(주민등록번호 · 급여 계좌) — 읽기만. 풀 수 없어도 상세는 열리고 이 칸만 UNAVAILABLE 이다 */
            taxProfile: components["schemas"]["ContractTaxProfileDto"];
        };
        UpdateWorkerDto: {
            /** @description 성별 — 남 · 여. 가입 때 직원이 넣은 값과 본인 대조한다(WHALEERP-125). 임시저장은 비워도 된다 */
            gender?: components["schemas"]["Gender"];
            /** @description 앞뒤 공백은 지운다(NFC) — 같은 사람의 가입 전 레코드를 이름으로 찾으므로 공백 하나로 갈리지 않게. */
            name: string;
            /** @description 숫자만 10~11자리 (예: 01090145563) */
            phone: string;
            /** @description YYYY-MM-DD. 계약 시작일 기준 만 19세 미만이면 저장하지 않는다 */
            birthDate?: string;
            /** @description 외국인 여부 — 체크하지 않으면 내국인(false). 본인 대조에 쓴다(WHALEERP-125) */
            isForeigner?: boolean;
            /**
             * @description 대체할 진행 중 계약(WHALEERP-129). 같은 점포에 같은 번호의 진행 중 계약(임시저장 · 발송 대기 · 서명 대기 · 수정 요청)이
             *     있으면 409(code CONTRACT_IN_PROGRESS)가 그 목록(id · 상태 · 직원 이름 · 계약 기간)을 준다. 관리자가 대체를 확인하면
             *     그 id 를 모두 넣어 다시 보낸다 — 임시저장은 지우고 발송 대기 · 서명 대기 · 수정 요청은 종료한다. 종이 계약 바로잡기
             *     (correctSignedContracts)면 체결 완료도 묻고 종료한다. 체결 완료는 같은 번호로 퇴직 · 재입사가 되풀이되면 쌓이므로 상한을 넉넉히 둔다 — 409 목록을 모두
             *     다시 보낼 수 없으면 그 번호로는 종이 계약을 등록할 수 없다(api #49 리뷰, WHALEERP-600).
             */
            replaceContractIds?: number[];
        };
        DownloadUrlResponseDto: {
            url: string;
        };
        SendContractDto: {
            /**
             * @description 화면이 본 계약 상태. 재발송은 서명 대기 · 발송 대기 · 거부 · 만료를 모두 받아, 이 값이 없으면 열어 둔 서명 대기 화면에서 그사이
             *     거부 · 만료된 계약을 모르고 되살린다
             */
            expectedStatus?: components["schemas"]["ContractStatus"];
            /**
             * Format: date-time
             * @description 화면이 본 마지막 발송 시각(상세 lastSentAt, ISO 8601). 재발송하면 바뀐다 — 상태가 그대로인 발송 대기 · 서명 대기를 두 탭에서 각각
             *     다시 보내면 상태만으로는 잡히지 않아 알림이 두 번 가고 앞 초대 코드가 무효가 된다. 아직 보낸 적 없으면(lastSentAt null) 비운다
             */
            expectedSentAt?: string;
        };
        SendContractResponseDto: {
            /**
             * @description 보낸 뒤의 상태 — 가입 초대는 그대로(발송 대기 · 서명 대기), 가입한 직원은 서명 대기, 소속 추가 확인 요청은 발송 대기(직원이
             *     수락하면 서명 대기). 거부 · 만료를 되살리면 가입한 직원은 서명 대기, 그 밖에는 발송 대기다(WHALEERP-153). 보내는 사이 직원이
             *     소속 추가 확인 요청에 먼저 답했으면 그 답의 상태(서명 대기 · 거부)를 그대로 싣는다
             * @enum {string}
             */
            status: "DRAFT" | "PENDING_SEND" | "PENDING_SIGNATURE" | "CORRECTION_REQUESTED" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
            /** @description 새 날인 기한(보낸 때부터 30일). 소속 추가 확인 요청은 직원이 수락한 때부터 세어 아직 없다(null) */
            signDeadlineAt: string | null;
            contractId: number;
            /** @description 이번 발송 일시 */
            sentAt: string;
        };
        SignedMyContractResponseDto: {
            contractId: number;
            status: components["schemas"]["ContractStatus"];
            /**
             * Format: date-time
             * @description 날인 시각
             */
            signedAt: string;
        };
        MyContractActionResponseDto: {
            contractId: number;
            status: components["schemas"]["ContractStatus"];
        };
        RequestMyContractCorrectionDto: {
            /**
             * @description 수정 요청 사유 — 앞뒤 공백을 지운 뒤 1~100자
             * @example 시급이 안내받은 금액과 다릅니다
             */
            reason: string;
        };
        MyContractListItemDto: {
            status: components["schemas"]["ContractStatus"];
            employmentType: components["schemas"]["EmploymentType"] | null;
            /** @description 전자계약 · 종이 계약 */
            contractMethod: components["schemas"]["ContractMethod"] | null;
            /**
             * @description YYYY-MM-DD
             * @example 2026-11-01
             */
            startDate: string | null;
            /**
             * @description YYYY-MM-DD. 비어 있으면 기간의 정함이 없는 계약
             * @example null
             */
            endDate: string | null;
            /** @description 발송 일시 (ISO 8601) — 날인할 때 이 값을 그대로 보낸다(sentAt). 종이 계약이면 null */
            sentAt: string | null;
            /** @description 날인 기한 (ISO 8601) */
            signDeadlineAt: string | null;
            /**
             * @description 지금 상태가 된 시각 (ISO 8601). 체결 완료면 날인 일자(종이 계약이면 관리자 등록일), 거부 · 만료 · 종료 · 수정
             *     요청이면 그 일자(상태 이력의 처리 시각). 서명 대기면 마지막 발송 시각(sentAt) — 서명 대기 그대로 다시 보내면
             *     이력이 쌓이지 않아 발송 일시를 쓴다
             */
            processedAt: string | null;
            contractId: number;
            /** @description 근무지(소속) — 점포가 지워졌어도 이름은 보인다 */
            storeId: number;
            storeName: string;
            /** @description 지금 날인할 수 있는가 — 서명 대기 · 날인 기한 안 · 재직 중. 날인 요청 팝업(WHALEERP-148)이 쓴다. 본인 대조는 상세에서 */
            awaitingSignature: boolean;
        };
        MyContractListResponseDto: {
            /** @description 날인을 기다리는 계약(기한이 급한 순) 먼저, 그다음 최근 것부터 */
            items: components["schemas"]["MyContractListItemDto"][];
            total: number;
        };
        /**
         * @description 계약서 값과 계정 값이 다른 항목 — 날인 API 의 409 IDENTITY_MISMATCH 와 같다. 다르면 직원은 수정 요청을 낸다
         * @enum {string}
         */
        IdentityField: "name" | "phone" | "birthDate" | "gender" | "isForeigner";
        MyContractWorkerDto: {
            name: string | null;
            phone: string | null;
            /** @description YYYY-MM-DD */
            birthDate: string | null;
            gender: components["schemas"]["Gender"] | null;
            /** @description 주소 — 날인할 때 계정 주소로 고정된다. 날인 전이면 비어 있다(본인인증 정보의 주소를 보인다) */
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            isForeigner: boolean;
            /** @description 직무 — 직원 레코드 값 */
            jobTitle: string;
        };
        MyContractEmployerDto: {
            storePhone: string | null;
            storeZipCode: string | null;
            storeAddress: string | null;
            storeAddressDetail: string | null;
            /** @description 상호 */
            tradeName: string | null;
            /** @description 사업자등록번호 */
            registrationNumber: string | null;
            /** @description 대표자 */
            ceoName: string | null;
            /** @description 사업장 주소 */
            bizZipCode: string | null;
            bizAddress: string | null;
            bizAddressDetail: string | null;
            storeName: string;
        };
        MyContractAccountDto: {
            gender: components["schemas"]["Gender"] | null;
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            name: string;
            phone: string;
            /** @description YYYY-MM-DD */
            birthDate: string;
            isForeigner: boolean;
        };
        MyContractDocumentDto: {
            kind: components["schemas"]["ContractDocumentKind"];
            contractDocumentId: number;
            fileName: string;
        };
        ContractTableRowDto: {
            cells: string[];
            /** @description 근무하지 않는 날(휴무 · 주휴일) — 흐리게 그린다 */
            off: boolean;
        };
        ContractValueDto: {
            label: string;
            value: string;
        };
        ContractBlockDto: {
            /** @enum {string} */
            type: "TEXT" | "TABLE" | "VALUES";
            tableRows?: components["schemas"]["ContractTableRowDto"][];
            values?: components["schemas"]["ContractValueDto"][];
            text?: string;
            header?: string[];
        };
        ContractArticleDto: {
            blocks: components["schemas"]["ContractBlockDto"][];
            /** @description 「제1조(근로계약기간)」 */
            title: string;
        };
        MyContractDetailDto: {
            startDate: string | null;
            endDate: string | null;
            workLocation: string | null;
            weeklyHoliday: components["schemas"]["Weekday"] | null;
            /** @description 원. 시급 — 고용 형태와 상관없이 시급이다(2026-10-12) */
            wageAmount: number | null;
            /** @description 식대 — 원 */
            mealAllowanceAmount: number | null;
            /** @description 자가운전보조금 — 원 */
            carAllowanceAmount: number | null;
            /** @description 육아수당 — 원 */
            childcareAllowanceAmount: number | null;
            /** @description 월 기본시간 — 시간(0.5 단위) */
            baseHours: number | null;
            /** @description 월간 연장근무 — 시간 */
            monthlyOvertimeHours: number | null;
            /** @description 기본시간 중 야간근무 — 시간 */
            baseNightHours: number | null;
            /** @description 기본시간 중 휴일근무 — 시간. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            baseHolidayHours: number | null;
            /** @description 월간 추가 휴일근무 — 시간. 화면(front #15)에서는 받지 않는다. 칸은 남아 있다 */
            monthlyExtraHolidayHours: number | null;
            /** @description 연차휴가 조항 문구 */
            annualLeaveTerms: string | null;
            /** @description 퇴직금 조항 문구 */
            severancePayTerms: string | null;
            payMonth: components["schemas"]["PayMonth"] | null;
            payDay: number | null;
            /** @description 급여 지급 방식 — 계좌 · 현금 */
            payMethod: components["schemas"]["PayMethod"] | null;
            /** @description 수습 기간 — 개월(1~3). 수습이 없으면 null */
            probationMonths: number | null;
            /** @description 수습 중 임금 감액률 — %(0~10). 수습이 없으면 null */
            probationWageReductionRate: number | null;
            isHealthPensionInsured: boolean | null;
            isEmploymentInjuryInsured: boolean | null;
            workDays: components["schemas"]["ContractDetailWorkDayDto"][];
            status: components["schemas"]["ContractStatus"];
            employmentType: components["schemas"]["EmploymentType"] | null;
            contractMethod: components["schemas"]["ContractMethod"] | null;
            /** @description 발송 일시 (ISO 8601) — 날인할 때 그대로 보낸다(sentAt). 다르면 409 CONTRACT_RESENT */
            sentAt: string | null;
            signDeadlineAt: string | null;
            /** @description 목록과 같다 — 지금 상태가 된 시각 */
            processedAt: string | null;
            /** @description 계약서 값과 계정 값이 다른 항목 — 날인 API 의 409 IDENTITY_MISMATCH 와 같다. 다르면 직원은 수정 요청을 낸다 */
            mismatches: components["schemas"]["IdentityField"][];
            worker: components["schemas"]["MyContractWorkerDto"];
            employer: components["schemas"]["MyContractEmployerDto"];
            account: components["schemas"]["MyContractAccountDto"];
            documents: components["schemas"]["MyContractDocumentDto"][];
            /** @description 계약서 조항 열 가지 — 보낸 원본 · 처리 완료본 PDF 와 같은 템플릿(WHALEERP-131). 화면은 이 순서대로 그린다 */
            articles: components["schemas"]["ContractArticleDto"][];
            contractId: number;
            storeId: number;
            /** @description 목록과 같다 — 서명 대기 · 기한 안 · 재직 중 */
            awaitingSignature: boolean;
            /** @description 지금 날인하면 받는가 — awaitingSignature 이고 본인 대조가 맞을 때. 날인 API 와 같은 판정이다 */
            signable: boolean;
        };
        /** @enum {string} */
        NotificationRelatedType: "CONTRACT" | "INQUIRY" | "LEAD" | "STAFF_MEMBER";
        NotificationItemDto: {
            relatedType: components["schemas"]["NotificationRelatedType"] | null;
            /** @description 알림 ID(받는 사람별). 읽음 · 삭제에 쓴다 */
            id: number;
            /** @description 만들 때 쓴 템플릿 코드(NTF_*) */
            templateCode: string;
            /** @description 구분 — 지금 템플릿 이름. 템플릿이 없으면 템플릿 코드 */
            kind: string;
            /** @description 제목 — 만들 때의 문구 */
            title: string;
            /** @description 둘째 줄 — 만들 때의 문구 */
            body: string;
            relatedId: number | null;
            /** @description 알림을 눌러 갈 관리자 웹 경로. 알림을 만든 업무 쪽이 정했다. 없으면 갈 화면이 없다 */
            link: string | null;
            isRead: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        NotificationListResponseDto: {
            items: components["schemas"]["NotificationItemDto"][];
            total: number;
            /** @description 미확인 건수 — 종 배지 */
            unreadCount: number;
        };
        NotificationReadAllResponseDto: {
            /** @description 이번에 읽음으로 바뀐 건수 */
            updated: number;
        };
        /**
         * @description 수신 설정 묶음 — 지금 템플릿의 값. 템플릿이 없으면 null
         * @enum {string}
         */
        PreferenceCategory: "CONTRACT" | "SCHEDULE" | "TODO" | "PAYSLIP";
        /** @enum {string} */
        StaffNotificationTargetType: "WORK_SCHEDULE" | "TODO" | "CONTRACT" | "PAYSLIP";
        StaffNotificationTargetDto: {
            type: components["schemas"]["StaffNotificationTargetType"];
            /** @description 그 업무가 속한 내 소속. 급여명세서는 없다 */
            staffMemberId?: number;
            /** @description 근무스케줄 — 근무일 YYYY-MM-DD */
            workDate?: string;
            /** @description TO-DO */
            todoId?: number;
            /** @description 근로계약 */
            contractId?: number;
            /** @description 급여명세서 */
            payslipId?: number;
        };
        MyNotificationItemDto: {
            /** @description 수신 설정 묶음 — 지금 템플릿의 값. 템플릿이 없으면 null */
            category: components["schemas"]["PreferenceCategory"] | null;
            /** @description 눌러 열 곳. 관련 업무가 지워졌거나 내 재직 소속으로 닿을 수 없으면 null — 「열 수 없습니다」 */
            target: components["schemas"]["StaffNotificationTargetDto"] | null;
            /** @description 알림 ID(받는 사람별). 읽음 바꾸기에 쓴다 */
            id: number;
            /** @description 만들 때 쓴 템플릿 코드(PUSH_*) */
            templateCode: string;
            /** @description 제목 — 만들 때의 문구 */
            title: string;
            /** @description 둘째 줄 — 만들 때의 문구 */
            body: string;
            /** @description 긴급 TO-DO 의 수행 임박 알림 — 빨간 점 */
            isUrgent: boolean;
            isRead: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        MyNotificationListResponseDto: {
            /** @description 만든 지 14일 안, 새것부터 */
            items: components["schemas"]["MyNotificationItemDto"][];
            total: number;
            /** @description 14일 안의 미확인 건수 — 종 배지 */
            unreadCount: number;
        };
        MyNotificationPreferenceDto: {
            category: components["schemas"]["PreferenceCategory"];
            /** @description 앱 푸시 받기. 꺼도 알림함에는 남는다 */
            isEnabled: boolean;
        };
        MyNotificationPreferenceListResponseDto: {
            /** @description 네 묶음 — 근로계약서 · 근무스케줄 · TO-DO · 급여명세서 */
            items: components["schemas"]["MyNotificationPreferenceDto"][];
        };
        UpdateMyNotificationPreferenceDto: {
            /** @description 앱 푸시 받기 */
            isEnabled: boolean;
        };
        StoreSummaryResponseDto: {
            /** @enum {string} */
            storeTypeCode: "DIRECT" | "FRANCHISE";
            /** @enum {string} */
            storeStatusCode: "NOT_OPERATING" | "OPERATING" | "CLOSED";
            storeId: number;
            /**
             * @description 점포코드.
             * @example ST000001
             */
            storeCode: string;
            /** @description 점포명 */
            name: string;
            /** @description 소속 BP */
            bpCodeId: number;
            /** @description 소속 BP 상호명 — 플랫폼 계정이 여러 BP 를 함께 볼 때 쓴다 */
            bpTradeName: string;
            /** @description 사업자등록번호(숫자 10자리). 없으면 미인증 — 화면은 「-」와 「사업자정보 미인증」. */
            bizRegistrationNumber: string | null;
            /** @description 점포 연락처 */
            phone: string | null;
            /**
             * @description 지역 — 기본주소의 앞 두 마디.
             * @example 서울특별시 서초구
             */
            region: string | null;
            /** @description 재직 직원 수 — 이 점포가 근무지이고 퇴직하지 않았으며 지금 체결 완료 근로계약이 있는 직원 레코드. 체결 완료 계약이 없는 레코드(초안 · 발송 대기 · 서명 대기 · 수정 요청 · 거부 · 만료 · 종료뿐)는 세지 않는다. 퇴직 예정은 퇴직일까지 센다 */
            staffCount: number;
            /** @description 대표 이미지 썸네일 주소(5분 동안 유효). 이미지가 없거나 저장소를 쓸 수 없으면 null — 화면은 점포 아이콘. */
            imageUrl: string | null;
            /**
             * Format: date-time
             * @description 등록일시
             */
            createdAt: string;
        };
        StoreListResponseDto: {
            items: components["schemas"]["StoreSummaryResponseDto"][];
            total: number;
        };
        VerifyStoreBusinessDto: {
            /** @description 수정 중인 점포. 등록 화면이면 보내지 않는다. */
            storeId?: number;
            /**
             * @description 사업자등록번호 — 하이픈은 빼고 숫자 10자리로 저장한다.
             * @example 123-45-67890
             */
            bizRegistrationNumber: string;
            /** @description 대표자명 */
            ceoName: string;
            /**
             * @description 개업일자.
             * @example 2020-03-02
             */
            openDate: string;
        };
        /**
         * @description 인증됨 · 확인 불가(국세청 정보와 다름) · 번호 중복(미운영 · 운영 점포나 소속 BP 가 아닌 고객 BP 가 쓰는 번호 — 누가 쓰는지는 알리지 않는다, PL-OCJOFP)
         * @enum {string}
         */
        StoreBusinessVerificationResult: "VERIFIED" | "UNVERIFIABLE" | "DUPLICATE";
        StoreBusinessVerificationResponseDto: {
            /** @description 인증됨 · 확인 불가(국세청 정보와 다름) · 번호 중복(미운영 · 운영 점포나 소속 BP 가 아닌 고객 BP 가 쓰는 번호 — 누가 쓰는지는 알리지 않는다, PL-OCJOFP) */
            result: components["schemas"]["StoreBusinessVerificationResult"];
        };
        StoreBusinessResponseDto: {
            /** @description 인증 완료 — 사업자등록번호가 있으면 인증된 것이다 */
            isVerified: boolean;
            bizRegistrationNumber: string | null;
            ceoName: string | null;
            /** @description 개업일자 YYYY-MM-DD */
            openDate: string | null;
            /**
             * Format: date-time
             * @description 최종 인증일시
             */
            verifiedAt: string | null;
            tradeName: string | null;
            ceoPhone: string | null;
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            category: string | null;
            item: string | null;
        };
        /** @enum {string} */
        StoreImageFileType: "JPG" | "PNG";
        StoreImageResponseDto: {
            fileType: components["schemas"]["StoreImageFileType"];
            fileId: number;
            /** @description 올린 원래 파일 이름 */
            fileName: string;
            sizeBytes: number;
            /** @description 보여 줄 주소(서명, 5분 동안 유효). 저장소를 쓸 수 없으면 null. */
            url: string | null;
        };
        StoreFloorResponseDto: {
            /** @enum {string|null} */
            floorTypeCode: "GROUND" | "BASEMENT" | null;
            storeFloorId: number;
            floorNumber: number | null;
            floorAreaPyeong: number | null;
            floorAreaSqm: number | null;
            seatCount: number | null;
        };
        /**
         * @description 운영으로 바꾸는 데 모자란 것. 비어 있으면 운영할 수 있다. 한글은 GET /enums/StoreOperationRequirement.
         * @enum {string}
         */
        StoreOperationRequirement: "BUSINESS_VERIFICATION" | "COORDINATES" | "BP_INACTIVE";
        StoreTransitionCheckResponseDto: {
            /** @description 운영으로 바꾸는 데 모자란 것. 비어 있으면 운영할 수 있다. 한글은 GET /enums/StoreOperationRequirement. */
            missingForOperation: components["schemas"]["StoreOperationRequirement"][];
            /** @description 진행 중인 근로계약 수 — 거부 · 만료 · 종료되지 않은 계약. 0 이어야 폐점 · 삭제된다. */
            inProgressContractCount: number;
            /** @description 폐점할 수 있는가 */
            canClose: boolean;
            /** @description 삭제할 수 있는가 — 미운영이면서 폐점 조건을 채울 때 */
            canDelete: boolean;
            /** @description 구독 · 정산 조건은 1차 범위 밖이라 보지 않는다 — 화면은 「1차 범위 밖」으로 보인다 */
            isSubscriptionChecked: boolean;
        };
        StoreDetailResponseDto: {
            /** @enum {string} */
            storeTypeCode: "DIRECT" | "FRANCHISE";
            /** @enum {string} */
            storeStatusCode: "NOT_OPERATING" | "OPERATING" | "CLOSED";
            storeId: number;
            storeCode: string;
            name: string;
            /** @description 폐점일 YYYY-MM-DD. 폐점이 아니면 null. */
            closedDate: string | null;
            bpCodeId: number;
            /**
             * @description 소속 BP 코드.
             * @example BP000001
             */
            bpCode: string;
            bpTradeName: string;
            /** @description 소속 BP 상태 — ACTIVE 가 아니면 조회만 된다(STORE-3) */
            bpAccountStatusCode: string;
            phone: string | null;
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            latitude: number | null;
            longitude: number | null;
            isLocationApplied: boolean;
            /** @description 재직 직원 수 — 목록의 staffCount 와 같은 기준 */
            staffCount: number;
            business: components["schemas"]["StoreBusinessResponseDto"];
            /** @description 대표 이미지. 없으면 null. */
            image: components["schemas"]["StoreImageResponseDto"] | null;
            floors: components["schemas"]["StoreFloorResponseDto"][];
            transitions: components["schemas"]["StoreTransitionCheckResponseDto"];
            /** Format: date-time */
            createdAt: string;
            /** @description 등록자 이름. 시스템이 만들었으면 null. */
            createdByName: string | null;
            /**
             * Format: date-time
             * @description 최종수정일시. 수정할 때 그대로 돌려보낸다(동시 수정 확인).
             */
            updatedAt: string;
            /** @description 최종수정자 이름. 등록 뒤 고친 적이 없으면 null — 화면은 「-」. */
            updatedByName: string | null;
        };
        StoreHistoryResponseDto: {
            changeId: number;
            /** @description 변경 항목. */
            field: string;
            beforeValue: string | null;
            afterValue: string | null;
            /** Format: date-time */
            changedAt: string;
            /** @description 변경자 이름. 시스템이 처리했으면 null. */
            changedByName: string | null;
        };
        StoreHistoryListResponseDto: {
            items: components["schemas"]["StoreHistoryResponseDto"][];
            total: number;
        };
        StoreFloorInputDto: {
            /**
             * @description 지상 · 지하
             * @enum {string|null}
             */
            floorTypeCode?: "GROUND" | "BASEMENT" | null;
            /** @description 층수 */
            floorNumber?: number | null;
            /** @description 매장평수 — 소수 1자리 */
            floorAreaPyeong?: number | null;
            /** @description 전용면적(㎡) — 소수 2자리 */
            floorAreaSqm?: number | null;
            /** @description 좌석수 — 0 이상 */
            seatCount?: number | null;
        };
        StoreBusinessInputDto: {
            /** @description 상호명 — 국세청이 돌려주지 않아 직접 넣는다. 50자. */
            tradeName?: string | null;
            /** @description 대표자 연락처 — 숫자 9~12자리(점포 연락처와 같다) */
            ceoPhone?: string | null;
            /** @description 사업자 우편번호 — 숫자 5자리 */
            zipCode?: string | null;
            /** @description 사업자 기본주소 — 주소 검색 결과 */
            address?: string | null;
            /** @description 사업자 상세주소 — 100자 */
            addressDetail?: string | null;
            /** @description 업태 — 50자 */
            category?: string | null;
            /** @description 종목 — 50자 */
            item?: string | null;
        };
        BusinessIdentityInputDto: {
            /**
             * @description 사업자등록번호 — 하이픈은 빼고 숫자 10자리로 저장한다.
             * @example 123-45-67890
             */
            bizRegistrationNumber: string;
            /** @description 대표자명 */
            ceoName: string;
            /**
             * @description 개업일자.
             * @example 2020-03-02
             */
            openDate: string;
        };
        CreateStoreDto: {
            /**
             * @description 점포 유형 — 등록 뒤 바꾸지 않는다
             * @enum {string}
             */
            storeTypeCode: "DIRECT" | "FRANCHISE";
            /**
             * @deprecated
             * @description 소속 BP — 보내지 않는다. 이 칸은 대상 BP(플랫폼 계정은 X-Bp-Code-Id 헤더의 BP, 그 밖의 계정은 소속 BP)와 같을
             *     때만 받는다(다르면 400). front 가 아직 보내서 남겨 둔 칸이다 — front 가 보내지 않게 되면 뺀다. 빼면 전역
             *     파이프가 이 키를 400 으로 막으므로 front 가 그만 보냈는지 먼저 확인한다.
             */
            bpCodeId?: number;
            /** @description 점포명 — 1~50자 */
            name: string;
            /** @description 점포 연락처 — 숫자 9~12자리(12자리는 050X 평생번호, 예 050720331334) */
            phone?: string | null;
            /** @description 우편번호 — 숫자 5자리, 주소 검색 결과 */
            zipCode?: string | null;
            /** @description 기본주소 — 주소 검색 결과 */
            address?: string | null;
            /** @description 상세주소 — 100자 */
            addressDetail?: string | null;
            /** @description 위도 — −90~90, 소수 6자리 */
            latitude?: number | null;
            /** @description 경도 — −180~180, 소수 6자리 */
            longitude?: number | null;
            /**
             * @description 위치 적용 여부 — 기본 사용. 3팀 출퇴근 위치 확인이 볼 자리다(아직 읽는 곳은 없다).
             * @default true
             */
            isLocationApplied: boolean;
            /**
             * @description 층별 정보. 저장할 때마다 이 목록으로 바꾼다. 모든 칸이 빈 줄은 버린다.
             * @default []
             */
            floors: components["schemas"]["StoreFloorInputDto"][];
            /**
             * @description 직접 넣는 사업자정보
             * @default {}
             */
            business: components["schemas"]["StoreBusinessInputDto"];
            /**
             * @description 사업자 인증. 인증한 화면에서만 보낸다 — 서버가 다시 확인하고 맞으면 사업자등록번호 · 대표자명 · 개업일자를
             *     저장한다. 이미 번호가 있는 점포는 재인증이라 번호 · 개업일자가 저장된 값과 같아야 한다.
             */
            businessVerification?: components["schemas"]["BusinessIdentityInputDto"];
        };
        CreateStoreResponseDto: {
            storeId: number;
            storeCode: string;
        };
        UpdateStoreDto: {
            /** @description 상세에서 받은 updatedAt 그대로 — 그 사이 누가 고쳤으면 409. */
            updatedAt: string;
            /**
             * @description 점포 상태. 미운영 → 운영 · 폐점, 운영 → 폐점만. 그대로 두려면 지금 값을 보낸다.
             * @enum {string}
             */
            storeStatus: "NOT_OPERATING" | "OPERATING" | "CLOSED";
            /** @description 점포명 — 1~50자 */
            name: string;
            /** @description 점포 연락처 — 숫자 9~12자리(12자리는 050X 평생번호, 예 050720331334) */
            phone?: string | null;
            /** @description 우편번호 — 숫자 5자리, 주소 검색 결과 */
            zipCode?: string | null;
            /** @description 기본주소 — 주소 검색 결과 */
            address?: string | null;
            /** @description 상세주소 — 100자 */
            addressDetail?: string | null;
            /** @description 위도 — −90~90, 소수 6자리 */
            latitude?: number | null;
            /** @description 경도 — −180~180, 소수 6자리 */
            longitude?: number | null;
            /**
             * @description 위치 적용 여부 — 기본 사용. 3팀 출퇴근 위치 확인이 볼 자리다(아직 읽는 곳은 없다).
             * @default true
             */
            isLocationApplied: boolean;
            /**
             * @description 층별 정보. 저장할 때마다 이 목록으로 바꾼다. 모든 칸이 빈 줄은 버린다.
             * @default []
             */
            floors: components["schemas"]["StoreFloorInputDto"][];
            /**
             * @description 직접 넣는 사업자정보
             * @default {}
             */
            business: components["schemas"]["StoreBusinessInputDto"];
            /**
             * @description 사업자 인증. 인증한 화면에서만 보낸다 — 서버가 다시 확인하고 맞으면 사업자등록번호 · 대표자명 · 개업일자를
             *     저장한다. 이미 번호가 있는 점포는 재인증이라 번호 · 개업일자가 저장된 값과 같아야 한다.
             */
            businessVerification?: components["schemas"]["BusinessIdentityInputDto"];
        };
        /**
         * @description 게시 상태. 게시하려면 노출 대상이 하나 이상 있어야 한다.
         * @enum {string}
         */
        PostStatus: "DRAFT" | "PUBLISHED" | "PRIVATE";
        /**
         * @description 공지사항 유형. 공지사항이면 필수.
         * @enum {string}
         */
        NoticeType: "MAINTENANCE" | "FEATURE" | "TERMS" | "GENERAL";
        CreatePostDto: {
            /** @description 게시 상태. 게시하려면 노출 대상이 하나 이상 있어야 한다. */
            status: components["schemas"]["PostStatus"];
            /** @description 공지사항 유형. 공지사항이면 필수. */
            noticeType?: components["schemas"]["NoticeType"] | null;
            /**
             * @description 노출 대상. 1차는 비회원 · 회원 · BP · 점포. 「전체」는 네 개를 모두 보낸다. 빼면 빈 목록이다.
             * @default []
             */
            audiences: ("GUEST" | "MEMBER" | "BP" | "STORE")[];
            /** @description 제목. 200자까지. */
            title: string;
            /**
             * @description 본문. 평문이다 — 서버는 정화하지 않고 그대로 저장 · 반환하며, 화면은 HTML 로 그리지 않고 이스케이프해 보인다
             *     (2026-10-13 재영). 20,000자까지.
             */
            body: string;
            /** @description 상단 고정. 공지사항만, 기본 false. */
            isPinned?: boolean;
            /**
             * @description 게시 시작일(YYYY-MM-DD). 공지사항만. 여기서는 저장만 한다 — 사용자 쪽 노출은 이 기간 안에만 되고,
             *     시작일이 없으면 등록 일시부터 보이며 게시일도 등록 일시로 본다(WHALEERP-273, 판정은 조회 API 몫).
             * @example 2026-10-14
             */
            publishStartDate?: string | null;
            /** @description 게시 종료일(YYYY-MM-DD). 공지사항만. 사용자 쪽에는 그날까지 보인다. 시작일보다 앞설 수 없다. */
            publishEndDate?: string | null;
            /** @description FAQ 카테고리 — 공통코드 FAQ_CATEGORY 의 플랫폼 원본 중 사용 중인 상세코드. FAQ 면 필수. */
            faqCategoryCode?: string | null;
        };
        UpdatePostDto: {
            /** @description 게시 상태. 게시하려면 노출 대상이 하나 이상 있어야 한다. */
            status: components["schemas"]["PostStatus"];
            /** @description 공지사항 유형. 공지사항이면 필수. */
            noticeType?: components["schemas"]["NoticeType"] | null;
            /**
             * @description 노출 대상. 1차는 비회원 · 회원 · BP · 점포. 「전체」는 네 개를 모두 보낸다. 빼면 빈 목록이다.
             * @default []
             */
            audiences: ("GUEST" | "MEMBER" | "BP" | "STORE")[];
            /**
             * @description 고치기 전에 읽은 `updatedAt` 그대로. 그 뒤 누가 고쳤으면 409 이고, 상세를 다시 읽어 최신 내용을 본다.
             * @example 2026-10-13T01:02:03.456Z
             */
            updatedAt: string;
            /**
             * @description 뺄 첨부파일 ID. 공지사항만. 보내지 않으면 지금 첨부를 모두 남긴다 — 더할 파일은 같은 요청의 `files` 칸이다.
             *     그 공지의 지우지 않은 첨부가 아니면 400.
             */
            removeAttachmentIds?: number[];
            /** @description 제목. 200자까지. */
            title: string;
            /**
             * @description 본문. 평문이다 — 서버는 정화하지 않고 그대로 저장 · 반환하며, 화면은 HTML 로 그리지 않고 이스케이프해 보인다
             *     (2026-10-13 재영). 20,000자까지.
             */
            body: string;
            /** @description 상단 고정. 공지사항만, 기본 false. */
            isPinned?: boolean;
            /**
             * @description 게시 시작일(YYYY-MM-DD). 공지사항만. 여기서는 저장만 한다 — 사용자 쪽 노출은 이 기간 안에만 되고,
             *     시작일이 없으면 등록 일시부터 보이며 게시일도 등록 일시로 본다(WHALEERP-273, 판정은 조회 API 몫).
             * @example 2026-10-14
             */
            publishStartDate?: string | null;
            /** @description 게시 종료일(YYYY-MM-DD). 공지사항만. 사용자 쪽에는 그날까지 보인다. 시작일보다 앞설 수 없다. */
            publishEndDate?: string | null;
            /** @description FAQ 카테고리 — 공통코드 FAQ_CATEGORY 의 플랫폼 원본 중 사용 중인 상세코드. FAQ 면 필수. */
            faqCategoryCode?: string | null;
        };
        /** @enum {string} */
        PostContentType: "NOTICE" | "FAQ";
        PostListItemDto: {
            contentType: components["schemas"]["PostContentType"];
            status: components["schemas"]["PostStatus"];
            noticeType: components["schemas"]["NoticeType"] | null;
            postId: number;
            title: string;
            faqCategoryCode: string | null;
            /** @description 상단 고정 표시. 관리자 목록은 고정 글을 위로 올리지 않는다 — 최근 수정일 순서 그대로다. */
            isPinned: boolean;
            /**
             * Format: date-time
             * @description 최근 수정 일시
             */
            updatedAt: string;
            /** @description 최근 수정자 이름. 수정자가 없거나, 계정을 찾을 수 없거나, 이름이 비어 있으면 null. */
            updatedByName: string | null;
        };
        PostListResponseDto: {
            items: components["schemas"]["PostListItemDto"][];
            total: number;
        };
        /** @enum {string} */
        PostAudienceType: "GUEST" | "MEMBER" | "BP" | "STORE" | "ADDON";
        /** @enum {string} */
        AttachmentFileType: "JPG" | "PNG" | "PDF";
        PostAttachmentDto: {
            fileType: components["schemas"]["AttachmentFileType"];
            postAttachmentId: number;
            /** @description 원래 파일 이름 */
            fileName: string;
            sizeBytes: number;
        };
        PostResponseDto: {
            contentType: components["schemas"]["PostContentType"];
            status: components["schemas"]["PostStatus"];
            noticeType: components["schemas"]["NoticeType"] | null;
            audiences: components["schemas"]["PostAudienceType"][];
            postId: number;
            title: string;
            body: string;
            isPinned: boolean;
            /** @description 게시 시작일(YYYY-MM-DD) */
            publishStartDate: string | null;
            /** @description 게시 종료일(YYYY-MM-DD) */
            publishEndDate: string | null;
            faqCategoryCode: string | null;
            /** @description 첨부파일. 올린 순서. FAQ 는 늘 빈 목록이다. */
            attachments: components["schemas"]["PostAttachmentDto"][];
            /** Format: date-time */
            createdAt: string;
            /**
             * Format: date-time
             * @description 최근 수정 일시. 수정할 때 이 값을 그대로 보낸다.
             */
            updatedAt: string;
            /** @description 최근 수정자(관리자 ID) */
            updatedBy: number | null;
            updatedByName: string | null;
        };
        PublishedPostResponseDto: {
            contentType: components["schemas"]["PostContentType"];
            noticeType: components["schemas"]["NoticeType"] | null;
            postId: number;
            title: string;
            /** @description 평문. 화면은 HTML 로 그리지 않고 이스케이프해 보인다. */
            body: string;
            faqCategoryCode: string | null;
            /** @description 상단 고정. 목록은 고정 글을 먼저 준다. */
            isPinned: boolean;
            /** @description 게시일(YYYY-MM-DD) — 게시 시작일, 없으면 등록 일시의 한국 날짜. */
            postedDate: string;
        };
        PublishedPostListResponseDto: {
            items: components["schemas"]["PublishedPostResponseDto"][];
            total: number;
        };
        PostNeighborDto: {
            postId: number;
            title: string;
            /** @description 게시일(YYYY-MM-DD). */
            postedDate: string;
        };
        SupportPostResponseDto: {
            contentType: components["schemas"]["PostContentType"];
            noticeType: components["schemas"]["NoticeType"] | null;
            postId: number;
            title: string;
            /** @description 평문. 화면은 HTML 로 그리지 않고 이스케이프해 보인다. */
            body: string;
            faqCategoryCode: string | null;
            /** @description 상단 고정. 목록은 고정 글을 먼저 준다. */
            isPinned: boolean;
            /** @description 게시일(YYYY-MM-DD) — 게시 시작일, 없으면 등록 일시의 한국 날짜. */
            postedDate: string;
            /**
             * @description 이전 — 목록에서 바로 아래 글(대개 더 오래된 글. 상단 고정 글의 맨 아래에서는 그보다 새 일반 글일 수 있다).
             *     맨 아래면 null.
             */
            prev: components["schemas"]["PostNeighborDto"] | null;
            /** @description 다음 — 목록에서 바로 위 글(대개 더 새 글). 맨 위면 null. */
            next: components["schemas"]["PostNeighborDto"] | null;
            attachments: components["schemas"]["PostAttachmentDto"][];
        };
        PublishedPostDetailResponseDto: {
            contentType: components["schemas"]["PostContentType"];
            noticeType: components["schemas"]["NoticeType"] | null;
            postId: number;
            title: string;
            /** @description 평문. 화면은 HTML 로 그리지 않고 이스케이프해 보인다. */
            body: string;
            faqCategoryCode: string | null;
            /** @description 상단 고정. 목록은 고정 글을 먼저 준다. */
            isPinned: boolean;
            /** @description 게시일(YYYY-MM-DD) — 게시 시작일, 없으면 등록 일시의 한국 날짜. */
            postedDate: string;
            attachments: components["schemas"]["PostAttachmentDto"][];
        };
        /** @enum {string} */
        NotificationTemplateChannel: "NOTIFICATION" | "PUSH" | "EMAIL" | "ALIMTALK";
        TemplateListItemDto: {
            channel: components["schemas"]["NotificationTemplateChannel"];
            preferenceCategory: components["schemas"]["PreferenceCategory"] | null;
            id: number;
            templateCode: string;
            templateName: string;
            title: string | null;
            /** @description 본문 앞 60자 — 알림톡 목록의 본문 요약 */
            bodySummary: string;
            kakaoTemplateCode: string | null;
            isActive: boolean;
            /** @description 기본 문구가 있는지(마이그레이션으로 넣은 기본 템플릿 47건) — 되돌리기를 보일지 */
            hasDefault: boolean;
            /** @description 마지막으로 고친 관리자 이름. 아무도 고치지 않았으면 null — 화면은 「기본 문구」 */
            updatedByName: string | null;
            /** Format: date-time */
            updatedAt: string;
        };
        TemplateListResponseDto: {
            items: components["schemas"]["TemplateListItemDto"][];
            total: number;
        };
        TemplateVariableDto: {
            /** @description 변수 이름 — 본문에 #{이름} 으로 쓴다. # · 중괄호 · 공백 없이, 한글 가능 */
            name: string;
            /** @description 표시 이름 */
            label: string;
            isRequired: boolean;
            /** @description 미리보기에 넣는 예시 값 */
            sampleValue: string;
            /** @description 버튼 링크 — 메일 공통 틀 · 알림톡 버튼이 붙인다. 메일 · 알림톡에만 (NOTIFY-20) */
            isButtonLink?: boolean;
        };
        TemplateHistoryDto: {
            /** Format: date-time */
            changedAt: string;
            changedByName: string | null;
            /** @description 이 변경에서 바뀐 것 — 예: 「제목 · 본문」 */
            summary: string;
        };
        TemplateDetailDto: {
            channel: components["schemas"]["NotificationTemplateChannel"];
            preferenceCategory: components["schemas"]["PreferenceCategory"] | null;
            id: number;
            templateCode: string;
            templateName: string;
            title: string | null;
            /** @description 본문 앞 60자 — 알림톡 목록의 본문 요약 */
            bodySummary: string;
            kakaoTemplateCode: string | null;
            isActive: boolean;
            /** @description 기본 문구가 있는지(마이그레이션으로 넣은 기본 템플릿 47건) — 되돌리기를 보일지 */
            hasDefault: boolean;
            /** @description 마지막으로 고친 관리자 이름. 아무도 고치지 않았으면 null — 화면은 「기본 문구」 */
            updatedByName: string | null;
            /** Format: date-time */
            updatedAt: string;
            body: string;
            variables: components["schemas"]["TemplateVariableDto"][];
            /** @description 최근 것부터 */
            histories: components["schemas"]["TemplateHistoryDto"][];
        };
        CreateTemplateDto: {
            channel: components["schemas"]["NotificationTemplateChannel"];
            /** @description 수신 설정 묶음 — 앱 푸시만 */
            preferenceCategory?: components["schemas"]["PreferenceCategory"] | null;
            /** @description 제목 — 알림톡은 비운다 */
            title?: string | null;
            /** @description 카카오 템플릿 코드 — 알림톡만 */
            kakaoTemplateCode?: string | null;
            isActive: boolean;
            templateName: string;
            /** @description 템플릿 코드 — 발송 코드가 이 값으로 부른다. 고칠 수 있다 */
            templateCode: string;
            body: string;
            variables: components["schemas"]["TemplateVariableDto"][];
        };
        UpdateTemplateDto: {
            channel: components["schemas"]["NotificationTemplateChannel"];
            /** @description 수신 설정 묶음 — 앱 푸시만 */
            preferenceCategory?: components["schemas"]["PreferenceCategory"] | null;
            /** @description 제목 — 알림톡은 비운다 */
            title?: string | null;
            /** @description 카카오 템플릿 코드 — 알림톡만 */
            kakaoTemplateCode?: string | null;
            /** @example 2026-10-13T01:02:03.456Z */
            updatedAt: string;
            templateName: string;
            /** @description 템플릿 코드 — 발송 코드가 이 값으로 부른다. 고칠 수 있다 */
            templateCode: string;
            body: string;
            variables: components["schemas"]["TemplateVariableDto"][];
        };
        TemplateVersionDto: {
            /** @example 2026-10-13T01:02:03.456Z */
            updatedAt: string;
        };
        SetTemplateActiveDto: {
            /** @example 2026-10-13T01:02:03.456Z */
            updatedAt: string;
            isActive: boolean;
        };
        /**
         * @description 관심 서비스. 하나 이상, 겹치지 않게.
         * @enum {string}
         */
        LeadInterest: "STORE_OPERATION" | "FINANCE" | "FRANCHISE" | "OTHER";
        CreateLeadDto: {
            /** @description 관심 서비스. 하나 이상, 겹치지 않게. */
            interests: components["schemas"]["LeadInterest"][];
            /**
             * @description 문의자 이름. 앞뒤 공백을 지우고 1~50자.
             * @example 김도윤
             */
            contactName: string;
            /**
             * @description 업종 — 공통코드 `INDUSTRY` 의 상세 코드.
             * @example CAFE
             */
            industryCode: string;
            /**
             * @description 업종 직접 입력. 업종이 기타(`ETC`)일 때만 필수이고, 아니면 저장하지 않는다.
             * @example 꽃집
             */
            industryDetail?: string;
            /**
             * @description 전화번호. 점포 번호도 된다. 하이픈 · 공백은 지우고 숫자만 저장한다 — 0으로 시작하는 9~11자리,
             *     또는 대표번호(15xx · 16xx · 18xx, 8자리).
             *     10분 중복 접수는 전화번호나 이메일 중 하나라도 같으면 막는다.
             * @example 02-1234-5678
             */
            phone: string;
            /**
             * Format: email
             * @description 이메일. 소문자로 저장한다. 10분 중복 접수 판정에 전화번호와 함께 쓴다.
             */
            email: string;
            /**
             * @description 도입 예정 시기 — 공통코드 `PLAN_PERIOD` 의 상세 코드. 선택이며, 고르지 않으면 칸을 빼거나 null 로 보낸다(빈 문자열은 400).
             * @example WITHIN_1M
             */
            planPeriodCode?: string | null;
            /** @description 문의 내용. 앞뒤 공백을 지우고 1~2000자. */
            body: string;
            /** @description 개인정보 수집·이용 동의. 필수라 `true` 만 받는다. */
            privacyAgreed: boolean;
            /** @description 마케팅 정보 수신 동의. 선택. */
            marketingAgreed?: boolean;
        };
        /** @enum {string} */
        InquiryAnswerStatus: "WAITING" | "ANSWERED";
        /** @enum {string} */
        InquiryStatus: "RECEIVED" | "IN_PROGRESS" | "ANSWERED";
        LeadListItemDto: {
            interests: components["schemas"]["LeadInterest"][];
            status: components["schemas"]["InquiryStatus"];
            leadId: number;
            /** @description 문의자 이름 */
            contactName: string;
            phone: string;
            /** @description 업종(공통코드 INDUSTRY 값) */
            industryCode: string;
            /** @description 업종 직접 입력 — 업종이 기타일 때 */
            industryDetail: string | null;
            /**
             * Format: date-time
             * @description 접수 일시
             */
            createdAt: string;
        };
        LeadListResponseDto: {
            items: components["schemas"]["LeadListItemDto"][];
            total: number;
        };
        /**
         * @description 마지막 답변 메일 결과(#597). 실패면 「답변 메일 다시 보내기」로 다시 보낸다. null 이면 보낸 적 없거나(시각도 null)
         *     결과를 아직 모른다(시각만 있음 — 보내는 중이거나 결과를 남기지 못함).
         * @enum {string}
         */
        ReplyMailResult: "SUCCEEDED" | "FAILED";
        LeadResponseDto: {
            interests: components["schemas"]["LeadInterest"][];
            status: components["schemas"]["InquiryStatus"];
            /**
             * @description 마지막 답변 메일 결과(#597). 실패면 「답변 메일 다시 보내기」로 다시 보낸다. null 이면 보낸 적 없거나(시각도 null)
             *     결과를 아직 모른다(시각만 있음 — 보내는 중이거나 결과를 남기지 못함).
             */
            replyMailResult: components["schemas"]["ReplyMailResult"] | null;
            email: string;
            /** @description 도입 예정 시기(공통코드 값) */
            planPeriodCode: string | null;
            /** @description 문의 내용 */
            body: string;
            /**
             * Format: date-time
             * @description 개인정보 동의 일시 — 필수라 늘 있다
             */
            privacyAgreedAt: string;
            /**
             * Format: date-time
             * @description 마케팅 수신 동의 일시. 동의하지 않았으면 null.
             */
            marketingAgreedAt: string | null;
            /**
             * Format: date-time
             * @description 처리중으로 바꾼 시각. 아직 접수 상태이거나, 처리중을 거치지 않고 답변했으면 null.
             */
            processingStartedAt: string | null;
            processingStartedBy: number | null;
            processingStartedByName: string | null;
            /** @description 문의자에게 보낸 답변 */
            reply: string | null;
            /** Format: date-time */
            repliedAt: string | null;
            repliedBy: number | null;
            repliedByName: string | null;
            /**
             * Format: date-time
             * @description 마지막으로 답변 메일을 보내려 한 시각. 보낸 적 없으면 null.
             */
            replyMailAttemptedAt: string | null;
            /** @description 운영자 내부 메모. 문의자에게 보이지 않는다. */
            internalMemo: string | null;
            /** @description 상담 완료일(YYYY-MM-DD) — 이날부터 1년 뒤 파기 */
            consultedDate: string | null;
            /**
             * Format: date-time
             * @description 최근 수정 일시
             */
            updatedAt: string;
            leadId: number;
            /** @description 문의자 이름 */
            contactName: string;
            phone: string;
            /** @description 업종(공통코드 INDUSTRY 값) */
            industryCode: string;
            /** @description 업종 직접 입력 — 업종이 기타일 때 */
            industryDetail: string | null;
            /**
             * Format: date-time
             * @description 접수 일시
             */
            createdAt: string;
        };
        LeadStateResponseDto: {
            status: components["schemas"]["InquiryStatus"];
            leadId: number;
            /** Format: date-time */
            updatedAt: string;
        };
        SaveLeadReplyDto: {
            /**
             * @description 답변하기 전에 읽은 도입문의의 `updatedAt` 그대로. 그사이 다른 운영자가 저장했으면 409 다.
             * @example 2026-10-14T01:02:03.456Z
             */
            updatedAt: string;
            /** @description 문의자에게 회신할 답변. 평문이고 20,000자까지. */
            reply: string;
        };
        LeadReplyMailResponseDto: {
            replyMailResult: components["schemas"]["ReplyMailResult"];
            /**
             * Format: date-time
             * @description 보내려 한 시각. 같은 도입문의는 이 시각부터 1분이 지나면 다시 보낼 수 있다.
             */
            replyMailAttemptedAt: string;
        };
        SaveInternalMemoDto: {
            /** @description 메모. 2,000자까지. null · 빈 문자열 · 공백만 보내면 지운다. 키는 빼먹을 수 없다 — 빠진 키로 메모가 지워지지 않게. */
            internalMemo: string | null;
            /**
             * @description 저장하기 전에 읽은 `updatedAt` 그대로. 그사이 다른 운영자가 저장했으면 409 다.
             * @example 2026-10-14T01:02:03.456Z
             */
            updatedAt: string;
        };
        InquiryListItemDto: {
            status: components["schemas"]["InquiryStatus"];
            inquiryId: number;
            title: string;
            /** @description 문의 유형(공통코드 값) */
            inquiryCategoryCode: string;
            /**
             * Format: date-time
             * @description 접수 일시
             */
            createdAt: string;
            /** @description BP 이름(상호). BP 를 찾을 수 없으면 null. */
            bpName: string | null;
            /** @description 점포 이름. 점포 대상 문의가 아니거나 점포를 찾을 수 없으면 null. */
            storeName: string | null;
            /** @description 보낸 사람(등록한 관리자) 이름. 계정을 찾을 수 없거나 이름 칸이 NULL 이면 null. */
            senderName: string | null;
        };
        InquiryListResponseDto: {
            items: components["schemas"]["InquiryListItemDto"][];
            total: number;
        };
        InquiryReplyDto: {
            inquiryReplyId: number;
            body: string;
            /** Format: date-time */
            repliedAt: string;
            repliedBy: number;
            repliedByName: string | null;
        };
        InquiryAttachmentDto: {
            fileType: components["schemas"]["AttachmentFileType"];
            inquiryAttachmentId: number;
            fileName: string;
            sizeBytes: number;
            /** @description 작은 미리보기(이미지만, 300초 서명 주소). PDF · 저장소 설정 없음 · 서명 실패면 null. */
            thumbnailUrl: string | null;
        };
        InquiryResponseDto: {
            status: components["schemas"]["InquiryStatus"];
            inquiryId: number;
            title: string;
            /** @description 문의 유형(공통코드 값) */
            inquiryCategoryCode: string;
            /**
             * Format: date-time
             * @description 접수 일시
             */
            createdAt: string;
            /** @description BP 이름(상호). BP 를 찾을 수 없으면 null. */
            bpName: string | null;
            /** @description 점포 이름. 점포 대상 문의가 아니거나 점포를 찾을 수 없으면 null. */
            storeName: string | null;
            /** @description 보낸 사람(등록한 관리자) 이름. 계정을 찾을 수 없거나 이름 칸이 NULL 이면 null. */
            senderName: string | null;
            body: string;
            /** @description 보낸 사람(등록한 관리자) ID */
            createdBy: number;
            /** @description 보낸 사람의 권한 유형(공통코드 ROLE_TYPE). 계정을 찾을 수 없으면 null. */
            senderRoleTypeCode: string | null;
            /**
             * Format: date-time
             * @description 처리중으로 바꾼 시각 — 처리 이력의 「확인」 줄. 아직 접수 상태이거나, 처리중을 거치지 않고 답변했으면 null.
             */
            processingStartedAt: string | null;
            processingStartedBy: number | null;
            processingStartedByName: string | null;
            /** @description 답변 이력. 오래된 것부터. */
            replies: components["schemas"]["InquiryReplyDto"][];
            /** @description 첨부파일. 순서대로. */
            attachments: components["schemas"]["InquiryAttachmentDto"][];
            /** @description 운영자 내부 메모. 문의자에게 보이지 않는다. */
            internalMemo: string | null;
            /**
             * Format: date-time
             * @description 최근 수정 일시
             */
            updatedAt: string;
        };
        InquiryStateResponseDto: {
            status: components["schemas"]["InquiryStatus"];
            inquiryId: number;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateInquiryReplyDto: {
            /**
             * @description 답변하기 전에 읽은 문의의 `updatedAt` 그대로. 그사이 다른 운영자가 처리중 전환 · 답변 · 메모를 저장했으면 409 이고,
             *     다시 읽어 최신 내용을 본다.
             * @example 2026-10-14T01:02:03.456Z
             */
            updatedAt: string;
            /** @description 문의자에게 보이는 답변. 평문이고 20,000자까지. 첨부파일은 받지 않는다(CNT-18). */
            body: string;
        };
        CreatedSupportInquiryResponseDto: {
            inquiryId: number;
        };
        SupportInquiryListItemDto: {
            status: components["schemas"]["InquiryStatus"];
            inquiryId: number;
            title: string;
            /** @description 문의 유형(공통코드 `INQUIRY_CATEGORY` 값) */
            inquiryCategoryCode: string;
            /**
             * Format: date-time
             * @description 등록 일시
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 처음 답변한 시각. 답변이 없으면 null.
             */
            repliedAt: string | null;
        };
        SupportInquiryListResponseDto: {
            items: components["schemas"]["SupportInquiryListItemDto"][];
            total: number;
        };
        SupportInquiryReplyDto: {
            /** @description 지금 답변(마지막 답변 행) */
            body: string;
            /**
             * Format: date-time
             * @description 처음 답변한 시각
             */
            repliedAt: string;
            /**
             * Format: date-time
             * @description 고친 적이 있으면 마지막으로 고친 시각(「수정됨」), 없으면 null
             */
            editedAt: string | null;
        };
        SupportInquiryResponseDto: {
            status: components["schemas"]["InquiryStatus"];
            inquiryId: number;
            title: string;
            /** @description 문의 유형(공통코드 `INQUIRY_CATEGORY` 값) */
            inquiryCategoryCode: string;
            /**
             * Format: date-time
             * @description 등록 일시
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 처음 답변한 시각. 답변이 없으면 null.
             */
            repliedAt: string | null;
            body: string;
            /**
             * Format: date-time
             * @description 처리중으로 바뀐 시각 — 진행 이력의 「처리 중」 줄. 처리중을 거치지 않았으면 null.
             */
            processingStartedAt: string | null;
            /** @description 답변. 아직 없으면 null. */
            reply: components["schemas"]["SupportInquiryReplyDto"] | null;
            /** @description 첨부파일. 순서대로. 내려받기는 `GET /support-inquiries/:inquiryId/attachments/:inquiryAttachmentId/download-url`. */
            attachments: components["schemas"]["InquiryAttachmentDto"][];
        };
        /** @enum {string} */
        TodoAssigneeType: "INDIVIDUAL" | "ALL";
        /** @enum {string} */
        TodoExecutionMode: "EACH" | "ANY_ONE";
        TodoStaffDto: {
            staffMemberId: number | null;
            staffMemberName: string | null;
            isMasked: boolean;
        };
        TodoListItemDto: {
            assigneeType: components["schemas"]["TodoAssigneeType"];
            executionMode: components["schemas"]["TodoExecutionMode"];
            /**
             * @description YYYY-MM-DD
             * @example 2026-10-20
             */
            dueDate: string;
            /**
             * @description HH:mm. 날짜만이면 null
             * @example 18:00
             */
            dueTime: string | null;
            /** @description 이 줄의 상태 — 그룹이면 모두 완료 = 완료, 모두 대기 = 대기, 그 밖은 진행 중 */
            status: components["schemas"]["TodoStatus"];
            /** @description 한 명 수행을 먼저 완료한 직원 */
            performer: components["schemas"]["TodoStaffDto"] | null;
            /** @description 그 줄에 남은 행(필터에 맞고 지우지 않은 행) 가운데 첫 행. 상세를 열 때 쓴다 */
            todoId: number;
            /** @description 그룹이 아니면 null */
            assignmentGroupId: number | null;
            storeId: number;
            /** @description 점포가 지워졌어도 이름은 보인다 */
            storeName: string | null;
            title: string;
            isUrgent: boolean;
            /** @description 이 줄에 묶인 행 수 */
            todoCount: number;
            /** @description 그 가운데 완료한 행 수 */
            doneCount: number;
            /** @description 배정된 직원. 한 명 수행은 대상 전원 */
            assignees: components["schemas"]["TodoStaffDto"][];
            /** Format: date-time */
            createdAt: string;
        };
        TodoListResponseDto: {
            items: components["schemas"]["TodoListItemDto"][];
            /** @description 거른 결과의 줄 수(그룹은 한 줄) */
            total: number;
        };
        AssignableStaffItemDto: {
            staffMemberId: number;
            name: string;
            /** @description 휴대전화번호 끝 4자리 — 이름이 같은 직원을 가른다 */
            phoneLast4: string;
            /** @description 직무(예: 바리스타) */
            jobTitle: string;
        };
        AssignableStaffResponseDto: {
            items: components["schemas"]["AssignableStaffItemDto"][];
        };
        TodoAssigneeDto: {
            staffMemberId: number | null;
            staffMemberName: string | null;
            /** Format: date-time */
            completedAt: string | null;
            isCompleted: boolean;
            isMasked: boolean;
        };
        TodoGroupRowDto: {
            /** @description 퇴직으로 배정이 풀린 행 · 가린 직원은 null */
            staffMemberId: number | null;
            staffMemberName: string | null;
            status: components["schemas"]["TodoStatus"];
            /** Format: date-time */
            completedAt: string | null;
            todoId: number;
            /** @description 가린 직원(TodoStaffDto.isMasked 와 같은 뜻) */
            isMasked: boolean;
        };
        TodoStatusHistoryDto: {
            /** @description 등록 때 줄은 null */
            fromStatus: components["schemas"]["TodoStatus"] | null;
            toStatus: components["schemas"]["TodoStatus"];
            changedBy: number | null;
            changedByName: string | null;
            staffMemberId: number | null;
            staffMemberName: string | null;
            /** @description 퇴직으로 배정이 풀린 직원 */
            unassignedStaffMemberId: number | null;
            unassignedStaffMemberName: string | null;
            /** @description 긴급 표시를 바꾼 줄 */
            isUrgentChanged: boolean;
            /** @description 바꾼 직원을 가렸으면 true — staffMemberId · staffMemberName 이 null */
            isStaffMemberMasked: boolean;
            /** @description 배정이 풀린 직원을 가렸으면 true */
            isUnassignedStaffMemberMasked: boolean;
            /** Format: date-time */
            changedAt: string;
        };
        TodoDetailDto: {
            assignmentGroupId: number | null;
            storeName: string | null;
            body: string | null;
            assigneeType: components["schemas"]["TodoAssigneeType"];
            executionMode: components["schemas"]["TodoExecutionMode"];
            /** @example 2026-10-20 */
            dueDate: string;
            /** @example 18:00 */
            dueTime: string | null;
            status: components["schemas"]["TodoStatus"];
            /** Format: date-time */
            completedAt: string | null;
            performer: components["schemas"]["TodoStaffDto"] | null;
            createdByName: string | null;
            todoId: number;
            storeId: number;
            title: string;
            isUrgent: boolean;
            createdBy: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** @description 이 행의 배정 대상 */
            assignees: components["schemas"]["TodoAssigneeDto"][];
            /** @description 그룹의 행들(이 행 포함). 그룹이 아니면 빈 배열 */
            groupTodos: components["schemas"]["TodoGroupRowDto"][];
            /** @description 이 행의 상태 이력, 최신순 */
            histories: components["schemas"]["TodoStatusHistoryDto"][];
        };
        CreateTodoDto: {
            /** @description 배정 대상 — 개인 · 근무지 전체. 등록 뒤 바꾸지 않는다 */
            assigneeType: components["schemas"]["TodoAssigneeType"];
            /** @description 수행 방식 — 각자 수행 · 한 명 수행. 근무지 전체면 필수, 개인이면 각자 수행만(빼면 각자 수행). 등록 뒤 바꾸지 않는다 */
            executionMode?: components["schemas"]["TodoExecutionMode"];
            /** @description 근무지 점포. 업무 범위 밖이면 404 */
            storeId: number;
            /** @description 개인 배정의 직원 레코드. 개인이면 1~200명, 근무지 전체면 넣지 않는다. 그 근무지의 재직 직원이어야 한다 */
            staffMemberIds?: number[];
            /** @description 제목. 100자까지 */
            title: string;
            /** @description 내용. 2,000자까지. 앞뒤 공백을 지우고, 비면(공백만이면) null */
            body?: string | null;
            /** @description 수행 예정 날짜 YYYY-MM-DD. 한국 날짜로 오늘 이후 */
            dueDate: string;
            /** @description 수행 시간 HH:mm(한국 시각). 없으면 날짜만 */
            dueTime?: string | null;
            /** @description 긴급. 기본 false */
            isUrgent?: boolean;
        };
        CreatedTodoResponseDto: {
            /** @description 만든 행. 개인 한 명 · 한 명 수행은 하나 */
            todoIds: number[];
            /** @description 배정 그룹 ID. 행이 하나면 null */
            assignmentGroupId: number | null;
        };
        UpdateTodoDto: {
            /** @description 제목. 100자까지 */
            title?: string;
            /** @description 내용. 2,000자까지. 앞뒤 공백을 지우고, 비면(공백만이면) null */
            body?: string | null;
            /** @description 수행 예정 날짜 YYYY-MM-DD. 한국 날짜로 오늘 이후 */
            dueDate?: string;
            /** @description 수행 시간 HH:mm(한국 시각). 없으면 날짜만 */
            dueTime?: string | null;
            /** @description 긴급. 기본 false */
            isUrgent?: boolean;
        };
        ChangeTodoStatusDto: {
            status: components["schemas"]["TodoStatus"];
        };
        TodoItemDto: {
            storeName: string | null;
            body: string | null;
            assigneeType: components["schemas"]["TodoAssigneeType"];
            executionMode: components["schemas"]["TodoExecutionMode"];
            /** @example 2026-10-20 */
            dueDate: string;
            /** @example 18:00 */
            dueTime: string | null;
            status: components["schemas"]["TodoStatus"];
            /** Format: date-time */
            completedAt: string | null;
            /** @description 한 명 수행을 완료한 직원 — 근무지 동료에게 이름을 보인다(WORK-3) */
            performer: components["schemas"]["TodoStaffDto"] | null;
            todoId: number;
            storeId: number;
            title: string;
            isUrgent: boolean;
        };
        TodoDeleteResponseDto: {
            /** @description 지운 행 수 */
            deleted: number;
            /** @description 그룹에 남은 행 수 — 진행 중 · 완료라 지우지 않은 것 */
            remaining: number;
        };
        TodoItemListResponseDto: {
            items: components["schemas"]["TodoItemDto"][];
            total: number;
        };
        WorkScheduleRosterItemDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            staffMemberId: number | null;
            name: string | null;
            /** @description 휴대전화번호 끝 4자리 */
            phoneLast4: string | null;
            jobTitle: string | null;
            isMasked: boolean;
            /** @description 이 직원이 근무스케줄을 받을 수 있는 근무일(YYYY-MM-DD) — 그날 행을 둘지 이것으로 가른다(STAFF-29) */
            schedulableDates: string[];
        };
        WorkScheduleDto: {
            workScheduleId: number;
            staffMemberId: number;
            storeId: number;
            /** @description 근무일 — 시작 일시의 한국 날짜 */
            workDate: string;
            /** @description 시작 HH:mm(한국 시각) */
            startTime: string;
            /** @description 종료 HH:mm(한국 시각). 시작보다 이르면 다음 날(자정에 끝나면 00:00) */
            endTime: string;
            /** @description 시작 · 종료 순간(ISO) */
            startAt: string;
            endAt: string;
            breakMinutes: number;
        };
        WorkScheduleDayDto: {
            workDate: string;
            /** @description 그날 근무스케줄이 있는 직원 수 */
            headcount: number;
            /** @description 한국 00:00 부터 30분 칸 48개마다 근무 중인 인원. 전날 시작해 자정을 넘어온 근무도 새벽 칸에 센다(막대 · 인원 수는 시작한 날) */
            coverage: number[];
        };
        WorkScheduleListResponseDto: {
            storeId: number;
            from: string;
            to: string;
            staff: components["schemas"]["WorkScheduleRosterItemDto"][];
            items: components["schemas"]["WorkScheduleDto"][];
            days: components["schemas"]["WorkScheduleDayDto"][];
        };
        /** @enum {string} */
        WorkScheduleChangeType: "CREATED" | "UPDATED" | "DELETED";
        WorkScheduleHistoryActorDto: {
            adminAccountId: number;
            /** @description 관리자 이름. 이름 칸이 비었거나 계정을 찾지 못하면 null */
            name: string | null;
        };
        WorkScheduleHistoryValueDto: {
            workDate: string;
            startTime: string;
            endTime: string;
            breakMinutes: number;
        };
        WorkScheduleHistoryItemDto: {
            changeType: components["schemas"]["WorkScheduleChangeType"];
            workScheduleHistoryId: number;
            workScheduleId: number;
            changedAt: string;
            /** @description 변경 주체. 퇴직 처리가 지운 것은 그 퇴직을 처리한 관리자다 */
            changedBy: components["schemas"]["WorkScheduleHistoryActorDto"];
            staffMemberId: number;
            staffName: string;
            /** @description 변경 전 — 등록이면 null */
            before: components["schemas"]["WorkScheduleHistoryValueDto"] | null;
            /** @description 변경 후 — 삭제면 null */
            after: components["schemas"]["WorkScheduleHistoryValueDto"] | null;
        };
        WorkScheduleHistoryListResponseDto: {
            items: components["schemas"]["WorkScheduleHistoryItemDto"][];
            /** @description 필터를 건 건수(페이지 수 계산용). 본사에게 가려진 직원의 이력은 세지 않는다 */
            total: number;
        };
        WorkScheduleStaffItemDto: {
            staffMemberId: number;
            name: string;
            /** @description 휴대전화번호 끝 4자리 — 이름이 같은 직원을 가른다 */
            phoneLast4: string;
            /** @description 직무(예: 바리스타) */
            jobTitle: string;
        };
        WorkScheduleStaffResponseDto: {
            items: components["schemas"]["WorkScheduleStaffItemDto"][];
        };
        WorkScheduleDefaultsDto: {
            startTime: string | null;
            endTime: string | null;
            breakMinutes: number | null;
        };
        CreateWorkScheduleDto: {
            /** @description 직원 레코드. 근무지는 그 레코드의 점포다 */
            staffMemberId: number;
            /** @description 근무일 YYYY-MM-DD. 지난 날짜도 받는다 */
            workDate: string;
            /** @description 시작 HH:mm, 30분 단위 */
            startTime: string;
            /** @description 종료 HH:mm, 30분 단위(24:00 까지). 시작보다 이르면 다음 날이다(자정 넘김) */
            endTime: string;
            /** @description 휴게(분). 0 이상, 근무 길이보다 짧게 */
            breakMinutes: number;
        };
        BulkWorkScheduleRowDto: {
            staffMemberId: number;
            startTime: string;
            endTime: string;
            breakMinutes: number;
        };
        BulkCreateWorkSchedulesDto: {
            /** @description 근무일 YYYY-MM-DD */
            workDate: string;
            /** @description 직원별 줄. 1~100줄. 같은 직원이 여러 줄이면 쪼갠 근무다 */
            rows: components["schemas"]["BulkWorkScheduleRowDto"][];
        };
        BulkWorkScheduleFailureDto: {
            /** @description 요청 rows 의 순번(0부터) */
            index: number;
            staffMemberId: number;
            /** @description 한 건 등록이면 받았을 HTTP 상태 — 400 · 404 · 409, 예상 못 한 저장 오류는 500(code WORK_SCHEDULE_SAVE_FAILED) */
            statusCode: number;
            /** @description WORK_SCHEDULE_NO_CONTRACT · WORK_SCHEDULE_NOT_JOINED · WORK_SCHEDULE_AFTER_RETIREMENT · WORK_SCHEDULE_OVERLAP 등. 없으면 null */
            code: string | null;
            message: string;
        };
        BulkCreateWorkSchedulesResponseDto: {
            /** @description 저장한 근무스케줄(요청 순서) */
            created: components["schemas"]["WorkScheduleDto"][];
            failed: components["schemas"]["BulkWorkScheduleFailureDto"][];
        };
        WorkScheduleTotalsDto: {
            days: number;
            minutes: number;
        };
        CopyExclusionDto: {
            /** @description 넣을 주의 근무일 YYYY-MM-DD */
            workDate: string;
            /** @description WORK_SCHEDULE_NO_CONTRACT · WORK_SCHEDULE_AFTER_RETIREMENT · WORK_SCHEDULE_NOT_JOINED · WORK_SCHEDULE_OVERLAP 등 */
            code: string | null;
        };
        CopyLastWeekStaffDto: {
            staffMemberId: number;
            name: string;
            /** @description 퇴직일(정해졌으면) — 「제외 · 08-20 퇴직」 표시용 */
            retiredDate: string | null;
            /** @description 지난 주 */
            source: components["schemas"]["WorkScheduleTotalsDto"];
            /** @description 이번 주에 복사하는(한) 것 */
            copied: components["schemas"]["WorkScheduleTotalsDto"];
            excluded: components["schemas"]["CopyExclusionDto"][];
        };
        CopyLastWeekNewcomerDto: {
            staffMemberId: number;
            name: string;
        };
        CopyLastWeekResponseDto: {
            storeId: number;
            /** @description 원본 주의 월요일 */
            sourceWeekStart: string;
            weekStart: string;
            staff: components["schemas"]["CopyLastWeekStaffDto"][];
            newcomers: components["schemas"]["CopyLastWeekNewcomerDto"][];
        };
        CopyLastWeekDto: {
            /** @description 근무지 점포. 업무 범위 밖이면 404 */
            storeId: number;
            /** @description 복사해 넣을 주의 월요일 YYYY-MM-DD. 원본은 그 직전 주(월~일)다 */
            weekStart: string;
        };
        UpdateWorkScheduleDto: {
            /** @description 근무일 YYYY-MM-DD. 지난 날짜도 받는다 */
            workDate: string;
            /** @description 시작 HH:mm, 30분 단위 */
            startTime: string;
            /** @description 종료 HH:mm, 30분 단위(24:00 까지). 시작보다 이르면 다음 날이다(자정 넘김) */
            endTime: string;
            /** @description 휴게(분). 0 이상, 근무 길이보다 짧게 */
            breakMinutes: number;
        };
        WorkScheduleDeleteResponseDto: {
            workScheduleId: number;
        };
        MyWorkScheduleListResponseDto: {
            /** @description 시작 일시순 */
            items: components["schemas"]["WorkScheduleDto"][];
        };
        AttendanceStoreDto: {
            storeId: number;
            name: string;
            /** @description 기본주소와 상세주소 */
            address: string | null;
            /** @description 위도. 점포에 좌표가 없으면 null — 앱은 위치로 판정할 수 없다 */
            latitude: number | null;
            longitude: number | null;
            /** @description 근무지 반경(미터). 1차는 모든 점포 100 */
            radiusMeters: number;
            /** @description 위치 적용 여부 — false 면 위치를 보지 않고(동의 · 사유도 없음) 등록한다 */
            isLocationApplied: boolean;
        };
        /** @enum {string} */
        LocationConsentState: "NOT_AGREED" | "AGREED" | "PAUSED" | "WITHDRAWN";
        AttendanceConsentDto: {
            state: components["schemas"]["LocationConsentState"];
            /** @description 동의한 약관 버전이 지금 시행 중인 것과 달라 다시 받아야 한다(ATT-23) */
            needsReconsent: boolean;
            /** @description 지금 시행 중인 위치정보 약관 버전 — 동의 시트의 「v1.2」. 없으면 null */
            termsVersion: string | null;
        };
        CheckInBlockDto: {
            /** @enum {string} */
            reason: "CONTRACT_PENDING_SIGNATURE" | "NO_CONTRACT";
            /** @description 서명 대기 계약 — 「계약서 보기」로 연다. NO_CONTRACT 면 null */
            contractId: number | null;
        };
        OpenCheckInDto: {
            attendanceRecordId: number;
            staffMemberId: number;
            storeId: number;
            storeName: string;
            /** Format: date-time */
            recordedAt: string;
            /** @description 퇴근 등록 기한(출근한 다음 날, 한국)이 지났다 — 직원은 퇴근할 수 없고 관리자 보정으로 닫는다(퇴근 409 `CHECK_OUT_EXPIRED`) */
            isCheckOutExpired: boolean;
        };
        TodayScheduleDto: {
            /** Format: date-time */
            startAt: string;
            /** Format: date-time */
            endAt: string;
            /** @description 시작 HH:mm(한국 시각) */
            startTime: string;
            /** @description 끝 HH:mm(한국 시각) */
            endTime: string;
            breakMinutes: number;
        };
        MyAttendanceResponseDto: {
            staffMemberId: number;
            store: components["schemas"]["AttendanceStoreDto"];
            locationConsent: components["schemas"]["AttendanceConsentDto"];
            /** @description 출근을 막는 까닭. 출근할 수 있으면 null */
            checkInBlock: components["schemas"]["CheckInBlockDto"] | null;
            openCheckIn: components["schemas"]["OpenCheckInDto"] | null;
            todaySchedules: components["schemas"]["TodayScheduleDto"][];
        };
        LocationReadDto: {
            /** @description 앱 전역에서 고른 소속 — 이 근무지로 출근 · 퇴근하려고 위치를 읽었다 */
            staffMemberId: number;
        };
        LocationReadResultDto: {
            /** @description 이 읽음의 확인자료(수집) id — 이어서 보내는 출근 · 퇴근에 넣는다 */
            locationReadId: number;
        };
        CheckInDto: {
            /**
             * @description 확인 필요 사유 — 고른 근무지 반경 밖이면 `OUT_OF_RADIUS_CHECKIN`(ATT-11). 좌표 · 거리는 받지 않는다(ATT-05)
             * @enum {string}
             */
            reviewReason?: "OUT_OF_RADIUS_CHECKIN";
            /** @description 앱 전역에서 고른 소속(직원 레코드) — 이 근무지로 출근한다(ATT-07) */
            staffMemberId: number;
            /**
             * @description 출근 버튼을 누를 때 남긴 위치 읽음(`POST /me/attendance/location-reads` 의 locationReadId). 위치를 보는 근무지면 꼭 있어야 하고,
             *     그 확인자료(수집 · 이용)를 이 기록에 잇는다(ATT-22). 위치를 보지 않는 근무지는 보내지 않는다
             */
            locationReadId?: number;
        };
        AttendanceRecordResultDto: {
            /** @enum {string} */
            kind: "CHECK_IN" | "CHECK_OUT";
            /** @enum {string|null} */
            reviewReason: "OUT_OF_RADIUS_CHECKIN" | "OUT_OF_RADIUS_CHECKOUT" | "MOCK_LOCATION" | null;
            attendanceRecordId: number;
            /**
             * Format: date-time
             * @description 기록 시각 — 서버가 요청을 받은 시각
             */
            recordedAt: string;
            storeId: number;
            storeName: string;
            /**
             * Format: date-time
             * @description 퇴근일 때 짝 출근 시각. 출근이면 null
             */
            checkInRecordedAt: string | null;
        };
        CheckOutDto: {
            /**
             * @description 확인 필요 사유 — 반경 밖 `OUT_OF_RADIUS_CHECKOUT`, 위치 조작 감지 `MOCK_LOCATION`(ATT-11 · ATT-21). 좌표는 받지 않는다
             * @enum {string}
             */
            reviewReason?: "OUT_OF_RADIUS_CHECKOUT" | "MOCK_LOCATION";
            /** @description 앱 전역에서 고른 소속 — 열린 출근 기록이 이 소속의 것이어야 한다 */
            staffMemberId: number;
            /**
             * @description 퇴근 버튼을 누를 때 남긴 위치 읽음(`POST /me/attendance/location-reads` 의 locationReadId). 위치를 보는 근무지면 꼭 있어야 하고,
             *     그 확인자료(수집 · 이용)를 이 기록에 잇는다(ATT-22). 위치를 보지 않는 근무지는 보내지 않는다
             */
            locationReadId?: number;
        };
        /**
         * @description 그날 상태. 근무스케줄 시작 전이면 null(예정)
         * @enum {string}
         */
        AttendanceDayStatus: "NORMAL" | "LATE" | "ABSENT" | "MISSING_CHECK_IN" | "MISSING_CHECK_OUT" | "OFF";
        AttendanceHistoryEntryDto: {
            /** @enum {string} */
            kind: "CORRECTION" | "PROXY";
            /**
             * Format: date-time
             * @description 처리 일시
             */
            at: string;
            /** @description 처리한 관리자 — 이름(없으면 아이디) */
            by: string;
            /** @description 처리한 관리자의 권한 그룹 이름(데모 「정하윤 (BP 마스터)」). 계정을 찾지 못하면 null */
            byRole: string | null;
            /** @description 보정이면 변경 전 「출근 09:02 · 퇴근 없음」, 대신 등록이면 null */
            before: string | null;
            /** @description 보정이면 변경 후, 대신 등록이면 등록한 값 */
            after: string;
            reason: string;
        };
        AttendanceScheduleDto: {
            /** @description HH:mm(한국) */
            startTime: string;
            /** @description HH:mm(한국). 자정을 넘으면 다음 날 시각 */
            endTime: string;
            breakMinutes: number;
        };
        /**
         * @description 확인 필요 사유 — 검토를 마치면 null
         * @enum {string}
         */
        AttendanceReviewReason: "ACCURACY_EXCEEDED" | "OUT_OF_RADIUS_CHECKIN" | "OUT_OF_RADIUS_CHECKOUT" | "MOCK_LOCATION" | "LONG_SHIFT";
        /** @enum {string} */
        AttendanceEntryMethod: "SELF" | "PROXY";
        AttendancePunchDto: {
            /** @description 확인 필요 사유 — 검토를 마치면 null */
            reviewReason: components["schemas"]["AttendanceReviewReason"] | null;
            entryMethod: components["schemas"]["AttendanceEntryMethod"];
            attendanceRecordId: number;
            /**
             * Format: date-time
             * @description 기록 시각(ISO)
             */
            recordedAt: string;
            /** @description 기록 시각 HH:mm(한국) */
            time: string;
            /** @description 관리자가 보정한 적이 있는가(보정 이력이 있다) — 필터 「기록 구분 · 보정됨」 */
            isCorrected: boolean;
        };
        AttendancePairDto: {
            checkIn: components["schemas"]["AttendancePunchDto"] | null;
            checkOut: components["schemas"]["AttendancePunchDto"] | null;
        };
        MyAttendanceDayDto: {
            employmentType: components["schemas"]["EmploymentType"];
            employmentStatus: components["schemas"]["EmploymentStatus"];
            /** @description 그날 상태. 근무스케줄 시작 전이면 null(예정) */
            status: components["schemas"]["AttendanceDayStatus"] | null;
            /** @description 보정 · 대신 등록 이력, 새것부터. 손대지 않은 날 · 「이상 없음」만 받은 날은 빈 배열(ATT-19) */
            edits: components["schemas"]["AttendanceHistoryEntryDto"][];
            /** @description 날 YYYY-MM-DD(한국) */
            date: string;
            staffMemberId: number;
            name: string;
            /** @description 휴대전화번호 — 필터 「직원(이름 또는 번호)」 */
            phone: string;
            storeId: number;
            storeName: string;
            schedules: components["schemas"]["AttendanceScheduleDto"][];
            /** @description 출근순 */
            pairs: components["schemas"]["AttendancePairDto"][];
            /** @description 그날이 확정 · 발송된 급여명세서 기간 안이다 — 보정하면 급여에 영향이 갈 수 있다(WHALEERP-218 · 220) */
            isPayslipConfirmed: boolean;
        };
        MyAttendanceStatsDto: {
            workedMinutes: number;
            overtimeMinutes: number;
        };
        MyAttendanceWeekDto: {
            workedMinutes: number;
            overtimeMinutes: number;
            /** @description 그 주 월요일(YYYY-MM-DD) */
            monday: string;
        };
        MyAttendanceRecordsResponseDto: {
            from: string;
            to: string;
            storeName: string;
            /** @description 근무스케줄이나 기록이 있는 날만, 날짜순 */
            items: components["schemas"]["MyAttendanceDayDto"][];
            /** @description 기간 합 */
            totals: components["schemas"]["MyAttendanceStatsDto"];
            /** @description 기간에 걸친 주마다, 월요일순 */
            weeks: components["schemas"]["MyAttendanceWeekDto"][];
        };
        AttendanceDayItemDto: {
            employmentType: components["schemas"]["EmploymentType"];
            employmentStatus: components["schemas"]["EmploymentStatus"];
            /** @description 그날 상태. 근무스케줄 시작 전이면 null(예정) */
            status: components["schemas"]["AttendanceDayStatus"] | null;
            /** @description 날 YYYY-MM-DD(한국) */
            date: string;
            staffMemberId: number;
            name: string;
            /** @description 휴대전화번호 — 필터 「직원(이름 또는 번호)」 */
            phone: string;
            storeId: number;
            storeName: string;
            schedules: components["schemas"]["AttendanceScheduleDto"][];
            /** @description 출근순 */
            pairs: components["schemas"]["AttendancePairDto"][];
            /** @description 그날이 확정 · 발송된 급여명세서 기간 안이다 — 보정하면 급여에 영향이 갈 수 있다(WHALEERP-218 · 220) */
            isPayslipConfirmed: boolean;
        };
        DailyAttendanceResponseDto: {
            date: string;
            /** @description 점포 · 이름순 */
            items: components["schemas"]["AttendanceDayItemDto"][];
            /** @description 상태별 인원 — 본사에게 가려지는 직원은 세지 않는다(ATT-30, 운영 정책 v218 2026-10-27 — 로그인 후 홈 · 근태 요약과 같은 기준) */
            counts: {
                [key: string]: number;
            };
        };
        AttendancePeriodItemDto: {
            employmentType: components["schemas"]["EmploymentType"];
            employmentStatus: components["schemas"]["EmploymentStatus"];
            /** @description 그날 상태. 근무스케줄 시작 전이면 null(예정) */
            status: components["schemas"]["AttendanceDayStatus"] | null;
            /** @description 날 YYYY-MM-DD(한국) */
            date: string;
            staffMemberId: number;
            name: string;
            /** @description 휴대전화번호 — 필터 「직원(이름 또는 번호)」 */
            phone: string;
            storeId: number;
            storeName: string;
            schedules: components["schemas"]["AttendanceScheduleDto"][];
            /** @description 출근순 */
            pairs: components["schemas"]["AttendancePairDto"][];
            /** @description 그날이 확정 · 발송된 급여명세서 기간 안이다 — 보정하면 급여에 영향이 갈 수 있다(WHALEERP-218 · 220) */
            isPayslipConfirmed: boolean;
            /** @description 보정 · 대신 등록 이력, 새것부터. 손대지 않은 날 · 「이상 없음」만 받은 날은 빈 배열(ATT-19) */
            edits: components["schemas"]["AttendanceHistoryEntryDto"][];
        };
        AttendanceWeekStaffDto: {
            staffMemberId: number;
            /** @description 근무 분 — 출근 ~ 짝 퇴근의 합에서 그날 근무스케줄 휴게(없으면 계약 휴게)를 뺀 것 */
            workedMinutes: number;
            /** @description 연장 분 — 정직원은 하루 8시간 · 주 40시간 초과, 파트타이머는 그 요일 계약 시간 초과(계약 안 한 요일은 전부)(PAY-04 우리 판단) */
            overtimeMinutes: number;
            /** @description 주휴 대상 — 1주 소정근로시간 15시간 이상이고 그 주 계약 요일을 모두 출근(PAY-02) */
            isWeeklyHolidayEligible: boolean;
        };
        PeriodAttendanceResponseDto: {
            from: string;
            to: string;
            /** @description 근무스케줄이나 기록이 있는 직원 · 날만(휴무는 없음). 날짜 내림차순, 같은 날은 점포 · 이름순 */
            items: components["schemas"]["AttendancePeriodItemDto"][];
            /** @description 직원 · 날 상태별 건수 — 본사에게 가려지는 직원은 세지 않는다(ATT-30, 운영 정책 v218 2026-10-27 — 로그인 후 홈 · 근태 요약과 같은 기준) */
            counts: {
                [key: string]: number;
            };
            /**
             * @description 근태 요약의 직원별 한 주 값 — 기간이 월요일 ~ 일요일 한 주일 때만(아니면 없음). 급여 계산(WHALEERP-227)과 같은 규칙이다.
             *     줄에 나온 직원만(가려진 직원 없음)
             */
            weekStaff?: components["schemas"]["AttendanceWeekStaffDto"][];
        };
        ProxyStaffItemDto: {
            staffMemberId: number;
            name: string;
            storeId: number;
            storeName: string;
            /** @description 대신 등록(위치정보 동의 없음 · 일시 중지). false 면 위치정보에 동의한 직원 — 기록 없는 날만 출근 · 퇴근을 함께 넣어 보정한다 */
            isProxy: boolean;
            /** @description 그 날짜가 확정 · 발송된 급여명세서 기간 안이다 — 등록하기 전에 경고한다(218) */
            isPayslipConfirmed: boolean;
        };
        ProxyStaffResponseDto: {
            items: components["schemas"]["ProxyStaffItemDto"][];
        };
        ProxyAttendanceDto: {
            staffMemberId: number;
            /** @description 날 YYYY-MM-DD(한국). 최근 3개월 안 · 오늘까지 */
            date: string;
            /** @description 출근 HH:mm — 필수 */
            checkInTime: string;
            /** @description 퇴근 HH:mm. 없으면 출근만(열린 출근 — 대신 등록만, 보정으로 채우면 필수). 출근보다 이르거나 같으면 다음 날 */
            checkOutTime?: string;
            /** @description 사유 — 필수, 500자까지 */
            reason: string;
        };
        AttendanceEditResultDto: {
            /** @description 그 날짜가 확정 · 발송된 급여명세서 기간 안이다 — 급여에 영향이 갈 수 있다(218) */
            isPayslipConfirmed: boolean;
        };
        CorrectAttendanceDto: {
            /** @description 출근 HH:mm. 출근이 있으면 필수 — 지우지는 않는다 */
            checkInTime?: string;
            /** @description 퇴근 HH:mm. 퇴근이 있으면 필수 */
            checkOutTime?: string;
            /**
             * @description 퇴근이 출근한 다음 날인가(출근이 있는 짝 — 출근 없는 퇴근을 채울 때 · 퇴근 시각이 없을 때는 무시). 주면 그대로 따른다 — false 인데 퇴근이 출근보다 이르거나 같으면 400. 퇴근은 출근한 다음
             *     날까지 받아 24시간 넘는 짝(09:00 → 다음 날 10:00)이 있어, 시각만으로는 날을 알 수 없다(PR #159 리뷰). 생략하면 예전처럼 짐작한다 —
             *     퇴근이 출근보다 이르거나 같으면 다음 날, 24시간 넘는 짝은 퇴근 시각을 그대로 두면 원래 퇴근 순간
             */
            checkOutNextDay?: boolean;
            /** @description 수정 사유 — 필수, 500자까지 */
            reason: string;
            /** @description 화면이 본 출근 기록 시각(ISO) — 그사이 다른 관리자가 고쳤으면 409 ATTENDANCE_CHANGED. 출근이 없던 짝이면 생략 */
            expectedCheckInAt?: string;
            /** @description 화면이 본 퇴근 기록 시각(ISO). 퇴근이 없던 짝이면 생략 — 그사이 퇴근이 생겼어도 409 */
            expectedCheckOutAt?: string;
        };
        AttendanceHistoryResponseDto: {
            items: components["schemas"]["AttendanceHistoryEntryDto"][];
        };
        MyHqSharingConsentDto: {
            isConsented: boolean;
            /** @description 동의한 문구의 버전 */
            consentVersion: string | null;
            /** Format: date-time */
            agreedAt: string | null;
            /**
             * Format: date-time
             * @description 철회 일시. 철회하지 않았으면 null
             */
            withdrawnAt: string | null;
            /**
             * @description 동의한 문구 버전을 더는 받아 주지 않아(항목 · 목적이 넓어짐) 다시 동의해야 하는지(ATT-30). 동의일 때만 true 일 수 있고,
             *     그동안 본사에는 미동의로 보여 가려진다 — 앱은 들어올 때 동의 시트를 다시 띄우고 `POST /me/hq-sharing-consent` 로 새
             *     버전에 동의한다.
             */
            needsReconsent: boolean;
        };
        MyLocationConsentDto: {
            state: components["schemas"]["LocationConsentState"];
            /** @description 동의한 약관 버전. 미동의면 null */
            consentVersion: string | null;
            /** Format: date-time */
            agreedAt: string | null;
            /**
             * Format: date-time
             * @description 일시 중지 시각. 일시 중지가 아니면 null
             */
            pausedAt: string | null;
            /** Format: date-time */
            withdrawnAt: string | null;
            /**
             * @description 동의한 약관 버전이 지금 시행 중인 것과 달라 다시 동의해야 하는지(ATT-23). 동의 · 일시 중지일 때만 true 일 수 있다 —
             *     앱은 다음 출퇴근 등록 전에 동의 시트를 다시 띄우고 `POST /me/location-consent` 로 새 버전에 동의한다.
             */
            needsReconsent: boolean;
        };
        MyProfileResponseDto: {
            status: components["schemas"]["AccountStatus"];
            accountId: number;
            email: string;
            /** @description 이름 — 고칠 수 없다 */
            realName: string;
            /** @description 생년월일(YYYY-MM-DD) — 직원 앱에서는 고칠 수 없다(생년월일은 관리자 정정만, WHALEERP-602) */
            birthDate: string;
            /** @description 휴대전화번호 — 1차는 읽기 전용 */
            phone: string;
            zipCode: string | null;
            address: string | null;
            addressDetail: string | null;
            hqSharingConsent: components["schemas"]["MyHqSharingConsentDto"];
            locationConsent: components["schemas"]["MyLocationConsentDto"];
            /**
             * Format: date-time
             * @description 비밀번호를 마지막으로 정한 시각 — 바꾼 적이 없으면 가입 시각. 오래되면 화면이 변경을 권한다(WHALEERP-194). 몇 달을
             *     「오래」로 볼지는 화면이 정한다
             */
            passwordChangedAt: string;
        };
        UpdateMyAddressDto: {
            /** @description 우편번호 — 도로명 주소 체계의 5자리 */
            zipCode: string;
            /** @description 도로명 주소 — 주소 검색에서 고른 값 */
            address: string;
            /** @description 상세 주소. 비우거나 빼면 null 로 저장한다 — 주소 세 칸을 통째로 바꾼다 */
            addressDetail?: string | null;
        };
        ChangeMyPasswordDto: {
            /** @description 지금 비밀번호 */
            currentPassword: string;
            /**
             * @description 새 비밀번호. 규칙상 20자까지이고, 문자 종류 · 길이 · 이메일 규칙은 서버가 보고 어긋나면 사유를 준다. 여기 128 은 규칙이
             *     아니라 터무니없이 긴 입력(scrypt 에 큰 값을 먹이는 일)을 막는 상한이다 — 20 으로 내리면 사유 대신 검증 문구가 나간다.
             */
            newPassword: string;
        };
        RequestEmailChangePinDto: {
            /**
             * Format: email
             * @description 바꿀 새 이메일. 대소문자는 가리지 않고 소문자로 저장한다
             */
            newEmail: string;
            /**
             * @description 지금 비밀번호. 맞아야 새 이메일로 핀을 보낸다 — 토큰만 손에 넣은 사람(오염된 바깥 스크립트 등)이 자기 메일로 핀을
             *     받아 아이디를 바꾸지 못하게(WHALEERP-607, ACC-13). 상한은 비밀번호 변경과 같다
             */
            currentPassword: string;
        };
        ChangeMyEmailDto: {
            /** @description 새 이메일로 받은 6자리 핀. 대소문자 · 앞뒤 공백은 가리지 않는다 */
            pin: string;
        };
        MyStoreDto: {
            storeId: number;
            storeName: string;
            /** @description 점포 유형 — 공통코드 `STORE_TYPE`(DIRECT 직영 · FRANCHISE 가맹) */
            storeTypeCode: string;
        };
        MyMembershipDto: {
            employmentType: components["schemas"]["EmploymentType"];
            staffMemberId: number;
            store: components["schemas"]["MyStoreDto"];
            jobTitle: string;
            /** @description 입사일(YYYY-MM-DD) */
            hiredDate: string | null;
            /**
             * @description 퇴직일(YYYY-MM-DD) — 이날까지 일한다. 오늘(한국 시각) · 뒤면 퇴직 예정, 앞이면 퇴직(`includeRetired=true` 로 받은
             *     퇴직한 소속)이다. 없으면 null. 목록의 묶음(지금 소속 · 퇴직)은 재직 상태로 가르므로, 퇴직 배치가 늦은 날에는 퇴직일이 지난
             *     레코드가 지금 소속 쪽에 섞일 수 있다
             */
            retiredDate: string | null;
        };
        MyMembershipListResponseDto: {
            /**
             * @description 체결 완료 근로계약이 있고 가입 완료 · 퇴직 전인 직원 레코드. 입사일(없으면 뒤) · id 순. `includeRetired=true` 면 그 뒤에
             *     퇴직한 레코드가 퇴직일 최근 순으로 붙는다
             */
            items: components["schemas"]["MyMembershipDto"][];
            total: number;
        };
        MyTaxProfileDto: {
            /** @description 가린 주민등록번호 — `980304-1******` */
            rrnMasked: string;
            /** @description 은행 코드 */
            bankCode: string;
            /** @description 가린 급여 계좌 — 끝 4자리만, `********6789` */
            payrollAccountNumberMasked: string;
            /** @description 수집 목적 */
            purpose: string;
            /**
             * Format: date-time
             * @description 수집 일시
             */
            collectedAt: string;
        };
        MyTaxProfileResponseDto: {
            staffMemberId: number;
            /** @description 이 소속에 낸 신고 정보. 아직 내지 않았으면 null */
            taxProfile: components["schemas"]["MyTaxProfileDto"] | null;
        };
        SaveMyTaxProfileDto: {
            /** @description 주민등록번호 13자리(외국인등록번호 포함). 앞 7자리가 가입한 생년월일과 맞아야 한다 */
            rrn?: string;
            /** @description 은행 — 공통코드 BANK 의 코드 */
            bankCode?: string;
            /** @description 급여 계좌번호 — 숫자 10~16자리(하이픈은 지운다). 예금주는 본인이어야 한다 */
            payrollAccountNumber?: string;
            /**
             * @description 지금 비밀번호 — 이미 낸 신고 정보를 고칠 때 필수다. 없거나 틀리면 400 `CURRENT_PASSWORD_MISMATCH`(토큰만 손에 넣은
             *     사람이 급여 계좌를 바꾸지 못하게, WHALEERP-333 · 334 후속 2026-10-23). 처음 작성할 때는 보내지 않는다 — 보내도 서버가 비교하지
             *     않지만 형식은 본다(빈 문자열 · 128자 초과는 처음 작성에도 400). 형식 · 상한은 이메일 변경 핀 요청(WHALEERP-607)과 같다
             */
            currentPassword?: string;
        };
        AgreeLocationConsentDto: {
            /** @description 동의 시트에 보여 준 위치정보 약관 버전 — 예: v1.1. 시트를 그릴 때 시행 중인 약관이 없었으면 null */
            termsVersion: string | null;
        };
        AgreeHqSharingConsentDto: {
            /** @description 화면이 보여 준 본사 제공 동의 문구 버전 — 예: v1.0 */
            consentVersion: string;
        };
        InvitationLookupDto: {
            /** @description 초대 링크의 토큰(base64url 43자) */
            token?: string;
            /** @description 초대를 받은 휴대전화번호 — 숫자 10~11자리(하이픈은 지운다) */
            phone?: string;
            /** @description 초대 코드 — 대문자 · 숫자 8자리, 0 · O · 1 · I 는 없다. 소문자로 넣어도 대문자로 맞춰 본다 */
            code?: string;
        };
        InvitationCheckResponseDto: {
            /**
             * @description 고용 형태 — 정직원 · 파트타이머. 함께 온 진행 중 계약의 값(없으면 직원 레코드) — 재계약 초대면 레코드는 옛 조건이다
             * @enum {string}
             */
            employmentType: "FULL_TIME" | "PART_TIME";
            /** @description 초대한 근무지(점포) 이름 */
            storeName: string;
            /**
             * Format: date-time
             * @description 초대가 끝나는 시각(보낸 때부터 30일)
             */
            expiresAt: string;
            /** @description 가입 화면이 채울 휴대전화번호(읽기 전용) — 초대(근로계약서)의 번호 */
            phone: string;
            /** @description 본사 제공 동의를 물을지 — 직영이 아닌 점포이고 아직 동의하지 않았다(운영 정책 ATT-30) */
            asksHqSharingConsent: boolean;
        };
        StaffSignupDto: {
            /**
             * @description 성별 — 남 · 여. 필수다 — 날인 때 근로계약서 값과 본인 대조하므로 빈 계정을 만들지 않는다(가입 화면도 필수,
             *     운영 정책 ACC-23 · JOI-10, 2026-10-21 재영)
             * @enum {string}
             */
            gender: "MALE" | "FEMALE";
            /**
             * @description 본사 제공 동의 문구 버전 — 화면이 보인 문구의 버전(예: v1.0, ATT-30 v252). hqSharingConsented 가 true 일 때
             *     싣는다(실었으면 비지 않은 64자 이하 문자열 — 아니면 400), 아니면 보지 않는다. 빠지거나(null 포함) 지금 버전과 다르면 가입은 그대로
             *     마치고 동의만 남기지 않는다 — 응답의 hqSharingConsentRecorded 가 false 다(예전 앱 · 배포 어긋남에도 막지 않는다, v253)
             */
            hqSharingConsentVersion?: string;
            /**
             * Format: email
             * @description 로그인 아이디. 소문자로 맞춰 저장한다(accounts_email_lower). 핀으로 확인하지 않는다
             */
            email: string;
            /** @description 영문 대문자 · 소문자 · 숫자 · 특수문자 중 3가지 이상이면 8자, 2가지면 10자 이상, 20자까지 */
            password: string;
            name: string;
            /** @description YYYY-MM-DD. 가입하는 날(한국 시간) 만 19세 미만이면 가입하지 않는다(운영 정책 ACC-22). 가입한 뒤 고칠 수 없다 */
            birthDate: string;
            /** @description 외국인 여부 — 체크하지 않으면 내국인(false) */
            isForeigner?: boolean;
            /** @description 우편번호 5자리 — 주소 검색 API 값(ACC-20) */
            zipCode: string;
            /** @description 기본주소(도로명) — 주소 검색 API 값 */
            address: string;
            /** @description 상세주소 — 직접 입력 */
            addressDetail?: string;
            /**
             * @description 본사 제공 동의(운영 정책 ATT-30, 선택). 초대 확인의 asksHqSharingConsent 가 true 일 때만 쓴다 — 직영 점포면 보내도
             *     저장하지 않는다. 동의는 계정에 하나다(api #78). 동의하지 않아도 가입과 근무는 그대로다
             */
            hqSharingConsented?: boolean;
            /** @description 이 기기 — 로그인과 같다. 같은 기기의 앞 접속을 끝낸다 */
            deviceIdentifier?: string;
            /** @description 초대 링크의 토큰(base64url 43자) */
            token?: string;
            /** @description 초대를 받은 휴대전화번호 — 숫자 10~11자리(하이픈은 지운다) */
            phone?: string;
            /** @description 초대 코드 — 대문자 · 숫자 8자리, 0 · O · 1 · I 는 없다. 소문자로 넣어도 대문자로 맞춰 본다 */
            code?: string;
        };
        StaffSignupResponseDto: {
            /**
             * @description 본사 제공 동의를 남겼는지(ATT-30 v253). true 남김 · false 동의했지만 보인 문구 버전이 지금과 다르거나 싣지 않아(예전 앱) 남기지 않음(가입은
             *     마쳤다 — 앱은 내 정보에서 다시 동의하라고 알린다) · null 남길 동의가 없음(직영 점포 · 동의하지 않음)
             */
            hqSharingConsentRecorded: boolean | null;
            /** @description Authorization: Bearer <accessToken> 으로 API 를 호출한다. 15분 뒤 만료된다. */
            accessToken: string;
            /** @description 접속을 이어 갈 때 쓴다. 원문은 이 응답에만 있고 서버에는 해시만 남는다. */
            refreshToken: string;
            /**
             * Format: date-time
             * @description 마지막으로 사용한 때부터 30일(로그인 때 `rememberMe: false` 면 7일)이 되는 시각. 사용할 때마다 같은 길이로 뒤로 밀린다.
             */
            refreshTokenExpiresAt: string;
            account: components["schemas"]["LoginAccountResponseDto"];
        };
        MyInvitationDto: {
            /**
             * @description 고용 형태 — 정직원 · 파트타이머
             * @enum {string}
             */
            employmentType: "FULL_TIME" | "PART_TIME";
            /** @description 직무 — 함께 온 계약의 값(없으면 직원 레코드), 고용 형태와 같은 곳에서 읽는다. 계약에 직무가 없는 옛 행이면 null 일 수 있다 */
            jobTitle: string | null;
            /** @description 초대 — 더하기(`POST /me/invitations/{invitationId}/accept`)의 경로 값 */
            invitationId: number;
            /** @description 초대한 근무지(점포) 이름 */
            storeName: string;
            /**
             * Format: date-time
             * @description 초대를 보낸 시각
             */
            sentAt: string;
            /**
             * Format: date-time
             * @description 초대가 끝나는 시각(보낸 때부터 30일)
             */
            expiresAt: string;
            /** @description 본사 제공 동의를 물을지 — 직영이 아닌 점포이고 계정이 아직 동의하지 않았다(운영 정책 ATT-30) */
            asksHqSharingConsent: boolean;
        };
        MyInvitationListResponseDto: {
            /** @description 보낸 시각 최근 순 */
            items: components["schemas"]["MyInvitationDto"][];
            /** @description items 의 개수 */
            total: number;
        };
        AcceptMyInvitationDto: {
            /**
             * @description 본사 제공 동의 문구 버전 — 화면이 보인 문구의 버전(예: v1.0, ATT-30 v252). hqSharingConsented 가 true 일 때
             *     싣는다(실었으면 비지 않은 64자 이하 문자열 — 아니면 400), 아니면 보지 않는다. 빠지거나(null 포함) 지금 버전과 다르면 근무지 더하기는 그대로
             *     마치고 동의만 남기지 않는다 — 응답의 hqSharingConsentRecorded 가 false 다(예전 앱 · 배포 어긋남에도 막지 않는다, v253)
             */
            hqSharingConsentVersion?: string;
            /**
             * @description 본사 제공 동의(운영 정책 ATT-30, 선택). 목록의 asksHqSharingConsent 가 true 일 때만 쓴다 — 직영 점포이거나 계정이
             *     받아 주는 문구 버전에 이미 동의했으면 보내도 바꾸지 않는다. 더는 받아 주지 않는 버전에 동의했으면 true 로 지금 버전에
             *     다시 동의한다. 동의는 계정에 하나다(api #78)
             */
            hqSharingConsented?: boolean;
        };
        AcceptMyInvitationResponseDto: {
            /**
             * @description 본사 제공 동의를 남겼는지(ATT-30 v253). true 남김 · false 동의했지만 보인 문구 버전이 지금과 다르거나 싣지 않아(예전 앱) 남기지 않음(계정의 동의는
             *     그대로 — 앱은 내 정보에서 다시 동의하라고 알린다) · null 남길 동의가 없음(묻지 않는 초대 · 이미 동의함 · 동의하지 않음)
             */
            hqSharingConsentRecorded: boolean | null;
            /** @description 이 계정에 이어진 직원 레코드 */
            staffMemberId: number;
            /** @description 근무지(점포) — 이은 직원 레코드의 점포. 앱이 `/me/contracts` 항목을 이 storeId 로 걸러 그 근무지 근로계약서만 연다 */
            storeId: number;
            /** @description 근무지(점포) 이름 */
            storeName: string;
        };
        AffiliationRequestDto: {
            /**
             * @description 소속 추가 확인(처음 일하는 점포) · 복귀 확인(그 점포에서 퇴직했던 직원). 화면 용어는 둘 다 「소속 추가 확인 요청」
             * @enum {string}
             */
            invitationType: "AFFILIATION_CONFIRM" | "RETURN_CONFIRM";
            /**
             * @description 고용 형태 — 정직원 · 파트타이머. 함께 온 계약의 값(없으면 직원 레코드)이다 — 레코드는 계약이 시작할 때 바뀌어 복귀 확인이면 옛
             *     조건일 수 있다. 직무와 늘 같은 곳에서 읽는다
             * @enum {string}
             */
            employmentType: "FULL_TIME" | "PART_TIME";
            /** @description 고용 형태 표시 문구(정직원 · 파트타이머) — 팝업 문구에 그대로 쓴다 */
            employmentTypeLabel: string | null;
            /** @description 직무 — 함께 온 계약의 값(없으면 직원 레코드), 고용 형태와 같은 곳에서 읽는다. 계약에 직무가 없는 옛 행이면 null 일 수 있다 */
            jobTitle: string | null;
            /** @description 요청(초대) ID — 수락 · 거절 경로에 쓴다 */
            invitationId: number;
            /** @description 요청한 근무지(점포) 이름 */
            storeName: string;
            /** @description 그 점포의 사업자(BP) 상호 */
            bpName: string;
            /** @description 요청을 보낸 때 */
            sentAt: string;
            /** @description 요청이 끝나는 때(보낸 때부터 30일) — 지나면 목록에서 빠지고 수락 · 거절은 404 AFFILIATION_REQUEST_ENDED */
            expiresAt: string;
            /** @description 본사 제공 동의를 함께 물을지 — 직영이 아닌 점포이고 아직 동의하지 않았다(운영 정책 ATT-30) */
            asksHqSharingConsent: boolean;
        };
        AcceptAffiliationRequestDto: {
            /**
             * @description 본사 제공 동의 문구 버전 — 화면이 보인 문구의 버전(예: v1.0, ATT-30 v252). hqSharingConsented 가 true 일 때
             *     싣는다(실었으면 비지 않은 64자 이하 문자열 — 아니면 400), 아니면 보지 않는다. 빠지거나(null 포함) 지금 버전과 다르면 수락은 그대로
             *     마치고 동의만 남기지 않는다 — 응답의 hqSharingConsentRecorded 가 false 다(예전 앱 · 배포 어긋남에도 막지 않는다, v253)
             */
            hqSharingConsentVersion?: string;
            /**
             * @description 본사 제공 동의(운영 정책 ATT-30, 선택). 목록의 asksHqSharingConsent 가 true 일 때만 쓴다 — 직영 점포이거나 계정이 이미
             *     동의했으면 보내도 바꾸지 않는다(근무지 더하기와 같다)
             */
            hqSharingConsented?: boolean;
        };
        AcceptAffiliationResponseDto: {
            /**
             * @description 본사 제공 동의를 남겼는지(ATT-30 v253). true 남김 · false 동의했지만 보인 문구 버전이 지금과 다르거나 싣지 않아(예전 앱) 남기지 않음(계정의 동의는
             *     그대로 — 앱은 내 정보에서 다시 동의하라고 알린다) · null 남길 동의가 없음(묻지 않는 요청 · 이미 동의함 · 동의하지 않음)
             */
            hqSharingConsentRecorded: boolean | null;
            /** @description 이 계정에 이어진 직원 레코드 */
            staffMemberId: number;
            /** @description 근무지(점포) 이름 */
            storeName: string;
            /** @description 서명 대기로 넘어간 근로계약 — 날인 기한은 수락한 때부터 30일 */
            contractIds: number[];
        };
        BpHolidayTargetResponseDto: {
            isAllStores: boolean;
            /**
             * @description 전체 점포일 때 BP 상호.
             * @example ㈜한강상회
             */
            bpTradeName: string | null;
            /**
             * @description 특정 점포일 때 그날 적용되는 첫 점포(이름순).
             * @example 온기식당 판교점
             */
            firstStoreName: string | null;
            /** @description 특정 점포일 때 첫 점포 말고 그날 적용되는 점포 수. */
            otherStoreCount: number;
            /** @description 전체 점포일 때 그날 예외인 점포 수. */
            excludedStoreCount: number;
        };
        BpHolidayActionsResponseDto: {
            /** @description 휴일명 · 설명(시작 전이면 날짜 · 유형 · 반복 · 적용 범위까지) 수정. */
            canUpdate: boolean;
            /** @description 대상 · 예외 점포 더하기 · 빼기 — 일부 점포 사용자는 맡은 점포만. */
            canUpdateStores: boolean;
            /** @description 강제 종료(어제 날짜로 끝냄) — 시작일이 어제 이전이고 아직 끝나지 않은 휴일. */
            canTerminate: boolean;
            /** @description 삭제 — 시작일이 오늘 이후인 휴일. */
            canDelete: boolean;
            /**
             * @description 막힌 동작의 사유.
             * @example 끝난 휴일은 고칠 수 없습니다
             */
            blockedReason: string | null;
        };
        BpHolidayDateRowResponseDto: {
            /** @example 2026-10-26 */
            date: string;
            bpHolidayId: number;
            /** @example 정기휴무 */
            name: string;
            /**
             * @description DAY · PERIOD · REPEAT.
             * @example REPEAT
             */
            holidayTypeCode: string;
            /**
             * @description 반복일 때 DAILY · WEEKLY · MONTHLY · YEARLY.
             * @example WEEKLY
             */
            holidayRepeatTypeCode: string | null;
            target: components["schemas"]["BpHolidayTargetResponseDto"];
            /** @description 지난 날짜(오늘보다 앞)인가. */
            isPast: boolean;
            /** @description 최종 수정 — 수정 · 강제 종료 · 삭제 때 그대로 보낸다. */
            updatedAt: string;
            /** @description 최종 수정자 이름. */
            updatedByName: string | null;
            actions: components["schemas"]["BpHolidayActionsResponseDto"];
        };
        BpHolidayPublicHolidayResponseDto: {
            /** @example 2026-10-03 */
            holidayDate: string;
            /** @example 개천절 */
            name: string;
        };
        BpHolidayListResponseDto: {
            year: number;
            month: number;
            /** @description 날짜순. 같은 날짜는 전체 점포 휴일 먼저, 그다음 등록 순서. */
            items: components["schemas"]["BpHolidayDateRowResponseDto"][];
            total: number;
            publicHolidays: components["schemas"]["BpHolidayPublicHolidayResponseDto"][];
        };
        BpHolidayHistoryResponseDto: {
            changeId: number;
            bpHolidayId: number;
            /** @example 정기휴무 */
            holidayName: string;
            field: string;
            beforeValue: string | null;
            /** @example 온기식당 판교점 추가(2026-10-26부터) */
            afterValue: string | null;
            changedAt: string;
            changedByName: string | null;
        };
        BpHolidayHistoryListResponseDto: {
            items: components["schemas"]["BpHolidayHistoryResponseDto"][];
            total: number;
        };
        CheckBpHolidayOverlapsDto: {
            /**
             * @description 수정 중인 휴일. 등록이면 비운다.
             * @example 12
             */
            bpHolidayId?: number;
            /**
             * @description 휴일명 1~30자.
             * @example 정기휴무
             */
            name: string;
            /**
             * @description 설명 500자까지. 비우면 null.
             * @example 월요일마다 쉬는 정기 휴무
             */
            description?: string | null;
            /**
             * @description 휴일 유형(공통코드 HOLIDAY_TYPE) — DAY 하루 · PERIOD 기간 · REPEAT 반복.
             * @example REPEAT
             * @enum {string}
             */
            holidayTypeCode: "DAY" | "PERIOD" | "REPEAT";
            /**
             * @description 시작일(반복의 기준일). 오늘(한국 날짜) 이후.
             * @example 2026-11-02
             */
            startDate: string;
            /**
             * @description 기간의 종료일. 하루 · 반복은 무시한다.
             * @example 2026-11-04
             */
            endDate?: string | null;
            /**
             * @description 반복 유형(공통코드 HOLIDAY_REPEAT_TYPE) — 반복일 때만.
             * @example WEEKLY
             * @enum {string|null}
             */
            holidayRepeatTypeCode?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
            /**
             * @description 반복 종료 조건 — NONE 없음 · UNTIL_DATE 특정 날짜까지 · COUNT 지정 횟수만큼.
             * @example NONE
             * @enum {string|null}
             */
            repeatEndType?: "NONE" | "UNTIL_DATE" | "COUNT" | null;
            /**
             * @description 반복 종료일 — UNTIL_DATE 일 때만.
             * @example 2026-12-28
             */
            repeatEndDate?: string | null;
            /**
             * @description 반복 횟수 1~9999 — COUNT 일 때만. 없는 날짜(31일 · 2월 29일)는 세지 않는다.
             * @example 10
             */
            repeatCount?: number | null;
            /**
             * @description 전체 점포 휴일인가. true 면 예외 점포(excludedStoreIds), false 면 대상 점포(storeIds)를 받는다.
             * @example false
             */
            isAllStores: boolean;
            /**
             * @description 특정 점포 휴일의 대상 점포 — 하나 이상, 1000개까지.
             * @example [
             *       3
             *     ]
             */
            storeIds?: number[];
            /**
             * @description 전체 점포 휴일의 예외 점포 — 이 휴일에서 빠진다. 1000개까지.
             * @example []
             */
            excludedStoreIds?: number[];
        };
        BpHolidayOverlapDateResponseDto: {
            /** @example 2026-11-02 */
            date: string;
            /**
             * @example [
             *       "정기휴무"
             *     ]
             */
            holidayNames: string[];
        };
        BpHolidayOverlapStoreResponseDto: {
            storeId: number;
            storeName: string;
            /** @description 앞 10건. */
            dates: components["schemas"]["BpHolidayOverlapDateResponseDto"][];
            /** @description 10건 말고 더 겹치는 날짜 수. */
            moreDateCount: number;
        };
        BpHolidayOverlapsResponseDto: {
            /** @description 겹치는 점포 수. */
            storeCount: number;
            /** @description 겹치는 (점포, 날짜) 수. */
            dateCount: number;
            stores: components["schemas"]["BpHolidayOverlapStoreResponseDto"][];
        };
        /**
         * @description 오늘(한국 날짜) 기준 이 기간의 상태 — UPCOMING 적용 예정 · ACTIVE 적용 중 · ENDED 빠짐. 휴일 자체의 끝도 반영해
         *     강제 종료 · 끝난 휴일은 열린 기간도 ENDED, 시작 전 휴일의 기간은 UPCOMING 이다. 수정 양식의 「지금 열린 점포」는
         *     `effectiveEndDate === null && periodState !== 'ENDED'` 인 줄이다.
         * @enum {string}
         */
        BpHolidayPeriodState: "UPCOMING" | "ACTIVE" | "ENDED";
        BpHolidayStoreResponseDto: {
            /**
             * @description 오늘(한국 날짜) 기준 이 기간의 상태 — UPCOMING 적용 예정 · ACTIVE 적용 중 · ENDED 빠짐. 휴일 자체의 끝도 반영해
             *     강제 종료 · 끝난 휴일은 열린 기간도 ENDED, 시작 전 휴일의 기간은 UPCOMING 이다. 수정 양식의 「지금 열린 점포」는
             *     `effectiveEndDate === null && periodState !== 'ENDED'` 인 줄이다.
             * @example ACTIVE
             */
            periodState: components["schemas"]["BpHolidayPeriodState"];
            /** @description 기간 행 ID(holiday_store_mapping_id · holiday_excluded_store_id) — 같은 점포가 기간마다 한 줄이라 화면 key 로 쓴다. */
            periodId: number;
            storeId: number;
            /** @example ST000003 */
            storeCode: string;
            name: string;
            /**
             * @description DIRECT · FRANCHISE.
             * @example DIRECT
             */
            storeTypeCode: string;
            /**
             * @description 점포 상태 — 폐점(CLOSED)이면 화면에 태그를 붙인다.
             * @example OPERATING
             */
            storeStatusCode: string;
            /**
             * @description 이 기간의 시작일.
             * @example 2026-09-21
             */
            effectiveStartDate: string;
            /**
             * @description 이 기간의 종료일(점포를 뺀 날의 전날). 열린 기간이면 null — 휴일 자체가 끝났는지는 periodState 로 본다.
             * @example 2026-10-25
             */
            effectiveEndDate: string | null;
            /** @description 이 사용자가 맡은 점포인가 — 일부 점포 사용자는 맡은 점포만 빼거나 더한다. */
            isManaged: boolean;
        };
        BpHolidayDetailResponseDto: {
            bpHolidayId: number;
            name: string;
            description: string | null;
            isAllStores: boolean;
            holidayTypeCode: string;
            /** @example 2026-09-21 */
            startDate: string;
            /** @description 하루는 시작일과 같고 반복은 null. */
            endDate: string | null;
            holidayRepeatTypeCode: string | null;
            /** @description NONE · UNTIL_DATE · COUNT. 반복이 아니면 null. */
            repeatEndType: string | null;
            repeatEndDate: string | null;
            repeatCount: number | null;
            /**
             * @description 오늘 기준 — UPCOMING 시작 전 · ONGOING 진행 중 · ENDED 종료.
             * @enum {string}
             */
            state: "ENDED" | "UPCOMING" | "ONGOING";
            /** @description 특정 점포면 대상 점포, 전체 점포면 예외 점포 — 지우지 않은 모든 기간(닫힌 기간 포함), 기간마다 한 줄. */
            stores: components["schemas"]["BpHolidayStoreResponseDto"][];
            /** @description 고른 날짜(없으면 오늘)에 이 휴일이 적용되는 점포 수. */
            appliedStoreCount: number;
            /** @description 반복이면 고른 날짜 다음 날짜 세 개까지. 반복이 아니면 빈 배열. */
            nextDates: string[];
            histories: components["schemas"]["BpHolidayHistoryResponseDto"][];
            actions: components["schemas"]["BpHolidayActionsResponseDto"];
            createdAt: string;
            createdByName: string | null;
            updatedAt: string;
            updatedByName: string | null;
        };
        SaveBpHolidayDto: {
            /**
             * @description 휴일명 1~30자.
             * @example 정기휴무
             */
            name: string;
            /**
             * @description 설명 500자까지. 비우면 null.
             * @example 월요일마다 쉬는 정기 휴무
             */
            description?: string | null;
            /**
             * @description 휴일 유형(공통코드 HOLIDAY_TYPE) — DAY 하루 · PERIOD 기간 · REPEAT 반복.
             * @example REPEAT
             * @enum {string}
             */
            holidayTypeCode: "DAY" | "PERIOD" | "REPEAT";
            /**
             * @description 시작일(반복의 기준일). 오늘(한국 날짜) 이후.
             * @example 2026-11-02
             */
            startDate: string;
            /**
             * @description 기간의 종료일. 하루 · 반복은 무시한다.
             * @example 2026-11-04
             */
            endDate?: string | null;
            /**
             * @description 반복 유형(공통코드 HOLIDAY_REPEAT_TYPE) — 반복일 때만.
             * @example WEEKLY
             * @enum {string|null}
             */
            holidayRepeatTypeCode?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
            /**
             * @description 반복 종료 조건 — NONE 없음 · UNTIL_DATE 특정 날짜까지 · COUNT 지정 횟수만큼.
             * @example NONE
             * @enum {string|null}
             */
            repeatEndType?: "NONE" | "UNTIL_DATE" | "COUNT" | null;
            /**
             * @description 반복 종료일 — UNTIL_DATE 일 때만.
             * @example 2026-12-28
             */
            repeatEndDate?: string | null;
            /**
             * @description 반복 횟수 1~9999 — COUNT 일 때만. 없는 날짜(31일 · 2월 29일)는 세지 않는다.
             * @example 10
             */
            repeatCount?: number | null;
            /**
             * @description 전체 점포 휴일인가. true 면 예외 점포(excludedStoreIds), false 면 대상 점포(storeIds)를 받는다.
             * @example false
             */
            isAllStores: boolean;
            /**
             * @description 특정 점포 휴일의 대상 점포 — 하나 이상, 1000개까지.
             * @example [
             *       3
             *     ]
             */
            storeIds?: number[];
            /**
             * @description 전체 점포 휴일의 예외 점포 — 이 휴일에서 빠진다. 1000개까지.
             * @example []
             */
            excludedStoreIds?: number[];
        };
        BpHolidayCreatedResponseDto: {
            bpHolidayId: number;
        };
        UpdateBpHolidayDto: {
            /**
             * @description 상세에서 읽은 updatedAt — 그 뒤 다른 사용자가 고쳤으면 409.
             * @example 2026-10-26T01:00:00.000Z
             */
            updatedAt: string;
            /**
             * @description 휴일명 1~30자.
             * @example 정기휴무
             */
            name: string;
            /**
             * @description 설명 500자까지. 비우면 null.
             * @example 월요일마다 쉬는 정기 휴무
             */
            description?: string | null;
            /**
             * @description 휴일 유형(공통코드 HOLIDAY_TYPE) — DAY 하루 · PERIOD 기간 · REPEAT 반복.
             * @example REPEAT
             * @enum {string}
             */
            holidayTypeCode: "DAY" | "PERIOD" | "REPEAT";
            /**
             * @description 시작일(반복의 기준일). 오늘(한국 날짜) 이후.
             * @example 2026-11-02
             */
            startDate: string;
            /**
             * @description 기간의 종료일. 하루 · 반복은 무시한다.
             * @example 2026-11-04
             */
            endDate?: string | null;
            /**
             * @description 반복 유형(공통코드 HOLIDAY_REPEAT_TYPE) — 반복일 때만.
             * @example WEEKLY
             * @enum {string|null}
             */
            holidayRepeatTypeCode?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
            /**
             * @description 반복 종료 조건 — NONE 없음 · UNTIL_DATE 특정 날짜까지 · COUNT 지정 횟수만큼.
             * @example NONE
             * @enum {string|null}
             */
            repeatEndType?: "NONE" | "UNTIL_DATE" | "COUNT" | null;
            /**
             * @description 반복 종료일 — UNTIL_DATE 일 때만.
             * @example 2026-12-28
             */
            repeatEndDate?: string | null;
            /**
             * @description 반복 횟수 1~9999 — COUNT 일 때만. 없는 날짜(31일 · 2월 29일)는 세지 않는다.
             * @example 10
             */
            repeatCount?: number | null;
            /**
             * @description 전체 점포 휴일인가. true 면 예외 점포(excludedStoreIds), false 면 대상 점포(storeIds)를 받는다.
             * @example false
             */
            isAllStores: boolean;
            /**
             * @description 특정 점포 휴일의 대상 점포 — 하나 이상, 1000개까지.
             * @example [
             *       3
             *     ]
             */
            storeIds?: number[];
            /**
             * @description 전체 점포 휴일의 예외 점포 — 이 휴일에서 빠진다. 1000개까지.
             * @example []
             */
            excludedStoreIds?: number[];
        };
        TerminateBpHolidayDto: {
            /**
             * @description 상세에서 읽은 updatedAt.
             * @example 2026-10-26T01:00:00.000Z
             */
            updatedAt: string;
        };
        HomeStaffCardDto: {
            /** @description 총수 — 본사 역할에게도 가림 없이 센다(점포별 숫자, 운영 정책 ATT-30) */
            total: number;
            /** @description 정직원. 본사 역할에게 가려지는 점포(직영이 아닌 점포)는 본사 제공 동의한 직원만 — 그래서 정직원 + 파트타이머가 총수보다 작을 수 있다 */
            fullTime: number;
            /** @description 파트타이머. 정직원과 같은 기준 */
            partTime: number;
        };
        HomeStoreCardDto: {
            total: number;
            direct: number;
            franchise: number;
        };
        HomeAttendanceCardDto: {
            /** @description 근무 예정 — 오늘 근무스케줄이 있는 재직 직원 수. 근무스케줄 화면처럼 본사 역할에게도 가림 없이 센다 */
            scheduled: number;
            /** @description 출근 — 오늘 출근 기록이 있는 직원 수. 본사 역할에게 가려지는 점포(직영이 아닌 점포)는 본사 제공 동의한 직원만(운영 정책 ATT-30 v217) */
            checkedIn: number;
            /**
             * @description 미출근 — 근무 예정인데 그날 출퇴근 기록이 하나도 없고 첫 근무 시작 시각이 지난 수. 출퇴근 현황의 미출근과 같다(운영 정책
             *     ATT-34) — 시작 시각 정각은 아직 예정, 출근 없는 퇴근만 있으면 출근 미등록이라 들지 않는다. 출근과 같은 기준으로 가린다
             */
            notCheckedIn: number;
        };
        HomeInquiryCardDto: {
            /** @description 답변 대기 — 접수 · 처리중 */
            waiting: number;
            /** @description 답변완료 */
            answered: number;
        };
        HomeCardsDto: {
            /** @description 직원 정보 관리 조회 권한 */
            staff: components["schemas"]["HomeStaffCardDto"] | null;
            /** @description 미체결 계약(발송 대기 + 서명 대기 + 수정 요청). 본사 역할에게 가려지는 점포는 동의한 직원의 계약만. 근로계약 관리 조회 권한 */
            unsignedContractCount: number | null;
            stores: components["schemas"]["HomeStoreCardDto"];
            /** @description 출퇴근 현황 · 근무스케줄 관리 조회 권한 둘 다 */
            todayAttendance: components["schemas"]["HomeAttendanceCardDto"] | null;
            /** @description 문의사항 조회 권한 */
            myInquiries: components["schemas"]["HomeInquiryCardDto"] | null;
        };
        HomeStoreRowDto: {
            storeId: number;
            storeName: string;
            /** @description 점포 유형 코드 — DIRECT · FRANCHISE */
            storeTypeCode: string;
            staffCount: number | null;
            unsignedContractCount: number | null;
            /** @description 오늘 출근 — 카드의 checkedIn 과 같은 기준(본사 역할에게 가려지는 점포는 동의한 직원만) */
            checkedInCount: number | null;
            /** @description 오늘 근무 예정 — 가림 없이 */
            scheduledCount: number | null;
            /** @description 미조치 — 서명 대기 + 근로계약 수정 요청 + 소속 확인 거절 + 긴급 TO-DO 미완료. 볼 수 있는 영역의 건수만 더한다 */
            pendingActionCount: number;
        };
        HomeStoreTableDto: {
            /** @description 운영 점포 전체 수 */
            total: number;
            /** @description 미조치 많은 순(같으면 점포명) 일곱 곳 */
            items: components["schemas"]["HomeStoreRowDto"][];
        };
        HomeSummaryResponseDto: {
            /**
             * Format: date-time
             * @description 조회 시각
             */
            asOf: string;
            /** @description 플랫폼 계정(플랫폼 마스터 · 플랫폼 관리자)이면 true — 현황 없이 안내만 보이고, 나머지 칸은 null · 빈 표다 */
            platform: boolean;
            cards: components["schemas"]["HomeCardsDto"] | null;
            storeTable: components["schemas"]["HomeStoreTableDto"];
        };
        HomeRenewalDto: {
            contractId: number;
            /** @description 가려지는 직원(본사 제공 동의가 없는 가맹 점포 직원)이면 null */
            staffMemberId: number | null;
            /** @description 가려지는 직원이면 null */
            name: string | null;
            isMasked: boolean;
            storeId: number;
            storeName: string;
            /** @description 계약 종료일(YYYY-MM-DD) */
            endDate: string;
        };
        /**
         * @description 계약 갱신 예정 · 근로계약 서명 대기 · 근로계약 수정 요청 · 소속 확인 거절 · 문의 답변완료(마지막 답변이 최근 7일 안) · 긴급 TO-DO 미완료
         * @enum {string}
         */
        HomePendingType: "CONTRACT_RENEWAL" | "CONTRACT_PENDING_SIGNATURE" | "CONTRACT_CORRECTION_REQUESTED" | "AFFILIATION_REJECTED" | "INQUIRY_ANSWERED" | "URGENT_TODO";
        HomePendingFilterDto: {
            /** @description 점포. 문의는 점포로 거르지 않아 빈 배열 */
            storeIds: number[];
            /** @description 그 화면 목록의 상태 필터 값 — 근로계약 상태 · 가입 상태 · 문의 답변 상태 · TO-DO 상태 */
            status: string[];
        };
        HomePendingItemDto: {
            /** @description 계약 갱신 예정 · 근로계약 서명 대기 · 근로계약 수정 요청 · 소속 확인 거절 · 문의 답변완료(마지막 답변이 최근 7일 안) · 긴급 TO-DO 미완료 */
            type: components["schemas"]["HomePendingType"];
            count: number;
            /** @description 대표 이름 — 가장 오래 기다린 것의 직원 이름(문의 · TO-DO 는 제목). 가려지는 직원이면 null */
            firstName: string | null;
            isFirstNameMasked: boolean;
            /** @description 대표 말고 나머지 건수(「외 N명」) */
            othersCount: number;
            /** @description 가장 오래 기다린 일수(한국 날짜) — 서명 대기는 발송 뒤, 수정 요청은 요청 뒤, 소속 확인 거절은 거절 뒤, 문의는 마지막 답변 뒤, TO-DO 는 등록 뒤. 갱신 예정은 null */
            waitingDays: number | null;
            filter: components["schemas"]["HomePendingFilterDto"];
        };
        HomePendingResponseDto: {
            /** Format: date-time */
            asOf: string;
            /** @description 플랫폼 계정이면 true — renewals 는 null, items 는 빈 배열 */
            platform: boolean;
            /** @description 경고 밴드. 근로계약 관리 조회 권한이 없으면 null */
            renewals: components["schemas"]["HomeRenewalDto"][] | null;
            /** @description 건수가 0인 유형과 권한이 없는 유형은 뺀다. 순서는 갱신 예정 → 계약 → 직원 → 문의 → TO-DO */
            items: components["schemas"]["HomePendingItemDto"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AppController_getHello: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
        };
    };
    AccountAuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponseDto"];
                };
            };
            /** @description `lockExpiresAt` 이 있으면 그 계정이 연속 5번 틀려 그때까지 잠김(비밀번호가 맞아도), 없으면 요청 제한(본문은 `statusCode` · `message` 뿐) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginTooManyRequestsResponseDto"];
                };
            };
        };
    };
    AccountAuthController_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RefreshResponseDto"];
                };
            };
        };
    };
    AccountAuthController_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginAccountResponseDto"];
                };
            };
        };
    };
    AccountAuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PasswordResetController_requestPin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RequestPasswordResetPinDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PasswordResetController_verifyPin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyPasswordResetPinDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PasswordResetController_resetPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPasswordDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EmailFindController_find: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailFindDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailFindResponseDto"];
                };
            };
            /** @description 이름이 비었거나 · 휴대전화번호가 숫자 10~11자리가 아니거나(하이픈 · 공백은 지운 뒤) · 생년월일이 YYYY-MM-DD 의 있는 날짜가 아니거나 · 모르는 칸이 있음. 번호 잠금의 실패로는 세지 않는다(요청 제한에는 센다) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 맞는 계정이 없음. 어느 값이 틀렸든 같은 메시지(「일치하는 계정이 없습니다.」)이고 실패 1회로 센다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description `lockExpiresAt` 이 있으면 그 번호가 5번 틀려 그때까지 막힘(값이 맞아도), 없으면 요청 제한 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailFindTooManyRequestsResponseDto"];
                };
            };
        };
    };
    PasswordResetLinkController_verify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyPasswordResetLinkDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 링크 — 없음 · 만료 · 사용 · 새 링크로 대체 · 탈퇴를 가리지 않는다 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PasswordResetLinkController_reset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPasswordWithLinkDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 비밀번호 규칙 위반 — 사유를 준다. 링크는 그대로라 다시 정할 수 있다 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 링크(확인과 같은 문구) */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PasswordResetLinkAdminController_issue: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PasswordResetLinkResponseDto"];
                };
            };
            /** @description 토큰이 없거나 유효하지 않음, 또는 접속이 끝난 직원 앱 토큰 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 접속이 살아 있는 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 전 · 퇴직 · 탈퇴 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 계정에 1분 안에 다시 보냄 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 보내기 전에 막힘(메일 템플릿 꺼짐 · 제목 없음 · DB 오류) — 「메일 설정 문제로 … 플랫폼 관리자에게 문의해 주세요.」 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 링크 주소(STAFF_APP_URL) · 메일 설정(MAIL_*)이 없거나 메일 서버에 보내지 못함 — 잠시 뒤 다시 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminLoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminLoginResponseDto"];
                };
            };
        };
    };
    AdminAuthController_issueTemporaryPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminTemporaryPasswordDto"];
            };
        };
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTemporaryPasswordResponseDto"];
                };
            };
            /** @description 이름 · 아이디가 비었거나 20자를 넘음 · 이메일 형식이 아니거나 254자를 넘음 · 모르는 칸이 있음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 맞는 사용 중 계정이 없음. 미사용 · 탈퇴 · 삭제와만 맞아도 아이디 찾기와 같은 문구 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 계정 1시간 5번(한글 문구) 또는 요청 제한 — 같은 IP 1분 30번, 같은 이메일 10분 10번 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description SMTP 로 메일을 보내지 못함 · 메일 설정 없음. `code: TEMPORARY_PASSWORD_SEND_FAILED`, 임시 비밀번호는 저장하지 않는다. 템플릿이 꺼진 것처럼 다시 시도해도 풀리지 않는 실패는 500 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_findLoginId: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminLoginIdFindDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminLoginIdFindResponseDto"];
                };
            };
            /** @description 이름이 비었거나 20자를 넘음 · 이메일 형식이 아니거나 254자를 넘음 · 모르는 칸이 있음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 맞는 사용 중 계정이 없음. 어느 경우든 같은 문구 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 요청 제한 — 같은 IP 1분 30번, 같은 이메일 10분 10번 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminRefreshResponseDto"];
                };
            };
        };
    };
    AdminAuthController_signupSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminSignupSessionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminLoginResponseDto"];
                };
            };
        };
    };
    AdminAuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_getLoginInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminLoginInfoResponseDto"];
                };
            };
        };
    };
    AdminAuthController_getMyStores: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminStoreListResponseDto"];
                };
            };
        };
    };
    AdminAuthController_changeRequiredPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminPasswordChangeDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 비밀번호 정책 위반 · 필수 약관 미동의 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 강제 변경 대상이 아님 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminProfileResponseDto"];
                };
            };
        };
    };
    AdminAuthController_updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminProfileUpdateDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 형식 위반 · 동시 수정 토큰 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 등록된 이메일 · 동시 수정(다른 관리자가 먼저 저장) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_changeMyPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminMyPasswordChangeDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 현재 비밀번호 불일치 · 비밀번호 정책 위반 · 새 비밀번호가 현재와 같음 · 확인 불일치 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_verifyMyPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminPasswordVerificationDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 현재 비밀번호 불일치 · 빈 값 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 계정을 찾을 수 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_getWithdrawEligibility: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WithdrawEligibilityResponseDto"];
                };
            };
            /** @description BP 마스터가 아님 · 플랫폼 BP */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 계정을 찾을 수 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_withdraw: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWithdrawalDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 현재 비밀번호 불일치 · 직접입력 사유 상세 누락 · 진행 중인 근로계약 있음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description BP 마스터가 아님 · 플랫폼 BP */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 계정을 찾을 수 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_checkProfileEmail: {
        parameters: {
            query: {
                email: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminProfileEmailAvailabilityResponseDto"];
                };
            };
        };
    };
    AdminAuthController_getBpProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpProfileResponseDto"];
                };
            };
            /** @description BP 마스터가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 계정을 찾을 수 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_updateBpProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BpProfileUpdateDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description clearBusinessVerification 과 businessVerificationToken 을 함께 보냄 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description BP 마스터가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 계정을 찾을 수 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 동시 수정 — updatedAt 이 최신이 아님 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAuthController_requestBpBusinessVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BpBusinessVerificationDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpBusinessVerificationResponseDto"];
                };
            };
            /** @description BP 마스터가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 다른 BP · 점포가 쓰는 사업자등록번호 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 국세청 정보와 불일치 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description IP · 계정의 시간당 한도(10건) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 국세청 연동 장애 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodesController_findAll: {
        parameters: {
            query?: {
                /**
                 * @description 쉼표로 구분한 그룹 코드. 없으면 공통코드 전체. 없거나 사용하지 않는 그룹은 빈 목록으로 온다.
                 *     빈 칸 · 형식이 틀린 코드가 하나라도 있거나 50개를 넘으면 400 이다.
                 */
                groups?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CodeItemsResponseDto"];
                };
            };
        };
    };
    AdminSignupController_signup: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SignupResponseDto"];
                };
            };
            /** @description 같은 IP 의 시간당 한도(5건) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSignupController_loginIdAvailability: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginIdAvailabilityDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvailabilityResponseDto"];
                };
            };
        };
    };
    AdminSignupController_businessVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupBusinessVerificationDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SignupBusinessVerificationResponseDto"];
                };
            };
            /** @description 이미 등록된 사업자등록번호 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 국세청 정보와 일치하지 않음 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 IP 의 시간당 한도(10건) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 국세청 확인 실패(장애 · 키 없음) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminSignupController_emailAvailability: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailAvailabilityDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvailabilityResponseDto"];
                };
            };
        };
    };
    EnumsController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnumCatalogResponseDto"];
                };
            };
        };
    };
    EnumsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnumCatalogResponseDto"];
                };
            };
            /** @description 그 이름의 enum 이 없다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_listGroups: {
        parameters: {
            query: {
                /** @description 그룹 코드에 들어 있으면 나온다(대소문자 무시). */
                groupCode?: string;
                /** @description 그룹명에 들어 있으면 나온다. */
                groupName?: string;
                /**
                 * @description 관리 주체. 여러 개는 `manageOwnerCodes=PLATFORM_FIXED&manageOwnerCodes=PLATFORM_PROVIDED` 또는 쉼표로.
                 *     주지 않으면 둘 다(플랫폼고정 · 플랫폼제공).
                 */
                manageOwnerCodes?: ("PLATFORM_FIXED" | "PLATFORM_PROVIDED")[];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CodeGroupListResponseDto"];
                };
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_updateGroups: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCodeGroupsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 고칠 그룹이 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 한 요청에 같은 그룹 코드가 두 번 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_createGroups: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCodeGroupsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 있는(지운 것 포함) 그룹 코드 · 요청 안에서 겹친 그룹 코드 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_listItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CodeItemListResponseDto"];
                };
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_updateItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 그룹 · 고칠 상세 코드가 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 한 요청에 같은 상세 코드가 두 번 · 확인 뒤 다른 관리자가 먼저 지운 코드 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_createItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이 그룹의 살아 있는 행(플랫폼 원본 · BP별 · BP전용)과 겹친 상세 코드 · 요청 안에서 겹친 상세 코드 · 확인 뒤 다른 관리자가 같은 코드를 먼저 등록 · 되살림 — 지운 원본과 같은 코드는 되살린다 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_deleteItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 그룹 · 지울 상세 코드가 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼고정 그룹(사용 상태로만 관리) · 한 요청에 같은 상세 코드가 두 번 · 확인 뒤 다른 관리자가 먼저 지움 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CodeGroupsController_applyToBps: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpApplicationResponseDto"];
                };
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼제공 그룹이 아님 · 상세 코드가 없음 · 사용 중인 고객 BP 가 없음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_list: {
        parameters: {
            query: {
                /** @description 이 유형의 점포를 관리하는 계정 — 헤더의 직영 · 가맹 전체 범위용. 전체 점포 계정은 늘 나온다. */
                storeTypeCode?: components["schemas"]["StoreType"];
                /**
                 * @description 역할 — 고른 역할의 계정만. 여러 개는 반복 또는 쉼표로. 주지 않거나 비우면 세 역할 모두
                 *     (역할을 하나도 고르지 않은 화면은 api 를 부르지 않는다).
                 */
                roleTypeCodes?: components["schemas"]["BpAdminRole"][];
                /** @description 계정 상태. 주지 않으면 사용 · 미사용 둘 다. */
                accountStatus?: components["schemas"]["AdminAccountStatus"];
                /** @description 아이디 · 이름 중 하나에 들어 있으면 나온다. */
                keyword?: string;
                /** @description 이 점포를 관리하는 계정 — 매핑된 계정과 전체 점포 계정. 여러 개는 반복 또는 쉼표로, 1000개까지. */
                storeIds?: number[];
                /** @description 권한 그룹. */
                roleGroupId?: number;
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminListResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBpAdminDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateBpAdminResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 지워진 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 아이디 · 이메일 중복 · 다른 가맹 마스터가 맡은 점포 · 사용 중이 아닌 BP(미사용 · 탈퇴) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 잠금 대기(BP 미사용 전환 · 삭제 등) · 연결 부족으로 트랜잭션 시간 초과 — 다시 시도 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_roleGroups: {
        parameters: {
            query?: {
                /** @description 이 역할의 그룹만. 주지 않으면 세 역할 모두. */
                roleTypeCode?: components["schemas"]["BpAdminRole"];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminRoleGroupListResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_storeOptions: {
        parameters: {
            query: {
                /** @description 등록 · 수정하는 계정의 역할. */
                roleTypeCode: components["schemas"]["BpAdminRole"];
                /** @description 수정 중인 가맹 마스터. 주면 그 계정이 맡은 점포를 「다른 가맹 마스터 담당」으로 빼지 않는다. 가맹 마스터가 아니면 쓰지 않는다. */
                adminAccountId?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminStoreOptionListResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_loginIdAvailability: {
        parameters: {
            query: {
                /** @description 아이디. 영문 또는 영문 · 숫자 4~20자. */
                loginId: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginIdAvailabilityResponseDto"];
                };
            };
            /** @description 아이디 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_emailAvailability: {
        parameters: {
            query: {
                email: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminProfileEmailAvailabilityResponseDto"];
                };
            };
            /** @description 이메일 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminDetailResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 볼 수 없는 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBpAdminDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 볼 수 없는 계정 · 그사이 지워진 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일 중복 · 동시 수정 · 다른 가맹 마스터가 맡은 점포 · 사용 중이 아닌 BP 에 사용으로 저장 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 잠금 대기(BP 미사용 전환 · 삭제 등) · 연결 부족으로 트랜잭션 시간 초과 — 다시 시도 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_histories: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminHistoryListResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 볼 수 없는 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_updateImpact: {
        parameters: {
            query: {
                accountStatus: components["schemas"]["AdminAccountStatus"];
                /** @description 저장하려는 점포. 반복 또는 쉼표로, 1000개까지. 비우면 점포를 모두 빼는 것으로 본다. */
                storeIds: number[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpAdminUpdateImpactResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 볼 수 없는 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpAdminsController_resetPassword: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResetBpAdminPasswordResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 사용자의 BP 미선택 · 선택할 수 없는 권한 · 점포 범위 밖 · 폐점 점포 · 점포 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP · 역할 규칙(등록할 수 없는 역할, 연결 가맹 마스터가 아님, 본인 계정의 권한 · 상태 · 점포) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 볼 수 없는 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일이 없는 계정 · 그 사이 이메일 · 역할이 바뀜 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메일 설정(MAIL_* · ADMIN_WEB_URL)이 없는 환경 — 아무것도 바꾸지 않는다 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodeGroupsController_listGroups: {
        parameters: {
            query: {
                /** @description 관리 주체. BP 공통코드 관리에는 플랫폼제공 그룹만 보이므로 `PLATFORM_PROVIDED` 만 받는다(다른 값은 400). 주지 않으면 플랫폼제공 전체. */
                manageOwnerCodes?: "PLATFORM_PROVIDED"[];
                /** @description 그룹 코드에 들어 있으면 나온다(대소문자 무시). */
                groupCode?: string;
                /** @description 그룹명에 들어 있으면 나온다. */
                groupName?: string;
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpCodeGroupListResponseDto"];
                };
            };
            /** @description 본문 · 쿼리 검증 실패 · (조회) 플랫폼 사용자의 X-Bp-Code-Id 누락 — 등록 · 수정 · 삭제는 그 전에 403 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 플랫폼 사용자의 등록 · 수정 · 삭제 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:groupCode` 경로는 그룹 404(없음 · 지움 · 사용중지 · 플랫폼고정 — BP 화면에 보이지 않는 그룹)도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodeGroupsController_listItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpCodeItemListResponseDto"];
                };
            };
            /** @description 본문 · 쿼리 검증 실패 · (조회) 플랫폼 사용자의 X-Bp-Code-Id 누락 — 등록 · 수정 · 삭제는 그 전에 403 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 플랫폼 사용자의 등록 · 수정 · 삭제 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:groupCode` 경로는 그룹 404(없음 · 지움 · 사용중지 · 플랫폼고정 — BP 화면에 보이지 않는 그룹)도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodeGroupsController_updateItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 본문 · 쿼리 검증 실패 · (조회) 플랫폼 사용자의 X-Bp-Code-Id 누락 — 등록 · 수정 · 삭제는 그 전에 403 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 플랫폼 사용자의 등록 · 수정 · 삭제 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 대상 BP(가드) · 그룹(없음 · 지움 · 사용중지 · 플랫폼고정) 404, 그리고 이 BP 에 없는 상세 코드(플랫폼 원본에만 있는 코드 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 한 요청에 같은 코드가 두 번 · 확인 뒤 다른 관리자가 먼저 지운 코드(「다른 관리자가 먼저 지운…저장해 주세요」) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodeGroupsController_createItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 본문 · 쿼리 검증 실패 · (조회) 플랫폼 사용자의 X-Bp-Code-Id 누락 — 등록 · 수정 · 삭제는 그 전에 403 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 플랫폼 사용자의 등록 · 수정 · 삭제 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:groupCode` 경로는 그룹 404(없음 · 지움 · 사용중지 · 플랫폼고정 — BP 화면에 보이지 않는 그룹)도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 그룹의 살아 있는 플랫폼 원본(「플랫폼이 등록한…」)이나 이 BP 의 살아 있는 행(「이미 있는…」)과 겹친 코드 · 요청 안에서 겹친 코드 · 확인 뒤 다른 관리자가 같은 코드를 먼저 등록하거나 되살림 — 이 BP 의 지운 행과 같은 코드는 BP전용으로 되살린다 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodeGroupsController_deleteItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteCodeItemsDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 본문 · 쿼리 검증 실패 · (조회) 플랫폼 사용자의 X-Bp-Code-Id 누락 — 등록 · 수정 · 삭제는 그 전에 403 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 플랫폼 사용자의 등록 · 수정 · 삭제 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 대상 BP(가드) · 그룹(없음 · 지움 · 사용중지 · 플랫폼고정) 404, 그리고 이 BP 에 없는 상세 코드 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 한 요청에 같은 코드가 두 번 · 확인 뒤 다른 관리자가 먼저 지움 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_list: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
                /** @description 아이디 · 이름 중 하나에 들어 있으면 나온다. */
                keyword?: string;
                /** @description 사용자 권한(권한 그룹). */
                roleGroupId?: number;
                /** @description 계정 상태. 여러 개는 `statuses=ACTIVE&statuses=INACTIVE` 또는 쉼표로. 주지 않으면 둘 다. */
                statuses?: ("ACTIVE" | "INACTIVE")[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformAdminListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlatformAdminDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePlatformAdminResponseDto"];
                };
            };
            /** @description 입력 형식 · 줄 수 없는 권한 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 아이디 · 이메일 중복 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_roleGroups: {
        parameters: {
            query?: {
                /** @description `filter` 면 목록 필터용 — 호출자와 상관없이 플랫폼 권한(PM · PA) 그룹을 다 준다. 없으면 등록 · 수정 선택지. */
                purpose?: "filter";
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformRoleGroupListResponseDto"];
                };
            };
            /** @description purpose 값 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_loginIdAvailability: {
        parameters: {
            query: {
                /** @description 아이디. 영문 또는 영문 · 숫자 4~20자. */
                loginId: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginIdAvailabilityResponseDto"];
                };
            };
            /** @description 아이디 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_emailAvailability: {
        parameters: {
            query: {
                email: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminProfileEmailAvailabilityResponseDto"];
                };
            };
            /** @description 이메일 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformAdminDetailResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 · 탈퇴한 계정, 플랫폼 관리자가 아닌 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformAdminDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 · 탈퇴한 계정, 플랫폼 관리자가 아닌 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일 중복 · 동시 수정 · 마지막 사용 중 플랫폼 마스터 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 · 탈퇴한 계정, 플랫폼 관리자가 아닌 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 마지막 사용 중 플랫폼 마스터 · 그 사이 다른 관리자가 지우거나 권한 유형을 바꿈 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_histories: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformAdminHistoryListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 · 탈퇴한 계정, 플랫폼 관리자가 아닌 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformAdminsController_resetPassword: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResetPasswordResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 · 탈퇴한 계정, 플랫폼 관리자가 아닌 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일이 없는 계정 · 그 사이 다른 관리자가 지우거나 권한 유형 · 이메일을 바꿈 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메일 설정(MAIL_* · ADMIN_WEB_URL)이 없는 환경 — 아무것도 바꾸지 않는다 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_list: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpRoleGroupListResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:id` 경로는 그룹 404 도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlatformRoleGroupDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePlatformRoleGroupResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:id` 경로는 그룹 404 도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 이름의 권한(같은 BP · 같은 관리계정) · 권한 코드 소진 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_franchiseMasterMenus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpRoleGroupMenuTreeResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) — `:id` 경로는 그룹 404 도 있다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpRoleGroupDetailResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformRoleGroupDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 이름의 권한 · 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeletePlatformRoleGroupDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 연결 사용자가 있는데 대체 권한 없음 · 후보가 아닌 대체 권한 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_menus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpRoleGroupMenuTreeResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_saveMenus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveRoleGroupMenusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveRoleGroupMenusResponseDto"];
                };
            };
            /** @description 숨긴 · 없는 메뉴, 같은 메뉴 두 번, 조회 없는 등록 · 수정 · 삭제, 상한(기준 고정 권한 ∩ 본인 권한) 밖 칸 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_previewMenus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreviewRoleGroupMenusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleGroupMenuRevocationPreviewResponseDto"];
                };
            };
            /** @description 저장과 같은 검사 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpRoleGroupsController_deletionCandidates: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleGroupDeletionCandidatesResponseDto"];
                };
            };
            /** @description 플랫폼 사용자의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · BP · 가맹 사용자의 다른 BP 헤더 · 역할로 쓸 수 없음 · 연결 가맹 마스터 없는 가맹 관리자(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 호출자 범위 밖 그룹(고정 권한 · 플랫폼 권한 · 다른 가맹 마스터의 FA 포함) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_list: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformRoleGroupSummaryListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlatformRoleGroupDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePlatformRoleGroupResponseDto"];
                };
            };
            /** @description 권한명 · 설명 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 이름의 권한 · 권한 코드를 더 만들 수 없음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformRoleGroupDetailResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformRoleGroupDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 권한명 · 설명 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 이름의 권한 · 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeletePlatformRoleGroupDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 연결 사용자가 있는데 대체 권한 없음 · 고를 수 없는 대체 권한(없거나 지운 권한 · 플랫폼 BP 가 아닌 권한 · 고정 권한 · 다른 유형 · 자기 자신). 연결 사용자가 없어도 보낸 대체 권한은 검사한다 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 고정 권한 · 플랫폼 관리자 추가 권한이 아님 · 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_menus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleGroupMenuTreeResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_saveMenus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveRoleGroupMenusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveRoleGroupMenusResponseDto"];
                };
            };
            /** @description 숨긴 · 없는 메뉴, 같은 메뉴 두 번, 조회 없는 등록 · 수정 · 삭제, BP · 가맹 마스터의 플랫폼 메뉴 켜기(끄기는 받는다), 본인 권한 범위 밖 칸(조회를 끄면 함께 꺼지는 칸 포함) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 마스터 권한(전체 허용 고정) · 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_previewMenus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreviewRoleGroupMenusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleGroupMenuRevocationPreviewResponseDto"];
                };
            };
            /** @description 숨긴 · 없는 메뉴, 같은 메뉴 두 번, 조회 없는 등록 · 수정 · 삭제, BP · 가맹 마스터의 플랫폼 메뉴 켜기, 본인 권한 범위 밖 칸 — 저장과 같은 검사 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 마스터 권한(전체 허용 고정) — 저장과 같다 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformRoleGroupsController_deletionCandidates: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoleGroupDeletionCandidatesResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한(메뉴 권한 저장 · 삭제) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 권한 · 플랫폼 권한(PM · PA · BM · FM)이 아닌 그룹 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지울 수 없는 권한 — 고정 권한 · 플랫폼 관리자 추가 권한이 아님 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_services: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformMenuServiceListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_tree: {
        parameters: {
            query: {
                /** @description 서비스 코드 — 공통코드 SERVICE 값(사용중지 서비스도 된다). */
                serviceCode: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformMenuTreeResponseDto"];
                };
            };
            /** @description 서비스 코드 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 서비스 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlatformMenuDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePlatformMenuResponseDto"];
                };
            };
            /** @description 형식(메뉴명 · URL · 서비스 코드) · 없는 서비스 · 고를 수 없는 상위(없음 · 다른 서비스) · 3단계 메뉴 아래 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같거나 겹치는 URL 을 쓰는 사용 중 메뉴 · API 권한 주소(경로 방식 @MenuPermission 컨트롤러의 경로)인 URL · 메뉴 코드를 더 만들 수 없음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓰기가 몰려 트랜잭션 시간을 넘김 — 잠시 뒤 다시 시도 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformMenuDetailResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴를 찾을 수 없습니다. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformMenuDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 형식(메뉴명 · URL · 상태 · updatedAt) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴를 찾을 수 없습니다. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같거나 겹치는 URL 을 쓰는 사용 중 메뉴 · API 권한 주소인 URL 을 바꾸거나 다른 메뉴가 가져가려 함 · 동시 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓰기가 몰려 트랜잭션 시간을 넘김 — 잠시 뒤 다시 시도 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformMenusController_move: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MovePlatformMenuDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 자기 자신이나 하위 아래 · 3단계 초과(하위 높이 포함) · 다른 서비스나 없는 상위 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴를 찾을 수 없습니다. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓰기가 몰려 트랜잭션 시간을 넘김 — 잠시 뒤 다시 시도 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicHolidaysController_list: {
        parameters: {
            query: {
                /** @description 연도. 2000~2100(공식 휴일 테이블의 범위). */
                year: number;
                /** @description 월 1~12. 주면 그 달(캘린더), 없으면 그 해 전체(목록). 목록은 키를 빼고 보낸다 — 빈 값(`month=`)은 400. */
                month?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicHolidayListResponseDto"];
                };
            };
            /** @description 연도 2000~2100 · 월 1~12 밖 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodesController_list: {
        parameters: {
            query: {
                /**
                 * @description true 면 BP 마스터 계정이 있는 BP 만 — BP 선택 팝업이 BP 마스터 계정 목록과 같은 범위 · 건수를 보이려고 준다(2026-10-29 사용자 지정).
                 *     없거나 false 면 거르지 않는다 — BP 탭 · 상태 확인은 BP 마스터 계정이 없는 BP 도 찾아야 한다. 'true' · 'false' 밖의 값은 400.
                 */
                withMaster?: boolean;
                /** @description 상호 · BP코드 중 하나에 들어 있으면 나온다(대소문자 무시). 앞뒤 공백은 자른다. */
                keyword?: string;
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 사용할 수 없는 관리자 계정 · 직원 앱 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodesController_findStores: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bpCodeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpStoreListResponseDto"];
                };
            };
            /** @description 사용할 수 없는 관리자 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 삭제된 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodesController_findStoresVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bpCodeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpStoresVersionResponseDto"];
                };
            };
            /** @description 사용할 수 없는 관리자 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 삭제된 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpCodesController_findCodeItems: {
        parameters: {
            query?: {
                /**
                 * @description 쉼표로 구분한 그룹 코드. 없으면 공통코드 전체. 없거나 사용하지 않는 그룹은 빈 목록으로 온다.
                 *     빈 칸 · 형식이 틀린 코드가 하나라도 있거나 50개를 넘으면 400 이다.
                 */
                groups?: string;
            };
            header?: never;
            path: {
                bpCodeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CodeItemsResponseDto"];
                };
            };
            /** @description 사용할 수 없는 관리자 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 삭제된 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_list: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 20 · 50 · 100, 기본 20. */
                pageSize: 20 | 50 | 100;
                /** @description 검색 기준. 검색어와 함께 준다 — 검색어만 주면 BP 코드 · 아이디 · 이름 · 상호명 · 사업자등록번호 어디든 맞으면 나온다. */
                searchType?: "BP_CODE" | "LOGIN_ID_NAME" | "TRADE_NAME" | "BIZ_REGISTRATION_NUMBER";
                /** @description 검색어. 부분 일치, 대소문자 구분 없음. 탈퇴 BP 는 이름으로 찾히지 않는다. */
                keyword?: string;
                /** @description BP 상태. 여러 개는 `statuses=ACTIVE&statuses=INACTIVE` 또는 쉼표로. 주지 않으면 셋 다. */
                statuses?: ("ACTIVE" | "INACTIVE" | "WITHDRAWN")[];
                /** @description 사업자정보 인증. 인증 = 최종 인증일시가 있다. 주지 않으면 전체. */
                verification?: "VERIFIED" | "UNVERIFIED";
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpMasterListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBpMasterDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateBpMasterResponseDto"];
                };
            };
            /** @description 입력 형식 · 인증 토큰 만료 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 아이디 · 이메일 · 사업자등록번호 중복 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_excel: {
        parameters: {
            query?: {
                /** @description 검색 기준. 검색어와 함께 준다 — 검색어만 주면 BP 코드 · 아이디 · 이름 · 상호명 · 사업자등록번호 어디든 맞으면 나온다. */
                searchType?: "BP_CODE" | "LOGIN_ID_NAME" | "TRADE_NAME" | "BIZ_REGISTRATION_NUMBER";
                /** @description 검색어. 부분 일치, 대소문자 구분 없음. 탈퇴 BP 는 이름으로 찾히지 않는다. */
                keyword?: string;
                /** @description BP 상태. 여러 개는 `statuses=ACTIVE&statuses=INACTIVE` 또는 쉼표로. 주지 않으면 셋 다. */
                statuses?: ("ACTIVE" | "INACTIVE" | "WITHDRAWN")[];
                /** @description 사업자정보 인증. 인증 = 최종 인증일시가 있다. 주지 않으면 전체. */
                verification?: "VERIFIED" | "UNVERIFIED";
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description BP목록_YYYYMMDD.xlsx */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": string;
                    "application/json": string;
                };
            };
            /** @description 1만 건 이상 — 예약 생성(메일로 링크) */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": components["schemas"]["ExcelScheduledResponseDto"];
                    "application/json": components["schemas"]["ExcelScheduledResponseDto"];
                };
            };
            /** @description 검색 조건 형식 · 1만 건 이상인데 등록한 이메일이 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 화면의 엑셀을 만드는 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 1분 안에 다시 받음 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 1만 건 이상인데 메일(MAIL_*) · 관리자 웹 주소(ADMIN_WEB_URL) · 저장소(AWS_S3_*) 설정 중 하나가 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_loginIdAvailability: {
        parameters: {
            query: {
                /** @description 아이디. 영문 또는 영문 · 숫자 4~20자. */
                loginId: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginIdAvailabilityResponseDto"];
                };
            };
            /** @description 아이디 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_emailAvailability: {
        parameters: {
            query: {
                email: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminProfileEmailAvailabilityResponseDto"];
                };
            };
            /** @description 이메일 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_verifyBusiness: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyBpMasterBusinessDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpMasterBusinessVerificationResponseDto"];
                };
            };
            /** @description 입력 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자등록번호 중복 · 탈퇴한 BP */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 국세청 정보와 다름 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 시간당 한도(10건) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 진위확인 연동이 없거나 실패함 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpMasterDetailResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBpMasterDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 입력 형식 · 인증 토큰 만료 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일 · 사업자등록번호 중복 · 탈퇴한 BP */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 탈퇴 · 로그인 기록 · 하위 관리자 · 점포가 있어 지울 수 없음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_histories: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpMasterHistoryListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 탈퇴한 BP — 변경 이력을 볼 수 없다 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_changeStatus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeBpMasterStatusDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 탈퇴한 BP · 그 사이 다른 관리자가 상태를 바꿈 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpMastersController_resetPassword: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResetBpMasterPasswordResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 BP · 플랫폼 BP */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 탈퇴한 BP · 이메일 없음 · 그 사이 이메일이 바뀜 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메일 설정(MAIL_* · ADMIN_WEB_URL)이 없는 환경 — 아무것도 바꾸지 않는다 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ExcelDownloadsController_download: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExcelDownloadLinkResponseDto"];
                };
            };
            /** @description 그 화면의 조회 권한을 잃음 · 쓸 수 없는 계정 · 화면의 호출자 조건을 잃음(예: BP 목록은 플랫폼 계정) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없음 · 요청한 본인이 아님 · 바로 받기 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 아직 만드는 중 · 만들지 못함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내려받기 기한(24시간)이 지남 */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소(AWS_S3_*)가 설정되지 않음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TermsVersionsController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TermsVersionListResponseDto"];
                };
            };
        };
    };
    TermsVersionsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                termsTypeCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TermsVersionDetailResponseDto"];
                };
            };
            /** @description 없거나 사용하지 않는 유형, 시행 중인 버전 없음 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BulkExportsController_preview: {
        parameters: {
            query?: {
                /**
                 * @description 업무 범위 점포(범위 선택기). 반복(`storeIds=1&storeIds=2`)과 쉼표(`storeIds=1,2`)를 모두 받는다. 주지 않으면 관리하는
                 *     점포 전부. 관리하지 않는 점포가 섞이면 400
                 */
                storeIds?: number[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkExportPreviewResponseDto"];
                };
            };
            /** @description 관리하지 않는 점포가 섞임 · 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 조회 권한 없음 · BP 마스터 · 가맹마스터가 아님 · 직원 앱 토큰 · 쓸 수 없는 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BulkExportsController_list: {
        parameters: {
            query?: {
                /** @description 페이지, 1부터 */
                page?: number;
                /** @description 페이지당 건수, 기본 20 · 최대 100 */
                pageSize?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkExportListResponseDto"];
                };
            };
            /** @description 직원 정보 관리 조회 권한 없음 · BP 마스터 · 가맹마스터가 아님 · 직원 앱 토큰 · 쓸 수 없는 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BulkExportsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBulkExportDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkExportItemDto"];
                };
            };
            /** @description 관리하지 않는 점포가 섞임 · 담을 직원이 없음 · 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 조회 권한 없음 · BP 마스터 · 가맹마스터가 아님 · 직원 앱 토큰 · 쓸 수 없는 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 범위의 파일을 만드는 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장소(AWS_S3_*) 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BulkExportsController_download: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkExportDownloadResponseDto"];
                };
            };
            /** @description 직원 정보 관리 조회 권한 없음 · BP 마스터 · 가맹마스터가 아님 · 직원 앱 토큰 · 쓸 수 없는 계정 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없음 · 볼 수 없는 요청 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 아직 만드는 중 · 만들지 못함 · BP 마스터 파일에 담긴 직원의 본사 제공 동의나 가맹 점포 상태가 바뀜 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 받을 수 있는 기한(7일)이 지남 */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMembersController_findAll: {
        parameters: {
            query?: {
                /**
                 * @description 고른 점포(관리자웹 목록 점포 필터 · 상단 점포 범위). 쉼표로 1000개까지(`storeIds=1,2`). 같은 키 반복
                 *     (`storeIds=1&storeIds=2`)도 받지만 쿼리 파서가 키를 1000개까지만 읽어 넘치면 뒤 조건이 400 없이 빠지므로 많을 때는
                 *     쉼표로 보낸다(api #132 리뷰). 관리 범위 밖의 id 는 조용히 빠진다. 주지 않으면 관리 범위 전체.
                 *     빈 칸 · 숫자가 아닌 값 · 1..2147483647 밖의 값이 하나라도 있거나 1000개를 넘으면 400 이다.
                 */
                storeIds?: number[];
                /**
                 * @description 점포 유형(상단 점포 범위의 직영 · 가맹) — DIRECT · FRANCHISE, 반복하거나 쉼표로. 주면 그 유형 점포만이고 폐점 점포는
                 *     뺀다(TO-DO 목록 api #133 과 같다, 2026-10-22 재영 — 폐점 점포는 전체 · 점포를 골라 본다). storeIds 와 함께 주면 둘 다
                 *     맞는 점포만이다. 주지 않으면 유형 · 폐점 무관. 빈 값 · 모르는 값이 하나라도 있으면 400 이다.
                 */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /**
                 * @description 쉼표로 구분한 고용형태. 없으면 전체. 화면은 둘 다 고르면 보내지 않는다.
                 *     빈 값 · 모르는 값이 하나라도 있으면 400 이다.
                 */
                employmentType?: string;
                /**
                 * @description 쉼표로 구분한 가입·인증 상태(StaffJoinState). 고른 상태 중 하나라도 맞으면 나온다 — 화면의 묶음(초대 발송 =
                 *     INVITED,EXPIRED,REJECTED)을 그대로 보낸다. 없으면 전체. 빈 값 · 모르는 값이 하나라도 있으면 400 이다.
                 *     화면에서 하나도 고르지 않았으면 이 api 를 부르지 않고 0건으로 그린다.
                 */
                joinState?: string;
                /** @description 없으면 재직 · 퇴직 전체 */
                employmentStatus?: components["schemas"]["EmploymentStatus"];
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다(200건 × 100만 쪽) */
                page?: number;
                /** @description 페이지당 건수, 기본 20 · 최대 200 */
                pageSize?: number;
                /**
                 * @description 이름 부분 일치, 또는 하이픈을 뺀 휴대전화번호 부분 일치. 앞뒤 공백을 지우고 비면 없는 것으로 본다 — 빈
                 *     검색창을 보낸 것만으로 개인 칸 필터가 되어 본사 역할의 가맹 점포 행이 빠지면 안 된다.
                 */
                keyword?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMembersController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberDetailResponseDto"];
                };
            };
            /** @description 직원 정보 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberSummaryController_contract: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberContractSummaryResponseDto"];
                };
            };
            /** @description 직원 정보 관리 · 그 영역 메뉴의 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 서버에 암호화 키가 없음(신고 정보가 있을 때만) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberSummaryController_workSchedules: {
        parameters: {
            query?: {
                /** @description 볼 주의 아무 날짜(YYYY-MM-DD). 그 주 월요일로 맞춘다. 빼면 이번 주(한국 날짜) */
                weekStart?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberWeekScheduleResponseDto"];
                };
            };
            /** @description weekStart 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 · 그 영역 메뉴의 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberSummaryController_payslips: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberPayslipSummaryResponseDto"];
                };
            };
            /** @description 직원 정보 관리 · 그 영역 메뉴의 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberSummaryController_sendLogs: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberSendLogResponseDto"];
                };
            };
            /** @description 직원 정보 관리 · 그 영역 메뉴의 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberSummaryController_todos: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberTodoSummaryResponseDto"];
                };
            };
            /** @description 직원 정보 관리 · 그 영역 메뉴의 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberWorkSchedulesController_list: {
        parameters: {
            query?: {
                /**
                 * @description 기간. 빼면 이번 주. 근무일(시작 일시의 한국 날짜)로 자른다.
                 *     - `THIS_WEEK` — 오늘(한국 날짜)이 든 주의 월~일
                 *     - `LAST_4_WEEKS` — 오늘에서 28일 전 0시부터, 상한 없음(미래에 잡힌 근무 포함)
                 *     - `LAST_3_MONTHS` — 오늘에서 3개월 전 같은 날 0시부터, 상한 없음(미래 포함). 그 달에 같은 날이 없으면 그 달 말일(5월 31일 → 2월 28일)
                 *     - `LAST_1_YEAR` — 오늘에서 12개월 전 같은 날 0시부터, 상한 없음(미래 포함). 말일 보정은 3개월과 같다
                 *     - `ALL` — 날짜 조건 없음(생성일로부터 3년 지난 것은 파기 배치가 지운다)
                 */
                period?: components["schemas"]["StaffWorkSchedulePeriod"];
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다 */
                page?: number;
                /** @description 페이지당 건수 — 20 · 50 · 100, 기본 20 */
                pageSize?: 20 | 50 | 100;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffMemberWorkScheduleListResponseDto"];
                };
            };
            /** @description period · page · pageSize 오류 — 가드 403 뒤, ID 형식 404 보다 먼저 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 조회 권한 없음(가드, 쿼리 · ID 검사보다 먼저) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 근무스케줄 관리 조회 권한 없음(「조회 권한이 없습니다.」, ID 형식 404 뒤 · 범위 404 앞 — 형식이 맞는 어떤 ID 든 같은 403) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ID 형식 오류(쿼리 400 뒤 · 영역 403 앞) · 없는 직원 · 관리 범위 밖 · 가려지는 직원(영역 403 뒤) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RetirementController_preview: {
        parameters: {
            query: {
                /**
                 * @description 퇴직일(YYYY-MM-DD, 한국 날짜). 그날까지 재직이고 다음 날 0시에 퇴직이 확정된다. 오늘 이후이거나 최근
                 *     3개월 안의 지난 날짜만 받고, 입사일보다 앞설 수 없다.
                 */
                retiredDate: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RetirementPreviewResponseDto"];
                };
            };
            /** @description 퇴직일 형식 오류 · 3개월보다 오래됨 · 입사일보다 앞섬 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 전 · 이미 퇴직 · 이미 퇴직 예정(처리) / 퇴직 예정이 아님 · 퇴직일 당일 이후 · 같은 날짜(취소 · 변경) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RetirementController_changeDate: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RetirementDateDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 퇴직일 형식 오류 · 3개월보다 오래됨 · 입사일보다 앞섬 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 전 · 이미 퇴직 · 이미 퇴직 예정(처리) / 퇴직 예정이 아님 · 퇴직일 당일 이후 · 같은 날짜(취소 · 변경) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RetirementController_retire: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RetirementDateDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 퇴직일 형식 오류 · 3개월보다 오래됨 · 입사일보다 앞섬 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 전 · 이미 퇴직 · 이미 퇴직 예정(처리) / 퇴직 예정이 아님 · 퇴직일 당일 이후 · 같은 날짜(취소 · 변경) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RetirementController_cancel: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 퇴직일 형식 오류 · 3개월보다 오래됨 · 입사일보다 앞섬 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 전 · 이미 퇴직 · 이미 퇴직 예정(처리) / 퇴직 예정이 아님 · 퇴직일 당일 이후 · 같은 날짜(취소 · 변경) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffBirthDateController_correct: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BirthDateCorrectionDto"];
            };
        };
        responses: {
            /** @description 정정함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description BIRTH_DATE_INVALID(문자열 날짜의 형식 오류 · 없는 날짜 · 오늘(KST) 뒤 날짜(내일부터); birthDate 없음 · 문자열 아님 · 모르는 필드는 code 없는 ValidationPipe 400) / BIRTH_DATE_UNDER_AGE(한국 오늘 기준 만 19세 미만) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 정보 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원이거나 관리 범위 밖 · 본사 제공 동의로 가려진 직원 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description BIRTH_DATE_NOT_JOINED(계정 없음(가입 전) · 계정이 JOINED 아님(탈퇴 · 연결 보류)) / BIRTH_DATE_RETIRED(퇴직한 레코드 · 퇴직일이 지났는데 배치 전인 레코드. 퇴직 예정은 허용) / BIRTH_DATE_UNCHANGED(지금 값과 같음) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_findAll: {
        parameters: {
            query: {
                /** @description 급여 월(YYYY-MM). 급여 기간 시작일이 그 달인 명세서다 */
                month: string;
                /**
                 * @description 쉼표로 구분한 명세서 상태. 없으면 전체. 빈 값 · 모르는 값이 하나라도 있으면 400 이다. 상태 건수(statusCounts)는
                 *     이 값과 상관없이 그 달 전체로 센다.
                 */
                status?: string;
                /**
                 * @description 쉼표로 구분한 점포 ID(직원 목록과 같다). 관리 범위 밖의 ID 는 조용히 빠진다. 없으면 관리 범위 전체.
                 *     빈 칸 · 숫자가 아닌 값 · 1..2147483647 밖의 값이 하나라도 있거나 1000개를 넘으면 400 이다(직원 목록과 같다). 상태 건수도 이 점포로 센다.
                 */
                storeIds?: string;
                /**
                 * @description 쉼표로 구분한 점포 유형(상단 점포 범위의 직영 · 가맹) — DIRECT · FRANCHISE. 주면 그 유형 점포만이고 폐점 점포는 뺀다(직원
                 *     목록과 같다). storeIds 와 함께 주면 둘 다 맞는 점포만이다. 빈 값 · 모르는 값이 하나라도 있으면 400 이다.
                 */
                storeTypes?: string;
                /**
                 * @description true 면 검토 대기(확인하지 않은 검토 사유 — 출퇴근 누락 · 계약 만료 후 기록 · 기간 중 계약 변경 · 확인 필요 기록 포함 —
                 *     가 남았거나 공제 미입력인 작성 중 · 검토 중 명세서 — 공제 미입력은 공제 칸으로 판정, 운영 정책 v221 PAY-06)만(WHALEERP-234). 검토 대기는 상태가 아니라 분류다(2026-10-26). 주면 본사 역할에게 가린 줄은 빠진다 —
                 *     상태 필터와 같다. false · 없음은 거르지 않는다. 'true' · 'false' 밖의 값은 400.
                 */
                reviewPending?: boolean;
                /** @description 페이지당 건수 — 20 · 50 · 100, 기본 20 */
                pageSize?: 20 | 50 | 100;
                /**
                 * @description 직원명 부분 일치(대소문자 무시, `%` · `_` 는 글자 그대로). 앞뒤 공백을 지우고 비면 없는 것으로 본다. 주면 본사 역할에게
                 *     가린 줄(본사 제공 동의 없는 가맹 점포 직원)은 목록 · 상태 건수에서 빠진다 — 이름 검색으로 가린 직원이 드러나지 않게.
                 */
                staffName?: string;
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다 */
                page?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(month 누락 포함) · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePayslipDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipCreatedDto"];
                };
            };
            /** @description 본문 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원(본사 제공 동의 없음) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_EXISTS — 이 직원의 이 달 명세서가 이미 있음(본문 payslipId) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description NO_VALID_CONTRACT — 급여 기간에 유효한 근로계약 없음 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_summary: {
        parameters: {
            query: {
                /** @description 급여 월(YYYY-MM). 목록의 month 와 같다 — 급여 기간 시작일이 그 달인 명세서다 */
                month: string;
                /** @description 점포 ID */
                storeId: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipSummaryResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(month · storeId 누락 포함) · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_candidates: {
        parameters: {
            query: {
                month: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipCandidatesResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(month 누락 포함) · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_bulkCreate: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipMonthDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipBulkCreateResponseDto"];
                };
            };
            /** @description 본문 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_sendMany: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendPayslipsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipSendResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_additionalItems: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipAdditionalItemsResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_save: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SavePayslipDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 본문 형식 오류 · 정직원 3.3% · 같은 항목 두 번 · 붙일 수 없는 항목 · 합계 초과 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 작성 중 · 검토 중이 아님 · PAYSLIP_STALE — 그사이 누가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_previousValues: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipPreviousResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_recalculate: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipStatusChangeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 작성 중 · 검토 중이 아님 · PAYSLIP_STALE — 그사이 누가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_confirm: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipStatusChangeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 작성 중 · 검토 중이 아님 · PAYSLIP_STALE — 그사이 누가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PERIOD_NOT_ENDED — 확정할 수 있는 날(퇴직일 · 마지막 계약 종료일 · 급여 기간 마지막 날 가운데 가장 빠른 날의 다음 날, 그 계약의 보낸 갱신(임시저장 제외)이 기간 안에 시작하면 계약 종료일은 보지 않는다) 전 · DEDUCTION_MISSING — 비어 있는 공제(본문 items) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_cancelConfirmation: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipStatusChangeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 확정 · 발송 완료가 아님 · PAYSLIP_STALE — 그사이 누가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_send: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipStatusChangeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 보낼 수 있는 상태가 아님 · PAYSLIP_STALE — 그사이 누가 고쳤거나 보내는 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description NO_EMAIL — 직원 앱 계정 없음(가입 전 · 탈퇴) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description SEND_FAILED — 메일 발송 실패(확정 그대로, 발송 이력에 실패) */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description MAIL_NOT_CONFIGURED · APP_URL_NOT_CONFIGURED — 메일 설정 · 직원 앱 주소 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayslipsController_resend: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PayslipStatusChangeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리의 해당 권한(조회 · 등록 · 수정) 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PAYSLIP_STATUS_CONFLICT — 보낼 수 있는 상태가 아님 · PAYSLIP_STALE — 그사이 누가 고쳤거나 보내는 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description NO_EMAIL — 직원 앱 계정 없음(가입 전 · 탈퇴) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description SEND_FAILED — 메일 발송 실패 */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description MAIL_NOT_CONFIGURED · APP_URL_NOT_CONFIGURED — 메일 설정 · 직원 앱 주소 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyPayslipsController_findAll: {
        parameters: {
            query?: {
                /** @description 점포 ID. 명세서를 받은 적 없는 점포면 빈 목록이다 */
                storeId?: number;
                /** @description 연도 — 급여 기간 기준(2025년 12월 근무분을 2026년 1월에 받아도 2025년) */
                year?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyPayslipListResponseDto"];
                };
            };
            /** @description 직원 근무 앱 토큰이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyPayslipsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyPayslipDetailResponseDto"];
                };
            };
            /** @description 직원 근무 앱 토큰이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 남의 명세서 · 발송 전 · 보존 기간(3년) 지남 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyPayslipsController_pdf: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 급여명세서 PDF(attachment) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description 직원 근무 앱 토큰이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 남의 명세서 · 발송 전 · 보존 기간(3년) 지남 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 검토 중(PAYSLIP_CORRECTING) — 보낸 뒤 확정을 취소해 관리자가 고치는 중. 다시 보내면 내려받을 수 있다 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_list: {
        parameters: {
            query: {
                /** @description 여러 개면 `?status=SIGNED&status=REJECTED`. 없으면 전체 */
                status?: components["schemas"]["ContractStatus"][];
                /**
                 * @description 고른 점포(관리자웹 목록 점포 필터 · 상단 점포 범위, WHALEERP-133 · 326). 쉼표로 1000개까지(`storeIds=1,2`). 같은 키
                 *     반복(`storeIds=1&storeIds=2`)도 받지만 쿼리 파서가 키를 1000개까지만 읽어 넘치면 뒤 조건이 400 없이 빠지므로 많을 때는
                 *     쉼표로 보낸다(api #132 리뷰). 업무 범위 밖의 id 는 조용히 빠진다. 주지 않으면 업무 범위 전체.
                 */
                storeIds?: number[];
                /** @description 점포 유형(직영 · 가맹) — 상단 점포 범위의 직영 · 가맹. 주지 않으면 둘 다. */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 1부터 */
                page: number;
                pageSize: number;
                /** @description 점포 이름 일부 */
                storeName?: string;
                /** @description 직원 이름 일부 */
                staffMemberName?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContractListResponseDto"];
                };
            };
            /** @description 검색 조건 형식 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateContractDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedContractResponseDto"];
                };
            };
            /** @description 입력 오류 · 만 19세 미만 · 재계약 시작일이 직전 계약 시작일 다음 날보다 이름 · 종이 계약 등록이 아닌데 잘못 올린 계약 바로잡기 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 작성 권한 없음 · 대체하는데 권한 없음(진행 중 계약은 수정, 임시저장은 삭제 — 409 로 묻기 전에 403) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 폐점이거나 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(같은 점포 진행 중 계약 — contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP(다른 점포 근무 시간 겹침, 초안 저장만) · 대체할 계약을 다른 요청이 먼저 고침 · SEND_PHONE_NOT_MOBILE(가입 초대인데 휴대폰 번호가 아님) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장했지만 가입 초대 알림톡이 실패(본문 contractId): SEND_FAILED(나가지 않아 보내기 직전으로 되돌림 — status, 새 계약 · 임시저장에서 넘긴 것은 임시저장) · SEND_UNCONFIRMED(접수 여부 모름 — 상세를 다시 읽을 것) */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 주소 STAFF_APP_URL 없음, 대체 문자 발신번호 BIZPPURIO_SMS_FROM 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_storeOptions: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터. */
                page: number;
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreOptionListResponseDto"];
                };
            };
            /** @description 검색 조건 형식 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_createPaper: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** @description CreateContractDto 의 JSON. contractMethod 는 PAPER, isTemporarySave 는 넣지 않는다 */
                    data: string;
                    /**
                     * Format: binary
                     * @description 당사자가 모두 날인한 근로계약서(PDF · JPG · PNG, 10MB)
                     */
                    employmentContract: string;
                    /**
                     * Format: binary
                     * @description 따로 날인한 임금계약서(선택)
                     */
                    wageContract?: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedContractResponseDto"];
                };
            };
            /** @description 입력 오류 · 만 19세 미만 · 근로계약서 날인본 없음 · 파일 종류 · 크기 · 개수 · 재계약 시작일이 직전 계약 시작일 다음 날보다 이름 · 잘못 올린 계약 바로잡기를 재계약과 함께 보냄 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 작성 권한 없음 · 대체하는데 권한 없음(진행 중 계약은 수정, 임시저장은 삭제 — 409 로 묻기 전에 403) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 폐점이거나 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 대체할 계약을 다른 요청이 먼저 고침 · SIGNED_CONTRACT_OVERLAP(종이 계약 — 기간이 겹치는 체결 완료 계약, contracts 목록. 잘못 올린 계약이면 correctSignedContracts 와 그 id 를 모두 replaceContractIds 로) · RENEWAL_SIGNED_OVERLAP(종이 재계약이 직전 계약이 아닌 체결 완료와 겹침 — 바로잡기 없이 막음) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않음 · 저장소 오류 · 저장이 몰려 시간 초과(잠시 뒤 다시) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_minimumWage: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MinimumWageResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContractDetailDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateContractDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedContractResponseDto"];
                };
            };
            /** @description 입력 오류 · 만 19세 미만 · 수정 요청인데 임시저장 · 근무지 변경 · 가입한 직원의 번호 변경 · 재계약 시작일이 직전 계약 시작일 다음 날보다 이름 · 종이 계약 등록이 아닌데 잘못 올린 계약 바로잡기 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음(임시저장 이어 쓰기는 작성, 수정 요청은 수정) · 대체하는데 권한 없음(진행 중 계약은 수정, 임시저장은 삭제 — 409 로 묻기 전에 403) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 근무지 점포가 없거나 폐점 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 임시저장 · 수정 요청이 아님 · 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 다른 요청이 먼저 고침 · SEND_PHONE_NOT_MOBILE(가입 초대인데 휴대폰 번호가 아님) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장했지만 가입 초대 알림톡이 실패(본문 contractId): SEND_FAILED(나가지 않아 보내기 직전으로 되돌림 — status, 새 계약 · 임시저장에서 넘긴 것은 임시저장) · SEND_UNCONFIRMED(접수 여부 모름 — 상세를 다시 읽을 것) */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 주소 STAFF_APP_URL 없음, 대체 문자 발신번호 BIZPPURIO_SMS_FROM 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 지웠다 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 임시저장이 아님 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_updateWorker: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkerDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedContractResponseDto"];
                };
            };
            /** @description 입력 오류 · 만 19세 미만 · 가입한 직원의 번호 변경 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 수정 권한 없음 · 새 번호의 같은 점포 임시저장을 대체하는데 삭제 권한 없음(409 로 묻기 전에 403) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(발송 대기 · 서명 대기 · 수정 요청이 아님) · 새 번호로 이 점포에 재직 중 · CONTRACT_IN_PROGRESS(새 번호의 같은 점포 진행 중 계약 — replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 다른 요청이 먼저 고침 · SEND_PHONE_NOT_MOBILE(가입 초대인데 휴대폰 번호가 아님) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장했지만 가입 초대 알림톡이 실패(본문 contractId): SEND_FAILED(나가지 않아 보내기 직전으로 되돌림 — status, 새 계약 · 임시저장에서 넘긴 것은 임시저장) · SEND_UNCONFIRMED(접수 여부 모름 — 상세를 다시 읽을 것) */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 주소 STAFF_APP_URL 없음, 대체 문자 발신번호 BIZPPURIO_SMS_FROM 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_updatePaper: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** @description CreateContractDto 의 JSON. contractMethod 는 PAPER, isTemporarySave 는 넣지 않는다 */
                    data: string;
                    /**
                     * Format: binary
                     * @description 당사자가 모두 날인한 근로계약서(PDF · JPG · PNG, 10MB)
                     */
                    employmentContract: string;
                    /**
                     * Format: binary
                     * @description 따로 날인한 임금계약서(선택)
                     */
                    wageContract?: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedContractResponseDto"];
                };
            };
            /** @description 입력 오류 · 만 19세 미만 · 근로계약서 날인본 없음 · 파일 종류 · 크기 · 개수 · 재계약 시작일이 직전 계약 시작일 다음 날보다 이름 · 잘못 올린 계약 바로잡기를 재계약과 함께 보냄 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음(임시저장 이어 쓰기는 작성 — 수정 요청은 종이 계약으로 바꿀 수 없어 400) · 대체하는데 권한 없음(진행 중 계약은 수정, 임시저장은 삭제 — 409 로 묻기 전에 403) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 근무지 점포가 없거나 폐점 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 임시저장이 아님 · 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 다른 요청이 먼저 고침 · SIGNED_CONTRACT_OVERLAP(종이 계약 — 기간이 겹치는 체결 완료 계약, contracts 목록. 잘못 올린 계약이면 correctSignedContracts 와 그 id 를 모두 replaceContractIds 로) · RENEWAL_SIGNED_OVERLAP(종이 재계약이 직전 계약이 아닌 체결 완료와 겹침 — 바로잡기 없이 막음) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않음 · 저장소 오류 · 저장이 몰려 시간 초과(잠시 뒤 다시) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractsController_documentDownloadUrl: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
                contractDocumentId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 파일 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractSendController_send: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SendContractDto"];
            };
        };
        responses: {
            /** @description status — 가입 초대는 그대로 PENDING_SEND · PENDING_SIGNATURE, 가입한 직원은 PENDING_SIGNATURE, 소속 추가 확인 요청은 PENDING_SEND(signDeadlineAt null — 수락부터 30일). 거부 · 만료(WHALEERP-153)는 가입한 직원이면 PENDING_SIGNATURE, 그 밖에는 PENDING_SEND 로 되살린다. 가입한 직원은 알림함 알림(앱 푸시는 #261 전까지 나가지 않음) — 알림 템플릿을 쓸 수 없거나 탈퇴 계정이면 알림 없이 기한만 새로 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SendContractResponseDto"];
                };
            };
            /** @description 본문 형식(expectedStatus · expectedSentAt) · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(발송 대기 · 서명 대기 · 거부 · 만료가 아님, 또는 본문 expectedStatus · expectedSentAt 이 지금 계약과 다름 — 그사이 거부 · 만료되었거나 다른 탭에서 먼저 보냄) · REOPEN_BLOCKED(거부 · 만료를 되살릴 수 없음 — 퇴직 · 퇴직일 있음, 폐점 · 삭제 점포, 같은 점포 · 번호의 다른 진행 중 계약, 계약 기간이 끝남, 기간이 겹치거나 더 늦게 시작한 다른 체결 완료, 같은 직전 계약의 다른 재계약. message 에 까닭) · WORK_TIME_OVERLAP(거부 · 만료를 되살리면 다른 점포 근무 시간과 겹침) · SEND_PHONE_NOT_MOBILE(휴대폰 번호가 아님) · 코드 없음 「이 점포에 이미 재직 중인 직원입니다.」(가입 전 레코드인데 그 번호의 계정이 이 점포에 재직 중) · 다른 요청이 먼저 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 초대 · 소속 추가 확인 요청 알림톡일 때만 — SEND_FAILED(나가지 않음 — 거절 · 토큰 단계 · 요청 전 오류, 되돌렸고 다시 보낼 수 있음, 본문 contractId · status) · SEND_UNCONFIRMED(접수 여부 모름 또는 되돌리기 실패 — 상세를 다시 읽을 것). 소속 추가 확인 요청 메일 실패는 오류가 아니다 */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 가입 초대 · 소속 추가 확인 요청 알림톡일 때만 — 직원 앱 주소(STAFF_APP_URL)가 없음 · 대체 문자 발신번호(BIZPPURIO_SMS_FROM)가 없음 · 그 알림톡 템플릿이 없거나 꺼짐 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContractSendController_end: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description { contractId, status: ENDED } */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근로계약 관리 수정 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(발송 대기가 아님 — 지금 상태를 싣는다) · 다른 요청이 먼저 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractsController_sign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /**
                     * Format: binary
                     * @description 필기 서명 이미지(PNG, 1MB)
                     */
                    signature: string;
                    /**
                     * Format: date-time
                     * @description 직원이 본 계약의 발송 일시(시간대 표기 필수) — 다르면 409 CONTRACT_RESENT
                     */
                    sentAt: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SignedMyContractResponseDto"];
                };
            };
            /** @description 서명 이미지 없음 · PNG 가 아님 · 1MB 넘음 · 읽을 수 없는 이미지 · 발송 일시 없음 · 형식 · 시간대 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 계약이 아님 — 없는 id · 남의 계약 · 임시저장 · 소속 추가 확인을 기다리는 계약(후보 계정만). 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(서명 대기가 아님 — 본문 status 에 지금 상태, 이미 처리했으면 그 결과) · SIGN_DEADLINE_PASSED(날인 기한이 지남) · STAFF_RETIRED(퇴직했거나 퇴직일이 지남) · IDENTITY_MISMATCH(mismatches: name · phone · birthDate · gender · isForeigner) · CONTRACT_RESENT(그사이 다시 발송됨) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 경로마다 계정당 10분에 20번(날인 · 거부 · 수정 요청을 따로 센다) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않음 · 저장소 오류 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractsController_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyContractActionResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 계약이 아님 — 없는 id · 남의 계약 · 임시저장 · 소속 추가 확인을 기다리는 계약(후보 계정만). 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(서명 대기가 아님 — 본문 status 에 지금 상태, 이미 처리했으면 그 결과) · SIGN_DEADLINE_PASSED(날인 기한이 지남) · STAFF_RETIRED(퇴직했거나 퇴직일이 지남) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 경로마다 계정당 10분에 20번(날인 · 거부 · 수정 요청을 따로 센다) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractsController_requestCorrection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RequestMyContractCorrectionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyContractActionResponseDto"];
                };
            };
            /** @description 사유 없음 · 비었음(앞뒤 공백을 지운 뒤) · 100자 넘음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 계약이 아님 — 없는 id · 남의 계약 · 임시저장 · 소속 추가 확인을 기다리는 계약(후보 계정만). 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(서명 대기가 아님 — 본문 status 에 지금 상태, 이미 처리했으면 그 결과) · SIGN_DEADLINE_PASSED(날인 기한이 지남) · STAFF_RETIRED(퇴직했거나 퇴직일이 지남) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 경로마다 계정당 10분에 20번(날인 · 거부 · 수정 요청을 따로 센다) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractViewsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyContractListResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractViewsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyContractDetailDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 계약이 아님 — 없는 id · 남의 계약 · 임시저장 · 발송 대기 · 소속 확인 대기 계약(후보 계정만). 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyContractDocumentsController_downloadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contractId: number;
                contractDocumentId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 계약이 아님(상세와 같은 본문) · 그 계약의 파일이 아님 · 상세 documents 에 없는 파일(직원 필기 서명) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT — 처리 완료본(SIGNED_COPY)인데 체결된 계약이 아님(서명 대기 · 수정 요청 · 거부 · 만료, 체결 완료를 거치지 않은 종료). 본문 status 에 지금 상태 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_findAll: {
        parameters: {
            query?: {
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다 */
                page?: number;
                /** @description 페이지당 건수, 기본 20 · 최대 200 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_remove: {
        parameters: {
            query: {
                /** @description 빈 칸 · 숫자가 아닌 값 · 1..2147483647 밖의 값이 있거나 200개를 넘으면 400 이다 */
                ids: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ids 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_readAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationReadAllResponseDto"];
                };
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationItemDto"];
                };
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 알림이 아니거나 지운 알림 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationsController_list: {
        parameters: {
            query?: {
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다 */
                page?: number;
                /** @description 페이지당 건수, 기본 20 · 최대 200 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyNotificationListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationsController_readAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationReadAllResponseDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationsController_read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyNotificationItemDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 알림이 아니거나 지웠거나 14일이 지났다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationsController_unread: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyNotificationItemDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 알림이 아니거나 지웠거나 14일이 지났다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationPreferencesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyNotificationPreferenceListResponseDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyNotificationPreferencesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category: components["schemas"]["PreferenceCategory"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMyNotificationPreferenceDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyNotificationPreferenceDto"];
                };
            };
            /** @description 모르는 묶음 · isEnabled 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_list: {
        parameters: {
            query: {
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 또는 쉼표로, 1000개까지. 주지 않으면 볼 수 있는 점포 전체. */
                storeIds?: number[];
                /** @description 점포명 · 점포코드에 들어 있으면 나온다. 점포 다중 선택의 후보를 찾는 데 쓴다. */
                keyword?: string;
                /** @description 사업자등록번호. 하이픈을 빼고 숫자만 견주며, 일부만 넣어도 찾는다. */
                bizRegistrationNumber?: string;
                /** @description 점포 상태. 주지 않으면 미운영 · 운영(폐점은 고를 때만 나온다). */
                statuses?: ("NOT_OPERATING" | "OPERATING" | "CLOSED")[];
                /** @description 점포 유형. 주지 않으면 둘 다. */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 쪽 번호. 1부터. */
                page: number;
                /** @description 한 쪽 건수. 20 · 50 · 100, 기본 20. */
                pageSize: 20 | 50 | 100;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreListResponseDto"];
                };
            };
            /** @description 검색 조건 형식 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateStoreDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateStoreResponseDto"];
                };
            };
            /** @description 입력 형식 · 위도 · 경도 중 하나만 있음 · 플랫폼 계정의 X-Bp-Code-Id 누락 · 본문 bpCodeId 가 대상 BP 와 다름 · 대상 BP 를 그사이 지움 · 국세청 정보와 다름 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 소속 BP 미사용 · 사업자등록번호 중복 · 점포코드 채번이 겹침 · 점포코드(6자리)를 다 씀 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 인증을 보냈는데 관리자의 국세청 호출이 시간당 10번을 넘음 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 인증을 보냈는데 진위확인 연동이 없거나 실패함 · 등록이 몰려 시간을 넘김 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_excel: {
        parameters: {
            query?: {
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 또는 쉼표로, 1000개까지. 주지 않으면 볼 수 있는 점포 전체. */
                storeIds?: number[];
                /** @description 점포명 · 점포코드에 들어 있으면 나온다. 점포 다중 선택의 후보를 찾는 데 쓴다. */
                keyword?: string;
                /** @description 사업자등록번호. 하이픈을 빼고 숫자만 견주며, 일부만 넣어도 찾는다. */
                bizRegistrationNumber?: string;
                /** @description 점포 상태. 주지 않으면 미운영 · 운영(폐점은 고를 때만 나온다). */
                statuses?: ("NOT_OPERATING" | "OPERATING" | "CLOSED")[];
                /** @description 점포 유형. 주지 않으면 둘 다. */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 점포목록_YYYYMMDD.xlsx */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": string;
                    "application/json": string;
                };
            };
            /** @description 1만 건 이상 — 예약 생성(메일로 링크) */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": components["schemas"]["ExcelScheduledResponseDto"];
                    "application/json": components["schemas"]["ExcelScheduledResponseDto"];
                };
            };
            /** @description 검색 조건 형식 · 1만 건 이상인데 등록한 이메일이 없음 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 화면의 엑셀을 만드는 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 1분 안에 다시 받음 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 1만 건 이상인데 메일(MAIL_*) · 관리자 웹 주소(ADMIN_WEB_URL) · 저장소(AWS_S3_*) 설정 중 하나가 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_verifyBusiness: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyStoreBusinessDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreBusinessVerificationResponseDto"];
                };
            };
            /** @description 입력 형식 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description IP · 계정의 시간당 한도(10건) */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 진위확인 연동이 없거나 실패함 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_detail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateStoreDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 입력 형식 · 위도 · 경도 중 하나만 있음 · 바꿀 수 없는 상태 전환 · 운영으로 바꿀 때 운영 조건(인증 · 좌표) 미충족 · 운영 중인 점포의 좌표 삭제 · 국세청 정보와 다름 · 재인증 번호 불일치 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 동시 수정 · 폐점한 점포 · 소속 BP 미사용 · 진행 중인 근로계약(폐점) · 사업자등록번호 중복 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 인증을 보냈는데 관리자의 국세청 호출이 시간당 10번을 넘음 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 사업자 인증을 보냈는데 진위확인 연동이 없거나 실패함 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 미운영이 아님 · 진행 중인 근로계약 · 소속 BP 미사용 · 그 사이 상태가 바뀜 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_histories: {
        parameters: {
            query: {
                page: number;
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreHistoryListResponseDto"];
                };
            };
            /** @description 쪽 형식 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_transitionCheck: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreTransitionCheckResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_putImage: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreImageResponseDto"];
                };
            };
            /** @description 파일 없음 · JPG · PNG 가 아님 · 5MB 초과 · 파일 2개 이상 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 폐점한 점포 · 소속 BP 미사용 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소가 설정되지 않았거나 올리기에 실패함 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_removeImage: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포(대상 BP 밖 포함) · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 폐점한 점포 · 소속 BP 미사용 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_list: {
        parameters: {
            query?: {
                /** @description 게시 상태로 거른다. 여러 개면 `?status=DRAFT&status=PUBLISHED`. 없으면 전부. */
                status?: components["schemas"]["PostStatus"][];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePostDto"] & {
                    /** @description 첨부파일 — JPG · PNG · PDF, 5개 · 파일당 10MB */
                    files?: string[];
                };
                "multipart/form-data": components["schemas"]["CreatePostDto"] & {
                    /** @description 첨부파일 — JPG · PNG · PDF, 5개 · 파일당 10MB */
                    files?: string[];
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 노출 대상 없이 게시 · 게시 종료일이 시작일보다 앞섬 · 공지사항 유형 없음 · 파일 종류 · 크기 · 개수 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부가 있는데 저장소가 설정되지 않음 · 저장소 오류 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 공지사항 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePostDto"] & {
                    /** @description 첨부파일 — JPG · PNG · PDF, 5개 · 파일당 10MB */
                    files?: string[];
                };
                "multipart/form-data": components["schemas"]["UpdatePostDto"] & {
                    /** @description 첨부파일 — JPG · PNG · PDF, 5개 · 파일당 10MB */
                    files?: string[];
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 등록과 같음 · 그 공지의 첨부가 아닌 ID 를 뺌 · 합쳐 5개 넘음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 공지사항 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 관리자가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부가 있는데 저장소가 설정되지 않음 · 저장소 오류 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 공지사항 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 지운 공지사항 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformNoticesController_attachmentDownloadUrl: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
                postAttachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 공지사항 · 그 글의 첨부가 아님 · 뺀 첨부 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformFaqsController_list: {
        parameters: {
            query?: {
                /** @description 게시 상태로 거른다. 여러 개면 `?status=DRAFT&status=PUBLISHED`. 없으면 전부. */
                status?: components["schemas"]["PostStatus"][];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformFaqsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePostDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 노출 대상 없이 게시 · 게시 종료일이 시작일보다 앞섬 · FAQ 카테고리 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformFaqsController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 FAQ */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformFaqsController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePostDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 등록과 같음 · 첨부 ID 를 뺌 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 FAQ */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 관리자가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformFaqsController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 FAQ */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 지운 FAQ */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportNoticesController_list: {
        parameters: {
            query?: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. 여러 개면 `?noticeType=GENERAL&noticeType=MAINTENANCE`. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"][];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. 여러 개면 `?faqCategoryCode=A&faqCategoryCode=B`, 50개까지. */
                faqCategoryCode?: string[];
                /** @description 제목(FAQ 는 제목 또는 본문)에 든 글자로 찾는다. 대소문자는 가리지 않는다. */
                keyword?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishedPostListResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportNoticesController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportPostResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없음 · 비공개 · 지움 · 게시 기간 밖 · 노출 대상 아님 · FAQ */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportNoticesController_attachmentDownloadUrl: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                postId: string;
                postAttachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 글이 보이지 않음(상세와 같음) · 그 글의 첨부가 아님 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportFaqsController_list: {
        parameters: {
            query?: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. 여러 개면 `?noticeType=GENERAL&noticeType=MAINTENANCE`. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"][];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. 여러 개면 `?faqCategoryCode=A&faqCategoryCode=B`, 50개까지. */
                faqCategoryCode?: string[];
                /** @description 제목(FAQ 는 제목 또는 본문)에 든 글자로 찾는다. 대소문자는 가리지 않는다. */
                keyword?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishedPostListResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicNoticesController_list: {
        parameters: {
            query?: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. 여러 개면 `?noticeType=GENERAL&noticeType=MAINTENANCE`. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"][];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. 여러 개면 `?faqCategoryCode=A&faqCategoryCode=B`, 50개까지. */
                faqCategoryCode?: string[];
                /** @description 제목(FAQ 는 제목 또는 본문)에 든 글자로 찾는다. 대소문자는 가리지 않는다. */
                keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishedPostListResponseDto"];
                };
            };
        };
    };
    PublicNoticesController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishedPostDetailResponseDto"];
                };
            };
            /** @description 없음 · 비공개 · 지움 · 게시 기간 밖 · 비회원 대상 아님 · FAQ */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicNoticesController_attachmentDownloadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                postId: string;
                postAttachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 글이 비회원에게 보이지 않음(상세와 같음) · 그 글의 첨부가 아님 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicFaqsController_list: {
        parameters: {
            query?: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. 여러 개면 `?noticeType=GENERAL&noticeType=MAINTENANCE`. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"][];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. 여러 개면 `?faqCategoryCode=A&faqCategoryCode=B`, 50개까지. */
                faqCategoryCode?: string[];
                /** @description 제목(FAQ 는 제목 또는 본문)에 든 글자로 찾는다. 대소문자는 가리지 않는다. */
                keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishedPostListResponseDto"];
                };
            };
        };
    };
    NotificationTemplatesController_list: {
        parameters: {
            query: {
                channel: components["schemas"]["NotificationTemplateChannel"];
                page?: number;
                /** @description 기본 20 · 최대 200 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationTemplatesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTemplateDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateDetailDto"];
                };
            };
            /** @description 채널별 필수 칸 · #{변수} · 글자 수 검사 — message 에 고칠 문장 목록 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 템플릿 코드가 겹침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationTemplatesController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateDetailDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 템플릿 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationTemplatesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTemplateDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateDetailDto"];
                };
            };
            /** @description 등록과 같음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 템플릿 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 고침 · 템플릿 코드가 겹침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationTemplatesController_restore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TemplateVersionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateDetailDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 템플릿 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 등록한 템플릿이라 기본 문구가 없음 · 그사이 다른 운영자가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationTemplatesController_setActive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetTemplateActiveDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TemplateDetailDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 템플릿 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateLeadDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 IP 의 시간당 한도, 또는 같은 전화번호·이메일로 10분 안에 다시 접수 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_list: {
        parameters: {
            query: {
                /** @description 답변 대기(접수 · 처리중) · 답변 완료. 둘 다면 `?answerStatus=WAITING&answerStatus=ANSWERED`. */
                answerStatus?: components["schemas"]["InquiryAnswerStatus"][];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 지움 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 상담을 마친 도입문의 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_startProcessing: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 처리중이거나 답변한 도입문의 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_reply: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveLeadReplyDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 저장함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_resendReplyMail: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadReplyMailResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 답변완료가 아니거나, 1분 안에 이미 보냄 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메일 발송 설정(MAIL_*) 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LeadsAdminController_saveInternalMemo: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                leadId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveInternalMemoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LeadStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 도입문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 저장함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_list: {
        parameters: {
            query: {
                /** @description 답변 대기(접수 · 처리중) · 답변 완료. 둘 다면 `?answerStatus=WAITING&answerStatus=ANSWERED`. */
                answerStatus?: components["schemas"]["InquiryAnswerStatus"][];
                /** @description 제목에 들어 있으면 나온다. */
                title?: string;
                /** @description 보낸 곳 — BP 이름 · 점포 이름 · 보낸 사람 이름 중 하나에 들어 있으면 나온다. */
                sender?: string;
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InquiryListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InquiryResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_attachmentDownloadUrl: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
                inquiryAttachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의이거나 그 문의의 첨부가 아님 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_startProcessing: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InquiryStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 처리중이거나 답변한 문의 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_reply: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInquiryReplyDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InquiryStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 저장함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InquiriesController_saveInternalMemo: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveInternalMemoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InquiryStateResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 · 그 메뉴의 그 동작 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그사이 다른 운영자가 저장함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportInquiriesController_list: {
        parameters: {
            query: {
                /**
                 * @description 답변 상태 — 접수 · 처리중 · 답변완료. 고객지원 화면은 「답변 대기 · 처리 중 · 답변 완료」 탭을 따로 두어(front
                 *     목업 S-ITFILU) 「답변 대기」가 접수 하나다 — 접수 · 처리중을 합친 커뮤니티 관리의 `answerStatus` 와 다르다.
                 *     여러 개면 `?status=RECEIVED&status=IN_PROGRESS`.
                 */
                status?: components["schemas"]["InquiryStatus"][];
                /** @description 제목에 들어 있으면 나온다. */
                title?: string;
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportInquiryListResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 문의하기 메뉴 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportInquiriesController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** @example STAFF_LABOR */
                    inquiryCategoryCode: string;
                    title: string;
                    body: string;
                    files?: string[];
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedSupportInquiryResponseDto"];
                };
            };
            /** @description 입력 오류 · 사용 중이 아닌 문의 유형 · 파일 종류 · 크기 · 개수 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 문의하기 메뉴 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 5분 안에 제목 · 내용이 같은 문의를 이미 등록함 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부가 있는데 저장소가 설정되지 않음 · 저장소 오류 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportInquiriesController_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportInquiryResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 문의하기 메뉴 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의이거나 남의 문의 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportInquiriesController_attachmentDownloadUrl: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                inquiryId: string;
                inquiryAttachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadUrlResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 문의하기 메뉴 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 문의 · 남의 문의 · 그 문의의 첨부가 아님 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 첨부파일 저장소 설정 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_list: {
        parameters: {
            query?: {
                /** @description 1부터 */
                page?: number;
                pageSize?: number;
                /** @description 여러 개면 `?status=PENDING&status=IN_PROGRESS`. 없으면 전체 */
                status?: components["schemas"]["TodoStatus"][];
                /** @description 점포 유형(상단 범위 직영 · 가맹) — DIRECT · FRANCHISE. 폐점 점포는 뺀다. 여러 개는 반복하거나 쉼표로. 주지 않으면 둘 다(폐점 포함) */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 담당 — 개인 · 근무지 전체 */
                assigneeType?: components["schemas"]["TodoAssigneeType"];
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로(섞으면 400), 1000개까지. 주지 않으면 업무 범위 전체 */
                storeIds?: number[];
                /** @description 이 직원 레코드에 배정된 것 */
                staffMemberId?: number;
                /** @description true · false. 없으면 전체 */
                isUrgent?: boolean;
                /** @description 근무지 점포 */
                storeId?: number;
                /** @description 수행 예정 날짜 시작(그날 포함) YYYY-MM-DD */
                dueDateFrom?: string;
                /** @description 수행 예정 날짜 끝(그날 포함) YYYY-MM-DD */
                dueDateTo?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTodoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedTodoResponseDto"];
                };
            };
            /** @description 입력 오류 · 지난 날짜 · 배정 대상과 수행 방식이 맞지 않음 · 퇴직했거나 체결 완료 계약이 없거나 가입 전이거나 다른 근무지 직원 · 그런 재직 직원 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_assignableStaff: {
        parameters: {
            query: {
                /** @description 근무지 점포. 업무 범위 밖이면 404 */
                storeId: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssignableStaffResponseDto"];
                };
            };
            /** @description storeId 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                todoId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoDetailDto"];
                };
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 TO-DO · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                todoId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoDeleteResponseDto"];
                };
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 TO-DO · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지울 대기 TO-DO 가 없음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                todoId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTodoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoDetailDto"];
                };
            };
            /** @description 입력 오류 · 지난 날짜 · 바꿀 수 없는 칸 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 TO-DO · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TodosController_changeStatus: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                todoId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeTodoStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoItemDto"];
                };
            };
            /** @description TO-DO 리스트 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 TO-DO · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TODO_ALREADY_DONE · TODO_STATUS_CONFLICT(그사이 상태가 바뀜) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffMemberTodosController_list: {
        parameters: {
            query?: {
                /** @description 1부터 */
                page?: number;
                pageSize?: number;
                /** @description 여러 개면 `?status=PENDING&status=IN_PROGRESS`. 없으면 전체 */
                status?: components["schemas"]["TodoStatus"][];
                /** @description 근무지 점포 */
                storeId?: number;
                /** @description 수행 예정 날짜 시작(그날 포함) YYYY-MM-DD */
                dueDateFrom?: string;
                /** @description 수행 예정 날짜 끝(그날 포함) YYYY-MM-DD */
                dueDateTo?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoItemListResponseDto"];
                };
            };
            /** @description 직원 정보 관리 · TO-DO 관리 조회 권한 없음(TO-DO 관리는 「조회 권한이 없습니다.」) · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원 · ID 형식 오류 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyTodosController_list: {
        parameters: {
            query?: {
                /** @description 1부터 */
                page?: number;
                pageSize?: number;
                /** @description 여러 개면 `?status=PENDING&status=IN_PROGRESS`. 없으면 전체 */
                status?: components["schemas"]["TodoStatus"][];
                /** @description 근무지 점포 */
                storeId?: number;
                /** @description 수행 예정 날짜 시작(그날 포함) YYYY-MM-DD */
                dueDateFrom?: string;
                /** @description 수행 예정 날짜 끝(그날 포함) YYYY-MM-DD */
                dueDateTo?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoItemListResponseDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyTodosController_changeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                todoId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeTodoStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TodoItemDto"];
                };
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내게 배정되지 않았거나 지운 TO-DO · 내 직원 레코드가 대상 조건(체결 완료 계약 · 가입 · 퇴직) 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description TODO_ALREADY_DONE(다른 직원이 먼저 완료 — performer 에 그 직원, 또는 본인이 완료한 것이 아닌 한 명 수행을 다시 열려 함) · TODO_STATUS_CONFLICT(그사이 상태가 바뀜) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_list: {
        parameters: {
            query: {
                /** @description 근무지 점포. 업무 범위 밖이면 404 */
                storeId: number;
                /** @description 시작 근무일 YYYY-MM-DD */
                from: string;
                /** @description 끝 근무일 YYYY-MM-DD(포함). 시작부터 42일 이하 — 월간 달력 6주 */
                to: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · 기간이 42일 넘음 · 끝이 시작보다 앞 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkScheduleDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleDto"];
                };
            };
            /** @description 입력 오류 · 24시간짜리 · 휴게가 근무시간 이상 · WORK_SCHEDULE_NO_CONTRACT(근무일에 체결 완료 계약 없음) · WORK_SCHEDULE_AFTER_RETIREMENT(퇴직일 뒤) · WORK_SCHEDULE_NOT_JOINED(가입 전) · WORK_SCHEDULE_HIDDEN(본사에게 가려지는 가맹 직원) · WORK_SCHEDULE_STORE_CLOSED(폐점 점포 — 등록만, 수정은 받는다) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원이 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description WORK_SCHEDULE_OVERLAP(같은 직원 근무스케줄과 겹침) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_histories: {
        parameters: {
            query: {
                /** @description 페이지당 건수 — 20 · 50 · 100, 기본 20 */
                pageSize?: 20 | 50 | 100;
                /** @description 근무지 점포. 업무 범위 밖이면 404 */
                storeId: number;
                /** @description 변경 일시의 한국 날짜 YYYY-MM-DD 부터(포함) */
                from?: string;
                /** @description 변경 일시의 한국 날짜 YYYY-MM-DD 까지(포함) */
                to?: string;
                /** @description 직원 레코드로 거른다. 그 점포 직원이 아니거나 본사에게 가려진 직원이면 404 */
                staffMemberId?: number;
                /** @description 페이지, 1부터. 상한은 OFFSET 이 DB 정수 범위를 넘어 500 이 되지 않게 둔다 */
                page?: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleHistoryListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(날짜 · 페이지 · 페이지당 건수 20 · 50 · 100) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 · 직원 필터가 그 점포 직원이 아니거나 본사에게 가려진 직원 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_assignableStaff: {
        parameters: {
            query: {
                /** @description 근무지 점포. 업무 범위 밖이면 404 */
                storeId: number;
                /** @description 근무일 YYYY-MM-DD */
                workDate: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleStaffResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_defaults: {
        parameters: {
            query: {
                /** @description 직원 레코드 */
                staffMemberId: number;
                /** @description 근무일 YYYY-MM-DD */
                workDate: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleDefaultsDto"];
                };
            };
            /** @description 입력 오류 · 24시간짜리 · 휴게가 근무시간 이상 · WORK_SCHEDULE_NO_CONTRACT(근무일에 체결 완료 계약 없음) · WORK_SCHEDULE_AFTER_RETIREMENT(퇴직일 뒤) · WORK_SCHEDULE_NOT_JOINED(가입 전) · WORK_SCHEDULE_HIDDEN(본사에게 가려지는 가맹 직원) · WORK_SCHEDULE_STORE_CLOSED(폐점 점포 — 등록만, 수정은 받는다) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원이 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_bulkCreate: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkCreateWorkSchedulesDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkCreateWorkSchedulesResponseDto"];
                };
            };
            /** @description 요청 형식 오류(근무일 · 줄 수 1~100 · 줄의 시각 형식) — 이때는 아무 줄도 저장하지 않는다 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_copyPreview: {
        parameters: {
            query: {
                /** @description 근무지 점포. 업무 범위 밖이면 404 */
                storeId: number;
                /** @description 복사해 넣을 주의 월요일 YYYY-MM-DD. 원본은 그 직전 주(월~일)다 */
                weekStart: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CopyLastWeekResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · weekStart 가 월요일이 아님 · WORK_SCHEDULE_STORE_CLOSED(폐점 점포) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description WORK_SCHEDULE_WEEK_NOT_EMPTY(그 주에 근무스케줄이 있음) · WORK_SCHEDULE_COPY_HIDDEN_STAFF(본사 계정인데 원본 주에 본사에게 가려진 직원이 있음 — 가맹 점포 관리자가 복사) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_copyLastWeek: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CopyLastWeekDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CopyLastWeekResponseDto"];
                };
            };
            /** @description 요청 형식 오류 · weekStart 가 월요일이 아님 · WORK_SCHEDULE_STORE_CLOSED(폐점 점포) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description WORK_SCHEDULE_WEEK_NOT_EMPTY(그 주에 근무스케줄이 있음) · WORK_SCHEDULE_COPY_HIDDEN_STAFF(본사 계정인데 원본 주에 본사에게 가려진 직원이 있음 — 가맹 점포 관리자가 복사) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_remove: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                workScheduleId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleDeleteResponseDto"];
                };
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 근무스케줄 · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkSchedulesController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                workScheduleId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkScheduleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkScheduleDto"];
                };
            };
            /** @description 입력 오류 · 24시간짜리 · 휴게가 근무시간 이상 · WORK_SCHEDULE_NO_CONTRACT(근무일에 체결 완료 계약 없음) · WORK_SCHEDULE_AFTER_RETIREMENT(퇴직일 뒤) · WORK_SCHEDULE_NOT_JOINED(가입 전) · WORK_SCHEDULE_HIDDEN(본사에게 가려지는 가맹 직원) · WORK_SCHEDULE_STORE_CLOSED(폐점 점포 — 등록만, 수정은 받는다) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무스케줄 관리 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 근무스케줄 · 지움 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description WORK_SCHEDULE_OVERLAP(같은 직원 근무스케줄과 겹침) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyWorkSchedulesController_list: {
        parameters: {
            query: {
                /** @description 내 소속(직원 레코드) — `GET /me/memberships` 의 staffMemberId */
                staffMemberId: number;
                /** @description 달 YYYY-MM. 근무일(시작 일시의 한국 날짜)이 그 달인 근무스케줄 */
                month: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyWorkScheduleListResponseDto"];
                };
            };
            /** @description staffMemberId · month 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAttendanceController_get: {
        parameters: {
            query: {
                /** @description 앱 전역에서 고른 소속(직원 레코드) — `GET /me/memberships` 의 staffMemberId (ATT-07) */
                staffMemberId: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyAttendanceResponseDto"];
                };
            };
            /** @description staffMemberId 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 · LOCATION_CONSENT_REQUIRED — 위치정보 동의 없음 · 철회 · 약관 버전이 바뀌어 다시 동의 필요 / LOCATION_PAUSED — 위치 수집 일시 중지. 위치를 보지 않는 근무지는 보지 않는다 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAttendanceController_locationRead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LocationReadDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationReadResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 위치를 보지 않는 근무지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 · LOCATION_CONSENT_REQUIRED — 위치정보 동의 없음 · 철회 · 약관 버전이 바뀌어 다시 동의 필요 / LOCATION_PAUSED — 위치 수집 일시 중지. 위치를 보지 않는 근무지는 보지 않는다 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAttendanceController_checkIn: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckInDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceRecordResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 출근에 쓸 수 없는 사유 · 위치를 보지 않는 근무지에 사유 · 위치 읽음 · 위치를 보는 근무지인데 위치 읽음이 없거나 이미 쓴 것 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 · LOCATION_CONSENT_REQUIRED — 위치정보 동의 없음 · 철회 · 약관 버전이 바뀌어 다시 동의 필요 / LOCATION_PAUSED — 위치 수집 일시 중지. 위치를 보지 않는 근무지는 보지 않는다 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ALREADY_CHECKED_IN — 어느 소속에든 열린 출근이 있음(openCheckIn 을 함께) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_PENDING_SIGNATURE — 서명 대기 계약(contractId) / NO_CONTRACT — 오늘이 체결 완료 근로계약 기간 밖이거나 퇴직일이 지남 (ATT-12) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAttendanceController_checkOut: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckOutDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceRecordResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 퇴근에 쓸 수 없는 사유 · 위치를 보지 않는 근무지에 사유 · 위치 읽음 · 위치를 보는 근무지인데 위치 읽음이 없거나 이미 쓴 것 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 · LOCATION_CONSENT_REQUIRED — 위치정보 동의 없음 · 철회 · 약관 버전이 바뀌어 다시 동의 필요 / LOCATION_PAUSED — 위치 수집 일시 중지. 위치를 보지 않는 근무지는 보지 않는다 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description NO_OPEN_CHECK_IN — 고른 소속에 열린 출근이 없음. 다른 소속에 있으면 openCheckIn 을 함께. CHECK_OUT_EXPIRED — 열린 출근이 출근한 다음 날을 지남(관리자 보정으로 닫는다) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAttendanceController_myRecords: {
        parameters: {
            query: {
                /** @description 앱 전역에서 고른 소속(직원 레코드) */
                staffMemberId: number;
                /** @description 시작일 YYYY-MM-DD(한국) */
                from: string;
                /** @description 끝날 YYYY-MM-DD(포함). 시작부터 366일 이하(HIST-2 「한 번에 최대 1년」) */
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyAttendanceRecordsResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · 기간이 366일 넘음 · 끝이 시작보다 앞 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 — 위치 동의는 보지 않는다 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_daily: {
        parameters: {
            query: {
                /** @description 점포 유형(상단 범위 직영 · 가맹) — DIRECT · FRANCHISE. 폐점 점포는 뺀다 */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 날짜 YYYY-MM-DD(한국). 출근 기록 시각 · 근무스케줄 시작이 이 날인 것 */
                date: string;
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로, 1000개까지 */
                storeIds?: number[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DailyAttendanceResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_period: {
        parameters: {
            query: {
                /** @description 점포 유형(상단 범위 직영 · 가맹) — DIRECT · FRANCHISE. 폐점 점포는 뺀다 */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 시작일 YYYY-MM-DD(한국) */
                from: string;
                /** @description 끝날 YYYY-MM-DD(포함). 시작부터 92일 이하 */
                to: string;
                /** @description 직원 레코드 — 주면 그 직원만. 점포 조건 안의 직원이 아니거나 본사에게 가려지는 직원이면 404 */
                staffMemberId?: number;
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로, 1000개까지 */
                storeIds?: number[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PeriodAttendanceResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · 기간이 92일 넘음 · 끝이 시작보다 앞 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원이 점포 조건 안의 직원이 아니거나 본사에게 가려진 직원 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_proxyStaff: {
        parameters: {
            query: {
                /** @description 점포 유형(상단 범위 직영 · 가맹) — DIRECT · FRANCHISE. 폐점 점포는 뺀다 */
                storeTypes?: ("DIRECT" | "FRANCHISE")[];
                /** @description 날 YYYY-MM-DD(한국) */
                date: string;
                /** @description 고른 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로, 1000개까지 */
                storeIds?: number[];
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProxyStaffResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_proxy: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProxyAttendanceDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceEditResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 3개월이 지났거나 오늘 이후 · 아직 오지 않은 시각 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ALREADY_CHECKED_IN — 퇴근 없이 출근만 넣는데 열린 출근이 있음 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description PROXY_NOT_ALLOWED — 위치정보 동의가 있는 직원 · 위치를 보지 않는 점포 / NO_CONTRACT — 그날 체결 완료 계약 없음 · 퇴직 뒤 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_correct: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                recordId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CorrectAttendanceDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceEditResultDto"];
                };
            };
            /** @description 본문 형식 오류 · 3개월이 지남 · 있던 쪽 시각을 비움 · 바뀐 값 없음 · 아직 오지 않은 시각 · 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 기록 · 업무 범위 밖 · 본사에게 가려진 직원 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ATTENDANCE_CHANGED — 그사이 다른 관리자가 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_review: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                recordId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceEditResultDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 기록 · 업무 범위 밖 · 본사에게 가려진 직원 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ATTENDANCE_CHANGED — 확인 필요 사유가 없음(이미 검토됨) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AttendanceRecordsController_history: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                recordId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttendanceHistoryResponseDto"];
                };
            };
            /** @description 플랫폼 계정의 X-Bp-Code-Id 누락 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 출·퇴근 현황 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · BP · 가맹 계정의 다른 BP · 형식이 틀린 헤더 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 기록 · 업무 범위 밖 · 본사에게 가려진 직원 · 플랫폼 계정의 X-Bp-Code-Id 가 없는 · 지운 · 플랫폼 BP 이거나 형식이 틀림(가드) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyProfileController_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyProfileResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyProfileController_updateAddress: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMyAddressDto"];
            };
        };
        responses: {
            /** @description 저장함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 우편번호 · 주소 형식 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyProfileController_changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeMyPasswordDto"];
            };
        };
        responses: {
            /** @description 바꿈 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 비밀번호가 맞지 않음 · 새 비밀번호 규칙 위반(사유) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정 · IP 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyProfileController_requestEmailChangePin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RequestEmailChangePinDto"];
            };
        };
        responses: {
            /** @description 보냄 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 비밀번호가 맞지 않음(「지금 비밀번호가 맞지 않습니다.」) · 이메일 형식 · 지금 이메일과 같음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 다른 계정이 쓰는 이메일 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 1분 재발급 간격 · 하루 10회 · 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 보내기 전에 막힘(메일 템플릿 꺼짐 · 제목 없음 · DB 오류) — 「메일 설정 문제로 … 관리자에게 문의해 주세요.」 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 메일 설정(MAIL_*)이 없거나 메일 서버에 보내지 못함 — 잠시 뒤 다시 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyProfileController_changeEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeMyEmailDto"];
            };
        };
        responses: {
            /** @description 바꿈 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 핀이 틀림 · 만료 · 5회로 닫힘 · 받은 핀 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 그 사이 다른 계정이 그 이메일을 씀 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정 · IP 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyMembershipsController_list: {
        parameters: {
            query?: {
                /**
                 * @description 퇴직한 소속도 넣을지(true · false, 없으면 false). true 면 지금 소속 뒤에 퇴직한 소속을 퇴직일 최근 순으로 붙인다 —
                 *     응답 모양은 같고, 퇴직일(retiredDate)이 오늘보다 앞이면 퇴직한 소속이다. 'true' · 'false' 밖의 값은 400.
                 */
                includeRetired?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyMembershipListResponseDto"];
                };
            };
            /** @description includeRetired 가 true · false 가 아님 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyMembershipsController_taxProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staffMemberId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyTaxProfileResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 없는 id · 범위 밖 id, 남의 레코드, 퇴직했거나 체결 완료 근로계약이 없는 내 레코드. 모두 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장된 신고 정보를 풀 수 없음(키가 다름 · 다른 행의 값 · 손상) — 서버 로그에 레코드 · 칸 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 신고 정보가 있는데 서버에 암호화 키가 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyMembershipsController_saveTaxProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staffMemberId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveMyTaxProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyTaxProfileResponseDto"];
                };
            };
            /** @description 형식 오류 · 바꿀 값 없음(TAX_PROFILE_EMPTY) · 고치는데 지금 비밀번호가 없거나 틀림(CURRENT_PASSWORD_MISMATCH — 「지금 비밀번호가 맞지 않습니다.」, 내 소속 확인 뒤 · 다른 검사 전에 본다) · 처음인데 셋 중 빠짐(TAX_PROFILE_INCOMPLETE) · 은행 · 계좌번호 한쪽만(TAX_PROFILE_ACCOUNT_INCOMPLETE) · 주민등록번호 앞자리와 가입 생년월일이 다름(RRN_BIRTH_MISMATCH — 관리자에게 정정 요청) · 없는 은행(BANK_CODE_UNKNOWN) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 내 소속이 아님 — 조회와 같은 본문 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정 · IP 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 저장된 신고 정보를 풀 수 없음(키가 다름 · 다른 행의 값 · 손상) — 보낸 칸이든 아니든 아무것도 쓰지 않는다(덮어쓰지 않음). 서버 로그에 레코드 · 칸 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 서버에 암호화 키가 없음 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_agreeLocation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgreeLocationConsentDto"];
            };
        };
        responses: {
            /** @description 동의함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description termsVersion 없음 · 빈 문자열 · 문자열 아님 · 64자 초과 · 모르는 칸 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 같은 버전에 동의함 · 화면이 보여 준 약관 버전(termsVersion)이 시행 중인 것과 다름(그사이 바뀜, 보인 약관이 없었는데(null) 시행 중인 약관이 있음 — 화면은 다시 받는다) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 시행 중인 위치정보 약관이 없음(운영자가 모두 끄거나 지움) — 「지금은 위치정보 동의를 받을 수 없습니다 …」 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_pauseLocation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 멈춤 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 동의 상태에서 할 수 없는 동작 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_resumeLocation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 다시 켬 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 동의 상태에서 할 수 없는 동작 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_withdrawLocation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 철회함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 동의 상태에서 할 수 없는 동작 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_agreeHqSharing: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgreeHqSharingConsentDto"];
            };
        };
        responses: {
            /** @description 동의함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description consentVersion 없음 · 빈 문자열 · 문자열 아님 · 64자 초과 · 모르는 칸 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 지금 버전에 동의함 · 화면이 보여 준 문구 버전(consentVersion)이 지금 것과 다름 — 「사업자 제공 동의 내용이 바뀌었습니다. …」(화면은 새로 고친다) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyConsentController_withdrawHqSharing: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 철회함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 지금 동의 상태에서 할 수 없는 동작 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffSignupController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvitationLookupDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationCheckResponseDto"];
                };
            };
            /** @description 형식 오류 · 토큰과 번호 · 코드를 함께 보내거나 둘 다 없음 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 맞는 초대가 없음(INVITATION_NOT_FOUND — 번호나 코드가 틀림) · 끝난 초대(INVITATION_ENDED — 기한 · 다시 보냄 · 번호 변경 · 퇴직 · 가입 불가) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 가입을 마친 초대(INVITATION_ALREADY_JOINED) · 그 번호로 계정이 있음(ACCOUNT_EXISTS) — 둘 다 로그인으로 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 번호로 번호 + 코드를 5번 틀려 30분 잠김(INVITATION_CODE_LOCKED, 본문 lockExpiresAt — 재발송하면 풀림) · 공개 경로 기본 요청 제한 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaffSignupController_signup: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffSignupDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffSignupResponseDto"];
                };
            };
            /** @description 형식 오류 · 비밀번호 규칙 · 만 19세 미만(SIGNUP_UNDER_AGE, 초대는 가입 불가가 됨) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description INVITATION_NOT_FOUND · INVITATION_ENDED — 초대 확인과 같다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description INVITATION_ALREADY_JOINED · ACCOUNT_EXISTS · 이미 쓰는 이메일(ACCOUNT_EMAIL_TAKEN) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같은 번호로 번호 + 코드를 5번 틀려 30분 잠김(INVITATION_CODE_LOCKED, 본문 lockExpiresAt — 재발송하면 풀림) · 공개 경로 기본 요청 제한 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyInvitationsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyInvitationListResponseDto"];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정 · IP 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyInvitationsController_accept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invitationId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptMyInvitationDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AcceptMyInvitationResponseDto"];
                };
            };
            /** @description 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description INVITATION_NOT_FOUND — 없는 초대 · 범위 밖 id · 가입 초대가 아님 · 남의 번호로 온 초대 · 근로계약서 이름이 계정 이름과 다른 초대(그 초대의 상태와 상관없이 같다) · INVITATION_ENDED — 내 초대가 끝남(기한 · 다시 보냄 · 퇴직 · 가입 불가, 처리 중 번호 · 이름 변경) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description INVITATION_ALREADY_JOINED — 내 초대를 먼저 더했거나 같은 초대로 동시에 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정 · IP 요청 한도 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAffiliationRequestsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AffiliationRequestDto"][];
                };
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAffiliationRequestsController_accept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invitationId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptAffiliationRequestDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AcceptAffiliationResponseDto"];
                };
            };
            /** @description 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 내 것이 아닌 요청(AFFILIATION_REQUEST_NOT_FOUND) · 만료 · 번호가 바뀐 요청(AFFILIATION_REQUEST_ENDED) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 답한 요청(AFFILIATION_REQUEST_ANSWERED) · 이 점포에 이미 재직 중 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정마다 10분에 10번 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyAffiliationRequestsController_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invitationId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 형식 오류(요청 ID) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 토큰 없음 · 접속 종료 · 탈퇴 계정 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 관리자 토큰 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description AFFILIATION_REQUEST_NOT_FOUND · AFFILIATION_REQUEST_ENDED — 수락과 같다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 답한 요청(AFFILIATION_REQUEST_ANSWERED) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 계정마다 10분에 10번 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_list: {
        parameters: {
            query: {
                /** @description 연도 2000~2100. */
                year: number;
                /** @description 월 1~12. */
                month: number;
                /** @description 휴일명에 들어 있으면 나온다(캘린더 · 목록 모두). */
                name?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpHolidayListResponseDto"];
                };
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveBpHolidayDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpHolidayCreatedResponseDto"];
                };
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_histories: {
        parameters: {
            query: {
                /** @description 시작 날짜. */
                from?: string;
                /** @description 끝 날짜(그날 포함). */
                to?: string;
                /** @description 1부터. */
                page: number;
                /** @description 기본 20, 최대 200. */
                pageSize: number;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpHolidayHistoryListResponseDto"];
                };
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_overlaps: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckBpHolidayOverlapsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpHolidayOverlapsResponseDto"];
                };
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_detail: {
        parameters: {
            query?: {
                /** @description 캘린더 · 목록에서 고른 날짜. */
                date?: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                bpHolidayId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BpHolidayDetailResponseDto"];
                };
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 · 지운 · 볼 수 없는 휴일 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                bpHolidayId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBpHolidayDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 · 지운 · 볼 수 없는 휴일 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 끝난 휴일 · 진행 중 휴일의 날짜 · 유형 · 반복 · 적용 범위 변경 · 다른 사용자가 먼저 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_remove: {
        parameters: {
            query: {
                /** @description 상세에서 읽은 updatedAt. */
                updatedAt: string;
            };
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                bpHolidayId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 · 지운 · 볼 수 없는 휴일 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 지난 날짜가 있는 휴일(강제 종료를 쓴다) · 다른 사용자가 먼저 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BpHolidaysController_terminate: {
        parameters: {
            query?: never;
            header?: {
                /** @description 대상 BP(bpCodeId). WHALE_ERP 메뉴 경로에서만 읽는다 — 없으면 소속 BP. 플랫폼 계정은 없는 BP · 플랫폼 BP 면 404, BP · 가맹 계정은 소속 BP 가 아니면 403 */
                "X-Bp-Code-Id"?: string;
            };
            path: {
                bpHolidayId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TerminateBpHolidayDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쿼리 · 본문 검증 실패 · 플랫폼 계정의 BP 미선택 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 쓸 수 없는 계정 · 메뉴 권한 없음 · 다른 BP 헤더 · 일부 점포 사용자의 전체 점포 휴일 · 맡지 않은 점포 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 · 지운 · 볼 수 없는 휴일 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 끝난 휴일 · 오늘 이후에 시작하는 휴일(삭제를 쓴다) · 다른 사용자가 먼저 수정 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HomeController_summary: {
        parameters: {
            query?: {
                /** @description 업무 범위의 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로(섞으면 400), 1000개까지. 관리 범위 밖 ID 는 조용히 빠진다. 주지 않으면 관리 범위 전체 */
                storeIds?: number[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomeSummaryResponseDto"];
                };
            };
            /** @description storeIds 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HomeController_pending: {
        parameters: {
            query?: {
                /** @description 업무 범위의 점포. 여러 개는 `storeIds=1&storeIds=2` 와 쉼표 `storeIds=1,2` 중 하나로(섞으면 400), 1000개까지. 관리 범위 밖 ID 는 조용히 빠진다. 주지 않으면 관리 범위 전체 */
                storeIds?: number[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomePendingResponseDto"];
                };
            };
            /** @description storeIds 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
