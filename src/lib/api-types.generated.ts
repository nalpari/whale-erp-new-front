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
        /** 상세. 지운 계정은 404. */
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
        /** 비밀번호 초기화. 새 1시간짜리 초기 비밀번호를 그 계정 이메일로만 보낸다. 수정 권한이 필요하다. */
        post: operations["PlatformAdminsController_resetPassword"];
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
            /** @description 그중 미사용 계정 수 — 목록 머리의 「미사용 N」 */
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
             * @description 계정 상태. 사용 · 미사용. 미사용이면 바로 로그인 · ERP 접근이 막힌다.
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
        };
        /**
         * @description 임시저장 · 발송 대기 · 서명 대기
         * @enum {string}
         */
        ContractStatus: "DRAFT" | "PENDING_SEND" | "PENDING_SIGNATURE" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 계정 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 계정 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 이미 지운 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 마지막 사용 중 플랫폼 마스터 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 계정 */
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
            /** @description 메뉴 권한 없음 · 마스터 보호 · 본인 보호 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 없거나 지운 계정 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 이메일이 없는 계정 */
            409: {
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
}
