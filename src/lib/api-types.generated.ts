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
        /** whale-erp-staff(직원 근무 앱) 로그인. */
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
         *     갱신할 때마다 접속 상태의 만료가 지금부터 30일 뒤로 밀린다. 만료되었거나
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
         *     일치 여부 · 메일 발송 여부와 상관없이 같은 202 다(맞는 정보로 1시간 5번을 넘으면 429). 받으면 잠금이 풀리고, 그 비밀번호로 들어오면 강제 변경 대상이다.
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
        /** 공통코드 그룹 목록. 플랫폼고정 · 플랫폼제공 그룹을 표시 순서대로. */
        get: operations["CodeGroupsController_listGroups"];
        /** 그룹 목록 패널 저장. 기존 그룹 수정(`updates`)과 새 그룹(`creates`)을 한 번에. */
        put: operations["CodeGroupsController_saveGroups"];
        post?: never;
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
        /** 상세 코드 목록 패널 저장. 기존 코드 수정(`updates`)과 새 코드(`creates`)를 한 번에. */
        put: operations["CodeGroupsController_saveItems"];
        post?: never;
        delete?: never;
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
        /** 사용자 권한 선택지. 플랫폼 관리자에게는 플랫폼 마스터 권한을 빼고 준다. */
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
    "/bp-codes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 플랫폼 계정이 고를 고객 BP — 서비스 바로가기 「웨일ERP」의 BP 선택. 미삭제 고객 BP 를 사용 · 미사용 · 탈퇴 모두
         *     BP코드순으로 나눠 준다. 사용 중인 플랫폼 관리자(PM · PA)만 부르고, 그 밖의 관리자 · 직원 앱은 403.
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
    "/bp-codes/{bpCodeId}/code-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 그 BP 가 보는 공통코드 — 공개 `GET /public-code-items` 와 같은 `groups` · 응답 모양.
         *     로그인한 누구나(관리자는 권한 유형과 상관없이, 직원 앱도) 부른다. 부를 때의 현재 값이다.
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
    "/payslips/{id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 확정 — 보이는 공제가 모두 있어야 한다. 검토 사유는 확인한 것으로 남는다. */
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
         * 명세서 내보내기(PAY-2) — 상세와 같은 조건(본인 · 발송 완료 · 3년)의 명세서를 A4 PDF 로 내려준다. 파일 이름은
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
         *     알림톡과 발송 대기, 계정이 있는 번호면 서명 대기(앱 알림은 아직 없다). 임시저장은 보내지 않는다.
         */
        post: operations["ContractsController_create"];
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
         * 재발송 — 발송 대기(가입 초대를 받지 못함) · 서명 대기에서 가입 초대 알림톡을 새 초대 코드 · 새 서명 기한(30일)으로 다시
         *     보낸다. 상태는 그대로이고 앞서 나간 초대 코드는 무효다. 앱으로 받는 직원(가입 · 계정 있음)은 앱 알림이 아직 없어 409.
         */
        post: operations["ContractSendController_send"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stores/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 근무지 선택지. 업무 범위 안에서 지우지 않았고 폐점이 아닌 점포, 이름순. `:id` 보다 먼저 둔다. */
        get: operations["StoresController_options"];
        put?: never;
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
         * 엑셀 바로 받기(xlsx). 목록과 같은 검색 조건으로 전부 담고, 대표자 연락처만 가운데 자리를 가린다.
         *     1만 건 이상은 400(예약 생성은 아직 없다), 한 사람 1분에 한 번(429). `:id` 보다 먼저 둔다.
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
         *     수정 권한은 가드(@MenuPermission)가 먼저 본다 — 가드는 인터셉터보다 먼저 돌므로, 권한 없는 관리자의 요청은
         *     AttachmentsInterceptor 가 multipart 본문(최대 5MB)을 받기 전에 403 이다. 핸들러의 allow() 는 같은 판정을
         *     한 번 더 하지만 지우지 않는다 — 서비스가 받는 MenuCaller(권한 유형 · 권한 그룹)를 그 판정이 돌려주고, 업로드를
         *     받는 사이 권한이 거둬졌으면 그것도 여기서 막는다.
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
    "/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 공지사항 또는 FAQ 목록. 최근 수정일 내림차순. */
        get: operations["PostsController_list"];
        put?: never;
        /** 등록. 임시저장 · 게시 · 비공개 어느 상태로든 만든다. 게시하려면 노출 대상이 있어야 한다. */
        post: operations["PostsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/posts/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PostsController_get"];
        /**
         * 수정. 게시 상태 · 상단 고정 · 노출 대상도 이 요청으로 바꾼다. 게시된 글이면 바로 사용자에게 보인다.
         *     읽은 뒤 다른 관리자가 고쳤으면 409 — 다시 읽어 최신 내용을 본다.
         */
        put: operations["PostsController_update"];
        post?: never;
        /** 지운다(지움 표시). 사용자에게 보이지 않고 행은 남는다. */
        delete: operations["PostsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicPostsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public-posts/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicPostsController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportPostsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/support-posts/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportPostsController_get"];
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
        /** 도입문의 목록. 접수 최신순. */
        get: operations["LeadsAdminController_list"];
        put?: never;
        /** 도입문의 접수. 본문 없이 201 을 돌려준다 — 문의자가 상태를 조회하는 화면은 없다. */
        post: operations["LeadsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/leads/{leadId}": {
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
    "/leads/{leadId}/processing": {
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
    "/leads/{leadId}/reply": {
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
    "/leads/{leadId}/reply-mail/resend": {
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
    "/leads/{leadId}/internal-memo": {
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
    "/inquiries": {
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
    "/inquiries/{inquiryId}": {
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
    "/inquiries/{inquiryId}/attachments/{inquiryAttachmentId}/download-url": {
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
    "/inquiries/{inquiryId}/processing": {
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
    "/inquiries/{inquiryId}/replies": {
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
    "/inquiries/{inquiryId}/internal-memo": {
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
             * @description 마지막으로 사용한 때부터 30일이 되는 시각. 사용할 때마다 뒤로 밀린다.
             */
            refreshTokenExpiresAt: string;
            account: components["schemas"]["LoginAccountResponseDto"];
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
             *     사용한 때부터 30일이 되는 새 만료 시각이다.
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
            error: string;
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
            /** @description 정보가 맞든 아니든, 메일이 나갔든 아니든 같은 문구다 — 응답으로 계정 존재가 드러나지 않게. */
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
            /** @description 숫자만 10~11자리. 화면의 세 칸을 이어 붙인 값이다 */
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
        UpdateCodeGroupDto: {
            /**
             * @description 그룹 코드. 수정이면 대상을 가리킬 뿐 바뀌지 않는다.
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
        CreateCodeGroupDto: {
            /**
             * @description 그룹 코드. 수정이면 대상을 가리킬 뿐 바뀌지 않는다.
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
            /**
             * @description 관리 주체. 플랫폼고정 · 플랫폼제공만. 등록 뒤 바꾸지 않는다.
             * @enum {string}
             */
            manageOwnerCode: "PLATFORM_FIXED" | "PLATFORM_PROVIDED";
        };
        SaveCodeGroupsDto: {
            updates: components["schemas"]["UpdateCodeGroupDto"][];
            creates: components["schemas"]["CreateCodeGroupDto"][];
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
             * @description 상세 코드. 기존 행이면 대상을 가리킬 뿐 바뀌지 않는다. SERVICE 그룹이면 서비스 코드다.
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
        SaveCodeItemsDto: {
            updates: components["schemas"]["CodeItemInputDto"][];
            creates: components["schemas"]["CodeItemInputDto"][];
        };
        BpApplicationResponseDto: {
            /** @description 적용 대상 BP 수(사용 중인 고객 BP). */
            bpCount: number;
            /** @description 복사한 플랫폼 원본 상세 코드 수. 지운 것은 빠지고 사용 안 함은 포함된다. */
            itemCount: number;
            /** @description 실제로 넣은 행 수. BP 에 이미 있던 행은 건너뛰어 세지 않는다. */
            createdCount: number;
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
        LoginIdAvailabilityResponseDto: {
            /** @description 쓸 수 있는가. 삭제한 계정의 아이디도 쓸 수 없다. */
            available: boolean;
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
             * @description 연락처. 하이픈 없이 숫자 10~11자리.
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
             * @description 연락처. 하이픈 없이 숫자 10~11자리.
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
        RoleGroupActorResponseDto: {
            name: string | null;
            loginId: string;
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
         * @description 고칠 수 없는 이유. 고칠 수 있으면 null. 한글은 GET /enums/PlatformRoleGroupLockReason.
         * @enum {string}
         */
        PlatformRoleGroupLockReason: "FIXED_ROLE" | "NO_PERMISSION" | "SELF_LINKED";
        PlatformRoleGroupDetailResponseDto: {
            /**
             * @description 권한 유형 — 플랫폼 마스터 PM · 플랫폼 관리자 PA · BP 마스터 BM · 가맹 마스터 FM. 한글은 공통코드 ROLE_TYPE.
             * @enum {string}
             */
            roleTypeCode: "PM" | "PA" | "BM" | "FM";
            /** @description 고칠 수 없는 이유. 고칠 수 있으면 null. 한글은 GET /enums/PlatformRoleGroupLockReason. */
            editBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            deleteBlockedReason: components["schemas"]["PlatformRoleGroupLockReason"] | null;
            /** @description 권한명 · 설명을 고칠 수 있는가. 메뉴 칸은 메뉴 트리의 칸별 값을 본다. */
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
            /** @description BP코드순. 미삭제 고객 BP 를 상태와 상관없이. */
            items: components["schemas"]["BpListItemResponseDto"][];
            total: number;
        };
        BpStoreListResponseDto: {
            /** @description 점포 이름순. 운영 상태와 상관없이 미삭제 점포 전체. 항목 모양은 로그인 정보의 `stores` 와 같다. */
            items: components["schemas"]["AdminStoreDto"][];
            total: number;
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
            /** @description 재발송 버튼을 보일지. 간격 제한 없이 상태로만 정한다 — 초대 발송 · 초대 만료 · 소속 추가 확인 · 복귀 확인 */
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
        StaffMemberContractDto: {
            status: components["schemas"]["ContractStatus"] | null;
            contractId: number;
            /** Format: date-time */
            signDeadlineAt: string | null;
            /** @description 계약 종료일(YYYY-MM-DD). 비면 무기한 */
            endDate: string | null;
            /**
             * Format: date-time
             * @description 최종 수정 일시. 거부일을 따로 저장하지 않아 「거부 · MM-DD」는 이 값으로 보인다
             */
            updatedAt: string | null;
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
        StaffMemberDetailResponseDto: {
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
            /**
             * @description 직원 계정의 현재 이메일(회원 ID · 로그인 아이디). 근무지에 직접 와서 물은 직원에게 관리자가 알려 줄 수 있게, 상세를
             *     볼 수 있는 관리자(직원 정보 관리 조회 권한)에게 낸다. 본사 역할(BM · BA)이 동의로만 보는 가맹 점포 직원이거나,
             *     가입 전 · 탈퇴 계정 · 퇴직 레코드면 null. 관리자는 고치지 못한다(관리자 요청에 email 칸이 없다).
             */
            email: string | null;
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
        /** @enum {string} */
        PayslipStatus: "DRAFTING" | "REVIEWING" | "CONFIRMED" | "SENT";
        PayslipListItemDto: {
            employmentType: components["schemas"]["EmploymentType"] | null;
            status: components["schemas"]["PayslipStatus"] | null;
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
            /** @description 상태 필터까지 건 건수(페이지 수 계산용) */
            total: number;
            /** @description 그 달 · 관리 범위 전체의 상태 건수. 상태 필터와 상관없고 가린 줄도 센다 */
            statusCounts: components["schemas"]["PayslipStatusCountsDto"];
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
        /** @enum {string} */
        PayslipReviewReason: "MISSING_ATTENDANCE" | "AFTER_CONTRACT_END" | "CONTRACT_CHANGED" | "DEDUCTION_MISSING";
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
        MyPayslipLogDto: {
            /** @description SEND · CANCEL_CONFIRMATION 만 온다 */
            logType: components["schemas"]["PayslipLogType"];
            payslipLogId: number;
            /** Format: date-time */
            changedAt: string;
        };
        MyPayslipSummaryDto: {
            employmentType: components["schemas"]["EmploymentType"];
            /** @description 늘 SENT — 발송 완료 명세서만 보인다 */
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            /** @description YYYY-MM-DD */
            periodStartDate: string;
            /** @description YYYY-MM-DD */
            periodEndDate: string;
            grossPayAmount: number;
            totalDeductionAmount: number;
            netPayAmount: number;
            /**
             * Format: date-time
             * @description 만든 일시 — 보존 기간(3년)의 기준
             */
            createdAt: string;
            /** @description 근무지 점포 이름 */
            storeName: string;
            /** @description 발송 · 확정 취소 이력, 최근 것이 위 */
            logs: components["schemas"]["MyPayslipLogDto"][];
        };
        MyPayslipListResponseDto: {
            /** @description 급여 기간이 늦은 것이 위 */
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
            /** @description 늘 SENT — 발송 완료 명세서만 보인다 */
            status: components["schemas"]["PayslipStatus"];
            payslipId: number;
            /** @description YYYY-MM-DD */
            periodStartDate: string;
            /** @description YYYY-MM-DD */
            periodEndDate: string;
            grossPayAmount: number;
            totalDeductionAmount: number;
            netPayAmount: number;
            /**
             * Format: date-time
             * @description 만든 일시 — 보존 기간(3년)의 기준
             */
            createdAt: string;
            /** @description 근무지 점포 이름 */
            storeName: string;
            /** @description 발송 · 확정 취소 이력, 최근 것이 위 */
            logs: components["schemas"]["MyPayslipLogDto"][];
            /** @description 3.3% 원천징수 적용 — 원천징수 · 소득세 줄을 어떻게 보일지 화면이 정한다 */
            isWithholdingApplied: boolean;
            /** @description 지급 · 공제 항목, 급여 항목 순서 */
            items: components["schemas"]["MyPayslipItemDto"][];
        };
        /** @enum {string} */
        ContractMethod: "ELECTRONIC" | "PAPER";
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
            contractId: number;
            staffMemberId: number;
            /** @description 직원 레코드의 이름(초안 입력값) */
            staffMemberName: string;
            storeId: number;
            /** @description 점포가 지워졌어도 이름은 보인다 */
            storeName: string | null;
        };
        ContractListResponseDto: {
            items: components["schemas"]["ContractListItemDto"][];
            /** @description 거른 결과 전체 건수 */
            total: number;
        };
        /**
         * @description 성별 — 남 · 여. 가입 때 직원이 넣은 값과 본인 대조한다(WHALEERP-125). 임시저장은 비워도 된다
         * @enum {string}
         */
        Gender: "MALE" | "FEMALE";
        /**
         * @description 주휴일 — 근무하지 않는 요일 하나(노무사 확인 2026-10-14). 주 소정근로시간이 15시간 이상이면 넣어야 하고,
         *     15시간 미만이면 주휴가 없어 비운다(contracts.service checkWeeklyHoliday).
         * @enum {string}
         */
        Weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
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
             * @description 대체할 진행 중 계약(WHALEERP-129). 같은 점포에 같은 번호의 진행 중 계약(임시저장 · 발송 대기 · 서명 대기 · 수정 요청)이
             *     있으면 409(code CONTRACT_IN_PROGRESS)가 그 목록(id · 상태 · 직원 이름 · 계약 기간)을 준다. 관리자가 대체를 확인하면
             *     그 id 를 모두 넣어 다시 보낸다 — 임시저장은 지우고 발송 대기 · 서명 대기 · 수정 요청은 종료한다. 종이 계약 등록이면 체결 완료도
             *     묻고 종료한다. 체결 완료는 같은 번호로 퇴직 · 재입사가 되풀이되면 쌓이므로 상한을 넉넉히 둔다 — 409 목록을 모두
             *     다시 보낼 수 없으면 그 번호로는 종이 계약을 등록할 수 없다(api #49 리뷰, WHALEERP-600).
             */
            replaceContractIds?: number[];
        };
        CreatedContractResponseDto: {
            contractId: number;
            staffMemberId: number;
        };
        /** @enum {string} */
        StatusChangeActor: "ADMIN" | "STAFF" | "SYSTEM";
        ContractStatusHistoryDto: {
            /** @description 처음 만든 줄은 null */
            fromStatus: components["schemas"]["ContractStatus"] | null;
            toStatus: components["schemas"]["ContractStatus"];
            actor: components["schemas"]["StatusChangeActor"];
            /** @description ISO 8601 */
            changedAt: string;
        };
        /**
         * @description 종이 계약 근로계약서 · 임금계약서
         * @enum {string}
         */
        ContractDocumentKind: "SENT_ORIGINAL" | "SIGNED_COPY" | "PAPER_EMPLOYMENT_CONTRACT" | "WAGE_CONTRACT";
        ContractDocumentDto: {
            /** @description 종이 계약 근로계약서 · 임금계약서 */
            kind: components["schemas"]["ContractDocumentKind"];
            contractDocumentId: number;
            /** @description 올린 파일의 원래 이름 */
            fileName: string;
        };
        ContractDetailWorkDayDto: {
            weekday: components["schemas"]["Weekday"];
            breakStartTime: string | null;
            breakEndTime: string | null;
            startTime: string;
            endTime: string;
        };
        ContractDetailDto: {
            status: components["schemas"]["ContractStatus"] | null;
            employmentType: components["schemas"]["EmploymentType"];
            /** @description 점포가 지워졌어도 이름은 보인다. 점포 행이 없으면 null */
            storeName: string | null;
            /** @description YYYY-MM-DD */
            birthDate: string | null;
            gender: components["schemas"]["Gender"] | null;
            contractMethod: components["schemas"]["ContractMethod"] | null;
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
            /** @description 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null */
            draftAction: components["schemas"]["ContractDraftAction"] | null;
            /** @description 상태 변경 이력. 최근 것부터 */
            histories: components["schemas"]["ContractStatusHistoryDto"][];
            /** @description 종이 계약 날인본(근로계약서 · 임금계약서). 전자계약 · 임시저장이면 빈 배열 */
            documents: components["schemas"]["ContractDocumentDto"][];
            workDays: components["schemas"]["ContractDetailWorkDayDto"][];
            contractId: number;
            staffMemberId: number;
            name: string;
            phone: string;
            jobTitle: string;
            storeId: number;
            /** @description 외국인 여부 — 체크하지 않았으면 false */
            isForeigner: boolean;
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
             *     그 id 를 모두 넣어 다시 보낸다 — 임시저장은 지우고 발송 대기 · 서명 대기 · 수정 요청은 종료한다. 종이 계약 등록이면 체결 완료도
             *     묻고 종료한다. 체결 완료는 같은 번호로 퇴직 · 재입사가 되풀이되면 쌓이므로 상한을 넉넉히 둔다 — 409 목록을 모두
             *     다시 보낼 수 없으면 그 번호로는 종이 계약을 등록할 수 없다(api #49 리뷰, WHALEERP-600).
             */
            replaceContractIds?: number[];
        };
        DownloadUrlResponseDto: {
            url: string;
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
            /** @description 근무직원 수 — 이 점포가 근무지인 재직 직원 */
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
         * @description 인증됨 · 확인 불가(국세청 정보와 다름) · 번호 중복(미운영 · 운영 점포가 쓰는 번호 — 누가 쓰는지는 알리지 않는다)
         * @enum {string}
         */
        StoreBusinessVerificationResult: "VERIFIED" | "UNVERIFIABLE" | "DUPLICATE";
        StoreBusinessVerificationResponseDto: {
            /** @description 인증됨 · 확인 불가(국세청 정보와 다름) · 번호 중복(미운영 · 운영 점포가 쓰는 번호 — 누가 쓰는지는 알리지 않는다) */
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
            /** @description 대표자 연락처 — 숫자 10~11자리 */
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
            /** @description 소속 BP. 플랫폼 계정만 보낸다(필수) — BP 쪽 계정은 자기 BP 로 정해진다. */
            bpCodeId?: number;
            /** @description 점포명 — 1~50자 */
            name: string;
            /** @description 점포 연락처 — 숫자 9~11자리 */
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
            /** @description 점포 연락처 — 숫자 9~11자리 */
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
        /** @enum {string} */
        PostContentType: "NOTICE" | "FAQ";
        /** @enum {string} */
        PostStatus: "DRAFT" | "PUBLISHED" | "PRIVATE";
        /** @enum {string} */
        NoticeType: "MAINTENANCE" | "FEATURE" | "TERMS" | "GENERAL";
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
        CreatePostDto: {
            /** @description 게시 상태. 게시하려면 노출 대상이 하나 이상 있어야 한다. */
            status: components["schemas"]["PostStatus"];
            /** @description 공지사항 유형. 공지사항이면 필수. */
            noticeType?: components["schemas"]["NoticeType"] | null;
            /** @description 노출 대상. 1차는 비회원 · 회원 · BP · 점포. 「전체」는 네 개를 모두 보낸다. */
            audiences: ("GUEST" | "MEMBER" | "BP" | "STORE")[];
            /** @description 공지사항 · FAQ. 등록 뒤 바꾸지 않는다. */
            contentType: components["schemas"]["PostContentType"];
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
            /** @description 노출 대상. 1차는 비회원 · 회원 · BP · 점포. 「전체」는 네 개를 모두 보낸다. */
            audiences: ("GUEST" | "MEMBER" | "BP" | "STORE")[];
            /**
             * @description 고치기 전에 읽은 `updatedAt` 그대로. 그 뒤 누가 고쳤으면 409 이고, 상세를 다시 읽어 최신 내용을 본다.
             * @example 2026-10-13T01:02:03.456Z
             */
            updatedAt: string;
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
             *     맨 아래이거나 FAQ 면 null.
             */
            prev: components["schemas"]["PostNeighborDto"] | null;
            /** @description 다음 — 목록에서 바로 위 글(대개 더 새 글). 맨 위이거나 FAQ 면 null. */
            next: components["schemas"]["PostNeighborDto"] | null;
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
        /** @enum {string} */
        NotificationTemplateChannel: "NOTIFICATION" | "PUSH" | "EMAIL" | "ALIMTALK";
        /** @enum {string} */
        PreferenceCategory: "CONTRACT" | "SCHEDULE" | "TODO" | "PAYSLIP";
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
            /** @description 기본 문구가 있는지(마이그레이션으로 넣은 기본 템플릿 41건) — 되돌리기를 보일지 */
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
            /** @description 기본 문구가 있는지(마이그레이션으로 넣은 기본 템플릿 41건) — 되돌리기를 보일지 */
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
        /** @enum {string} */
        AttachmentFileType: "JPG" | "PNG" | "PDF";
        InquiryAttachmentDto: {
            fileType: components["schemas"]["AttachmentFileType"];
            inquiryAttachmentId: number;
            fileName: string;
            sizeBytes: number;
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
        TodoStatus: "PENDING" | "IN_PROGRESS" | "DONE";
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
            /** @description 맞는 계정이 없음. 어느 값이 틀렸든 같은 메시지(「일치하는 계정이 없습니다」)이고 실패 1회로 센다 */
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
            header?: never;
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
            /** @description 링크 주소 · 발송기가 없거나 발송 실패 */
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
            /** @description 요청 제한(임시) — 같은 IP 1분 30번, 같은 이메일 10분 10번 */
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
    CodeGroupsController_saveGroups: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveCodeGroupsDto"];
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
            /** @description 이미 있는 그룹 코드 */
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
            header?: never;
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
    CodeGroupsController_saveItems: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupCode: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveCodeItemsDto"];
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
            /** @description 이 그룹에 이미 있는 상세 코드 */
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
            header?: never;
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
    PlatformAdminsController_list: {
        parameters: {
            query: {
                /** @description 아이디 · 이름 중 하나에 들어 있으면 나온다. */
                keyword?: string;
                /** @description 사용자 권한(권한 그룹). */
                roleGroupId?: number;
                /** @description 계정 상태. 여러 개는 `statuses=ACTIVE&statuses=INACTIVE` 또는 쉼표로. 주지 않으면 둘 다. */
                statuses?: ("ACTIVE" | "INACTIVE")[];
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
            header?: never;
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
                    "application/json": components["schemas"]["PlatformRoleGroupListResponseDto"];
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
    PlatformAdminsController_loginIdAvailability: {
        parameters: {
            query: {
                /** @description 아이디. 영문 또는 영문 · 숫자 4~20자. */
                loginId: string;
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
    PlatformAdminsController_detail: {
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
            header?: never;
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
            header?: never;
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
    PlatformRoleGroupsController_list: {
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
                    "application/json": components["schemas"]["PlatformRoleGroupSummaryListResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
                    "application/json": components["schemas"]["PlatformRoleGroupDetailResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
                    "application/json": components["schemas"]["RoleGroupMenuTreeResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
                    "application/json": components["schemas"]["RoleGroupDeletionCandidatesResponseDto"];
                };
            };
            /** @description 메뉴 권한 없음 · 플랫폼 계정이 아님(공용 문구) · 본인이 연결된 권한 */
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
            header?: never;
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
            /** @description 같거나 겹치는 URL 을 쓰는 사용 중 메뉴 · 메뉴 코드를 더 만들 수 없음 */
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
            /** @description 메뉴를 찾을 수 없습니다 */
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
            header?: never;
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
            /** @description 메뉴를 찾을 수 없습니다 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 같거나 겹치는 URL 을 쓰는 사용 중 메뉴 · 동시 수정 */
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
            header?: never;
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
            /** @description 메뉴를 찾을 수 없습니다 */
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
    BpCodesController_list: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize: number;
                /** @description 상호 · BP코드 중 하나에 들어 있으면 나온다(대소문자 무시). 앞뒤 공백은 자른다. */
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
            /** @description 없거나 삭제된 BP */
            404: {
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
    StaffMembersController_findAll: {
        parameters: {
            query?: {
                /**
                 * @description 쉼표로 구분한 점포 ID. 관리 범위 밖의 ID 는 조용히 빠진다. 없으면 관리 범위 전체.
                 *     빈 칸 · 숫자가 아닌 값 · 1..2147483647 밖의 값이 하나라도 있거나 500개를 넘으면 400 이다.
                 */
                storeIds?: string;
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
    RetirementController_preview: {
        parameters: {
            query: {
                /**
                 * @description 퇴직일(YYYY-MM-DD, 한국 날짜). 그날까지 재직이고 다음 날 0시에 퇴직이 확정된다. 오늘 이후이거나 최근
                 *     3개월 안의 지난 날짜만 받고, 입사일보다 앞설 수 없다.
                 */
                retiredDate: string;
            };
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
            header?: never;
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
            header?: never;
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
            header?: never;
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
                 *     빈 칸 · 숫자가 아닌 값 · 1..2147483647 밖의 값이 하나라도 있거나 500개를 넘으면 400 이다. 상태 건수도 이 점포로 센다.
                 */
                storeIds?: string;
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
                    "application/json": components["schemas"]["PayslipListResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(month 누락 포함) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
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
            header?: never;
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
            /** @description 본문 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 직원 · 관리 범위 밖 · 가려지는 직원(본사 제공 동의 없음) */
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
    PayslipsController_candidates: {
        parameters: {
            query: {
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
                    "application/json": components["schemas"]["PayslipCandidatesResponseDto"];
                };
            };
            /** @description 쿼리 형식 오류(month 누락 포함) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
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
            header?: never;
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
            /** @description 본문 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
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
            header?: never;
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
            /** @description 본문 형식 오류 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
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
                    "application/json": components["schemas"]["PayslipAdditionalItemsResponseDto"];
                };
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
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
                    "application/json": components["schemas"]["PayslipDetailResponseDto"];
                };
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
            header?: never;
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
            /** @description 본문 형식 오류 · 정직원 3.3% · 같은 항목 두 번 · 붙일 수 없는 항목 · 합계 초과 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
                    "application/json": components["schemas"]["PayslipPreviousResponseDto"];
                };
            };
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
            404: {
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
            header?: never;
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
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
            /** @description DEDUCTION_MISSING — 비어 있는 공제(본문 items) */
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
            header?: never;
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
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
            header?: never;
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
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
            header?: never;
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
            /** @description 급여명세서 관리 조회 권한 없음 · 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 명세서 · 관리 범위 밖 · 가려지는 명세서 · ID 형식 오류 */
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
        };
    };
    ContractsController_list: {
        parameters: {
            query: {
                /** @description 여러 개면 `?status=SIGNED&status=REJECTED`. 없으면 전체 */
                status?: components["schemas"]["ContractStatus"][];
                /** @description 1부터 */
                page: number;
                pageSize: number;
                /** @description 점포 이름 일부 */
                storeName?: string;
                /** @description 직원 이름 일부 */
                staffMemberName?: string;
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
                    "application/json": components["schemas"]["ContractListResponseDto"];
                };
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
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
            header?: never;
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
            /** @description 입력 오류 · 만 19세 미만 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 폐점이거나 업무 범위 밖 */
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
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 설치 주소 STAFF_APP_URL 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
            503: {
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
            header?: never;
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
            /** @description 입력 오류 · 만 19세 미만 · 근로계약서 날인본 없음 · 파일 종류 · 크기 · 개수 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 근무지 점포가 없거나 폐점이거나 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 대체할 계약을 다른 요청이 먼저 고침 */
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
    ContractsController_findOne: {
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
                    "application/json": components["schemas"]["ContractDetailDto"];
                };
            };
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 */
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
            header?: never;
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
            /** @description 입력 오류 · 만 19세 미만 · 수정 요청인데 임시저장 · 근무지 변경 · 가입한 직원의 번호 변경 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 근무지 점포가 없거나 폐점 · 업무 범위 밖 */
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
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 설치 주소 STAFF_APP_URL 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
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
            header?: never;
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
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 */
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
            header?: never;
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
            /** @description 입력 오류 · 만 19세 미만 · 가입한 직원의 번호 변경 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 업무 범위 밖 */
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
            /** @description 같은 번호의 다른 저장이 길어져 시간 초과(잠시 뒤 다시) · 가입 초대를 보낼 수 없음(직원 앱 설치 주소 STAFF_APP_URL 없음, 가입 초대 템플릿 꺼짐 — 저장하지 않음) */
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
            header?: never;
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
            /** @description 입력 오류 · 만 19세 미만 · 근로계약서 날인본 없음 · 파일 종류 · 크기 · 개수 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 번호를 바꾸는데 점포 직원 관리 권한이 없음(동의로만 보이는 직원) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 근무지 점포가 없거나 폐점 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 임시저장이 아님 · 이 점포에 같은 번호로 재직 중 · CONTRACT_IN_PROGRESS(contracts 목록: contractId · status · name · startDate · endDate, replaceContractIds 로 대체) · WORK_TIME_OVERLAP · 다른 요청이 먼저 고침 */
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
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님(목록) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없는 계약 · 파일 · 업무 범위 밖 */
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
            header?: never;
            path: {
                contractId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description { contractId, status(그대로 — PENDING_SEND · PENDING_SIGNATURE), sentAt, signDeadlineAt } */
            200: {
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
            /** @description 없는 계약 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description CONTRACT_STATUS_CONFLICT(발송 대기 · 서명 대기가 아님) · SEND_CHANNEL_NOT_READY(가입한 직원 · 계정이 있는 번호 — 앱 알림 준비 전) · SEND_PHONE_NOT_MOBILE(휴대폰 번호가 아님) · 다른 요청이 먼저 고침 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description SEND_FAILED(나가지 않음 — 거절 · 토큰 단계 · 요청 전 오류, 되돌렸고 다시 보낼 수 있음, 본문 contractId · status) · SEND_UNCONFIRMED(접수 여부 모름 또는 되돌리기 실패 — 상세를 다시 읽을 것) */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 설치 주소(STAFF_APP_URL)가 없음 · 가입 초대 템플릿이 없거나 꺼짐 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_options: {
        parameters: {
            query: {
                /** @description 쪽 번호. 1부터. */
                page: number;
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
                    "application/json": components["schemas"]["StoreOptionListResponseDto"];
                };
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 */
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
                /** @description 소속 BP. BP 상세의 「소속 점포 수」에서 들어올 때 준다. */
                bpCodeId?: number;
                /** @description 쪽 번호. 1부터. */
                page: number;
                /** @description 한 쪽 건수. 20 · 50 · 100, 기본 20. */
                pageSize: 20 | 50 | 100;
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
                    "application/json": components["schemas"]["StoreListResponseDto"];
                };
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
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
            header?: never;
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
            /** @description 입력 형식 · 위도 · 경도 중 하나만 있음 · BP 를 고르지 않음(플랫폼) · 없는 BP(플랫폼 BP 포함) · 다른 BP 에 등록(BP · 가맹 계정) · 국세청 정보와 다름 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
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
                /** @description 소속 BP. BP 상세의 「소속 점포 수」에서 들어올 때 준다. */
                bpCodeId?: number;
            };
            header?: never;
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
                };
            };
            /** @description 검색 조건 형식 · 1만 건 이상 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
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
        };
    };
    StoresController_verifyBusiness: {
        parameters: {
            query?: never;
            header?: never;
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
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
                    "application/json": components["schemas"]["StoreDetailResponseDto"];
                };
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
            header?: never;
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
            /** @description 입력 형식 · 위도 · 경도 중 하나만 있음 · 바꿀 수 없는 상태 전환 · 운영으로 바꿀 때 운영 조건(인증 · 좌표) 미충족 · 운영 중인 점포의 좌표 삭제 · 국세청 정보와 다름 · 재인증 번호 불일치 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
            header?: never;
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
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
                    "application/json": components["schemas"]["StoreHistoryListResponseDto"];
                };
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
                    "application/json": components["schemas"]["StoreTransitionCheckResponseDto"];
                };
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
            header?: never;
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
            /** @description 파일 없음 · JPG · PNG 가 아님 · 5MB 초과 · 파일 2개 이상 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
            header?: never;
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
            /** @description 직원 앱 토큰 · 사용 중인 관리자 계정이 아님 · 메뉴 권한 없음 · 가맹 계정의 등록 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 점포 · 볼 수 없는 점포 */
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
    PostsController_list: {
        parameters: {
            query: {
                contentType: components["schemas"]["PostContentType"];
                /** @description 게시 상태로 거른다. 없으면 전부. */
                status?: components["schemas"]["PostStatus"];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
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
                    "application/json": components["schemas"]["PostListResponseDto"];
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
    PostsController_create: {
        parameters: {
            query?: never;
            header?: never;
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
            /** @description 노출 대상 없이 게시 · 공지사항 유형 없음 · FAQ 카테고리 없음 · 게시 종료일이 시작일보다 앞섬 */
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
        };
    };
    PostsController_get: {
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
                    "application/json": components["schemas"]["PostResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 게시물 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PostsController_update: {
        parameters: {
            query?: never;
            header?: never;
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
            /** @description 없거나 지운 게시물 */
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
    PostsController_remove: {
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
            204: {
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
            /** @description 없는 게시물 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이미 지운 게시물 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicPostsController_list: {
        parameters: {
            query: {
                contentType: components["schemas"]["PostContentType"];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. */
                faqCategoryCode?: string;
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
    PublicPostsController_get: {
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
                    "application/json": components["schemas"]["PublishedPostResponseDto"];
                };
            };
            /** @description 없음 · 비공개 · 지움 · 게시 기간 밖 · 비회원 대상 아님 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportPostsController_list: {
        parameters: {
            query: {
                contentType: components["schemas"]["PostContentType"];
                /** @description 쪽 번호. 1부터, 최대 10,000,000 — 건너뛸 행 수가 integer 범위를 넘지 않게. */
                page?: number;
                /** @description 한 쪽 건수. 기본 20, 최대 200. */
                pageSize?: number;
                /** @description 공지사항 구분으로 거른다. FAQ 에는 쓰지 않는다. */
                noticeType?: components["schemas"]["NoticeType"];
                /** @description FAQ 카테고리(공통코드 FAQ_CATEGORY 상세코드)로 거른다. */
                faqCategoryCode?: string;
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
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 글 종류 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportPostsController_get: {
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
                    "application/json": components["schemas"]["SupportPostResponseDto"];
                };
            };
            /** @description 관리자 토큰이 아니거나 사용 중인 관리자 계정이 아님 · 그 글 종류 메뉴의 조회 권한 없음 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없음 · 비공개 · 지움 · 게시 기간 밖 · 노출 대상 아님 */
            404: {
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
    LeadsAdminController_list: {
        parameters: {
            query: {
                /** @description 답변 대기(접수 · 처리중) 또는 답변 완료. */
                answerStatus?: components["schemas"]["InquiryAnswerStatus"];
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
                    "application/json": components["schemas"]["LeadListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
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
    LeadsAdminController_get: {
        parameters: {
            query?: never;
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
                /** @description 답변 대기(접수 · 처리중) 또는 답변 완료. */
                answerStatus?: components["schemas"]["InquiryAnswerStatus"];
                /** @description 제목에 들어 있으면 나온다. */
                title?: string;
                /** @description 보낸 곳 — BP 이름 · 점포 이름 · 보낸 사람 이름 중 하나에 들어 있으면 나온다. */
                sender?: string;
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
                    "application/json": components["schemas"]["InquiryListResponseDto"];
                };
            };
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
            header?: never;
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
            /** @description 플랫폼 관리자가 아님 */
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
                 */
                status?: components["schemas"]["InquiryStatus"];
                /** @description 제목에 들어 있으면 나온다. */
                title?: string;
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
            header?: never;
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
            header?: never;
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
            header?: never;
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
                /** @description 담당 — 개인 · 근무지 전체 */
                assigneeType?: components["schemas"]["TodoAssigneeType"];
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
            header?: never;
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
            header?: never;
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
            header?: never;
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
            header?: never;
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
                    "application/json": components["schemas"]["TodoItemListResponseDto"];
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
}
