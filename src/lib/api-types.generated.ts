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
        /** BP에 적용. 플랫폼제공 그룹만. 각 BP 에 아직 없는 행만 넣는다 — 다시 눌러도 된다. */
        post: operations["CodeGroupsController_applyToBps"];
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
    "/contracts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContractsController_list"];
        put?: never;
        /** 근로계약서 초안 저장 — 미가입 직원 레코드와 발송 대기 계약을 만든다 */
        post: operations["ContractsController_create"];
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
        /** 임시저장 이어 쓰기. 폼 전체를 다시 보낸다. isTemporarySave 를 빼면 초안 저장(발송 대기)으로 넘어간다 */
        put: operations["ContractsController_update"];
        post?: never;
        /** 임시저장 삭제. 계약 · 근무 요일 · 당사자 · 이력과 그 계약에만 쓰인 초안 직원 레코드를 지운다 */
        delete: operations["ContractsController_remove"];
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
        get: operations["StoresController_list"];
        put?: never;
        post?: never;
        delete?: never;
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
        ContractStatus: "DRAFT" | "PENDING_SEND" | "PENDING_SIGNATURE" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
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
        ContractToEndDto: {
            /** @description 임시저장 · 발송 대기 · 서명 대기 */
            status: components["schemas"]["ContractStatus"];
            contractId: number;
        };
        RetirementPreviewResponseDto: {
            /** @description 퇴직일 다음 날부터의 근무스케줄 수 — 지운다 */
            schedulesToRemove: number;
            /** @description 개인으로 배정된 미완료 TO-DO 수 — 배정을 푼다 */
            todosToUnassign: number;
            /** @description 임시저장 · 발송 대기 · 서명 대기 계약 — 종료로 닫는다 */
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
        /** @enum {string} */
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
        CreateContractDto: {
            employmentType: components["schemas"]["EmploymentType"];
            /**
             * @description 임시저장이면 비워도 된다
             * @enum {string}
             */
            contractMethod?: "ELECTRONIC";
            workDays?: components["schemas"]["ContractWorkDayDto"][];
            payMonth?: components["schemas"]["PayMonth"];
            name: string;
            /** @description 숫자만 10~11자리 (예: 01090145563) */
            phone: string;
            /** @description YYYY-MM-DD. 계약 시작일 기준 만 19세 미만이면 저장하지 않는다 */
            birthDate?: string;
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
            /** @description 기본시간 중 휴일근무 — 시간, 30분 단위 */
            baseHolidayHours?: number;
            /** @description 월간 추가 휴일근무 — 시간, 30분 단위 */
            monthlyExtraHolidayHours?: number;
            /** @description 연차휴가 조항 문구. 기본 문구는 작성 화면이 채운다 */
            annualLeaveTerms?: string;
            /** @description 퇴직금 조항 문구. 기본 문구는 작성 화면이 채운다 */
            severancePayTerms?: string;
            /** @description 1~31. 31 은 말일 */
            payDay?: number;
            /** @description 계약서 근무 장소 조항에 적는 주소. 근무지 점포와 따로다 */
            workLocation?: string;
            isHealthPensionInsured?: boolean;
            isEmploymentInjuryInsured?: boolean;
            /** @description true 면 임시저장(DRAFT) — 초대 · 계약서를 보내지 않는다. 없으면 초안 저장(발송 대기) */
            isTemporarySave?: boolean;
            /**
             * @description 대체할 진행 중 계약(WHALEERP-129). 같은 점포에 같은 번호의 진행 중 계약(임시저장 · 발송 대기 · 서명 대기)이
             *     있으면 409(code CONTRACT_IN_PROGRESS)가 그 목록을 준다. 관리자가 대체를 확인하면 그 id 를 모두 넣어 다시 보낸다 —
             *     임시저장은 지우고 발송 대기 · 서명 대기는 종료한다.
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
            /** @description 기본시간 중 휴일근무 — 시간 */
            baseHolidayHours: number | null;
            /** @description 월간 추가 휴일근무 — 시간 */
            monthlyExtraHolidayHours: number | null;
            /** @description 연차휴가 조항 문구 */
            annualLeaveTerms: string | null;
            /** @description 퇴직금 조항 문구 */
            severancePayTerms: string | null;
            payMonth: components["schemas"]["PayMonth"] | null;
            payDay: number | null;
            isHealthPensionInsured: boolean | null;
            isEmploymentInjuryInsured: boolean | null;
            /** @description 초대 유형 판별 결과(초안 저장 때). 임시저장이면 null */
            draftAction: components["schemas"]["ContractDraftAction"] | null;
            /** @description 상태 변경 이력. 최근 것부터 */
            histories: components["schemas"]["ContractStatusHistoryDto"][];
            workDays: components["schemas"]["ContractDetailWorkDayDto"][];
            contractId: number;
            staffMemberId: number;
            name: string;
            phone: string;
            jobTitle: string;
            storeId: number;
        };
        StoreOptionDto: {
            storeId: number;
            /** @description 점포명 */
            name: string;
        };
        StoreListResponseDto: {
            items: components["schemas"]["StoreOptionDto"][];
            total: number;
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
            /** @description 플랫폼 관리자가 아님 */
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
            /** @description 플랫폼 관리자가 아님 */
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
            /** @description 플랫폼 관리자가 아님 */
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
            /** @description 플랫폼 관리자가 아님 */
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
            /** @description 플랫폼 관리자가 아님 */
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
            /** @description 직원 앱 토큰이거나 사용 중인 관리자 계정이 아님 */
            403: {
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
            /** @description 이 점포에 같은 번호로 재직 중 */
            409: {
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
            /** @description 없는 계약 · 근무지 점포가 없거나 폐점 · 업무 범위 밖 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 임시저장이 아님 · 이 점포에 같은 번호로 재직 중 */
            409: {
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
    StoresController_list: {
        parameters: {
            query: {
                /** @description 1부터 */
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
                    "application/json": components["schemas"]["StoreListResponseDto"];
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
}
