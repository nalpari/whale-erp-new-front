// 직원 목록 목 데이터. 데모(docs/demo/src/staff-sections.mjs)의 열두 줄을 api 응답 모양으로 옮기고, 가입 완료 직원으로
// 채워 기본 필터(재직)에서 데모와 같은 63건이 되게 했다. 보는 사람은 BP 마스터로 본다 — api 가 지금 가맹 점포 직원을
// 모두 가리므로 가맹 점포 직원은 모두 가린 행이다. 그래서 데모에서 가맹 점포(모리커피 연남점)에 있던 유하람 · 임채운은
// 직영 점포로 옮겨 그 표시 예를 잃지 않게 했다.
// 날짜는 오늘(한국)을 기준으로 만들어 「연결 보류 · 4일」, 「갱신 예정 D-20」 같은 표시가 늘 데모처럼 보인다.
import type { StaffRecord, StoreType } from "./staff-members.ts";

const STORES: Record<string, { storeId: number; name: string; storeType: StoreType }> = {
  seocho: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  seongsu: { storeId: 2, name: "모리커피 성수점", storeType: "DIRECT" },
  pangyo: { storeId: 3, name: "온기식당 판교점", storeType: "DIRECT" },
  gwanghwamun: { storeId: 4, name: "온기식당 광화문점", storeType: "DIRECT" },
  euljiro: { storeId: 5, name: "모리커피 을지로점", storeType: "FRANCHISE" },
  yeonnam: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" },
  cheongdam: { storeId: 7, name: "모리커피 청담점", storeType: "FRANCHISE" },
  bupyeong: { storeId: 8, name: "모리커피 부평점", storeType: "FRANCHISE" },
  dunsan: { storeId: 9, name: "온기식당 둔산점", storeType: "FRANCHISE" },
  seomyeon: { storeId: 10, name: "온기식당 서면점", storeType: "FRANCHISE" },
  ilsan: { storeId: 11, name: "온기식당 일산점", storeType: "FRANCHISE" },
};
const DIRECT = [STORES.seocho, STORES.seongsu, STORES.pangyo, STORES.gwanghwamun];
const FRANCHISE = [STORES.euljiro, STORES.yeonnam, STORES.cheongdam, STORES.bupyeong, STORES.dunsan, STORES.seomyeon, STORES.ilsan];

const FILLER_NAMES = [
  "김하늘", "이도윤", "박서연", "최민준", "정하은", "강지호", "조수아", "윤시우", "장예린", "임도현",
  "한지민", "오준서", "서유나", "신재원", "권나연", "황민서", "안지후", "송다인", "전우진", "홍채원",
  "고은우", "문서진", "양하린", "손지환", "배수빈", "백건우", "허소율", "유태민", "남궁별", "노아린",
];

/** today 에서 n 일 뒤의 날짜(YYYY-MM-DD). */
function day(today: string, n: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** today 에서 n 일 뒤 한국 9시의 시각(ISO). */
const at = (today: string, n: number) => `${day(today, n)}T09:00:00+09:00`;

function staff(over: Partial<StaffRecord> & Pick<StaffRecord, "staffMemberId" | "name" | "phone" | "store">): StaffRecord {
  return {
    isMasked: false,
    employmentType: "PART_TIME",
    joinState: "JOINED",
    invitation: null,
    linkHold: null,
    contract: { contractId: over.staffMemberId, status: "SIGNED", signDeadlineAt: null, endDate: null },
      employmentStatus: "EMPLOYED",
    retiredDate: null,
    ...over,
  };
}

const pending = (id: number) => ({ contractId: id, status: "PENDING_SEND" as const, signDeadlineAt: null, endDate: null });

export function buildMockStaff(today: string): StaffRecord[] {
  // 데모의 열두 줄. id 를 가장 크게 주어 첫 쪽에 데모 순서대로 나온다.
  const demo: StaffRecord[] = [
    staff({ staffMemberId: 69, name: "서지안", phone: "01028417702", store: STORES.seocho, employmentType: "FULL_TIME" }),
    staff({ staffMemberId: 68, name: "오세라", phone: "01033924418", store: STORES.seocho, employmentType: "FULL_TIME" }),
    staff({ staffMemberId: 67, name: "문태경", phone: "01044712298", store: STORES.pangyo, employmentType: "FULL_TIME", retiredDate: day(today, 18) }),
    staff({
      staffMemberId: 66, name: "배정숙", phone: "01088203317", store: STORES.pangyo,
      contract: { contractId: 66, status: "SIGNED", signDeadlineAt: null, endDate: day(today, 20) },
    }),
    staff({
      staffMemberId: 65, name: "남도현", phone: "01090145563", store: STORES.seongsu, joinState: "INVITED", contract: pending(65),
      invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: at(today, -12), expiresAt: at(today, 18) },
    }),
    staff({
      staffMemberId: 64, name: "하준서", phone: "01033924418", store: STORES.seongsu, joinState: "LINK_HOLD", contract: pending(64),
      invitation: { invitationType: "SIGNUP", status: "ACCEPTED", lastSentAt: at(today, -6), expiresAt: at(today, 24) },
      linkHold: { linkHoldId: 1, mismatchReason: "PHONE_MISMATCH", verifiedPhoneLast4: "4418", heldAt: at(today, -4) },
    }),
    staff({
      staffMemberId: 63, name: "정유담", phone: "01055187734", store: STORES.pangyo, joinState: "AFFILIATION_PENDING", contract: pending(63),
      invitation: { invitationType: "AFFILIATION_CONFIRM", status: "SENT", lastSentAt: at(today, -2), expiresAt: at(today, 28) },
    }),
    staff({
      staffMemberId: 62, name: "권도윤", phone: "01077421160", store: STORES.seocho,
      contract: { contractId: 62, status: "PENDING_SIGNATURE", signDeadlineAt: at(today, 24), endDate: null },
    }),
    staff({
      staffMemberId: 61, name: "유하람", phone: "01020938875", store: STORES.seongsu,
      contract: { contractId: 61, status: "REJECTED", signDeadlineAt: null, endDate: null },
    }),
    staff({ staffMemberId: 60, name: "이민서", phone: "01046602231", store: STORES.yeonnam, isMasked: true }),
    staff({
      staffMemberId: 59, name: "민세하", phone: "01077253390", store: STORES.seongsu, joinState: "UNDER_AGE", contract: pending(59),
      invitation: { invitationType: "SIGNUP", status: "REJECTED_UNDER_AGE", lastSentAt: at(today, -9), expiresAt: at(today, 21) },
    }),
    staff({
      staffMemberId: 58, name: "임채운", phone: "01066130284", store: STORES.gwanghwamun, employmentStatus: "RETIRED", retiredDate: day(today, -73),
      contract: { contractId: 58, status: "ENDED", signDeadlineAt: null, endDate: day(today, -73) },
    }),
  ];

  // 나머지 57건: 앞의 6건은 가맹 점포(가린 행), 9의 배수 번째 5건은 퇴직.
  const fillers = Array.from({ length: 57 }, (_, i): StaffRecord => {
    const franchise = i < 6;
    const retired = i > 0 && i % 9 === 0 && i <= 45;
    return staff({
      staffMemberId: 57 - i,
      name: FILLER_NAMES[i % FILLER_NAMES.length],
      phone: `010${String(30000000 + i * 104729).padStart(8, "0")}`,
      store: franchise ? FRANCHISE[i % FRANCHISE.length] : DIRECT[i % DIRECT.length],
      isMasked: franchise,
      employmentType: i % 3 === 0 ? "FULL_TIME" : "PART_TIME",
      employmentStatus: retired ? "RETIRED" : "EMPLOYED",
      retiredDate: retired ? day(today, -30 - i) : null,
      contract: retired
        ? { contractId: 57 - i, status: "ENDED", signDeadlineAt: null, endDate: day(today, -30 - i) }
        : { contractId: 57 - i, status: "SIGNED", signDeadlineAt: null, endDate: null },
    });
  });

  return [...demo, ...fillers];
}
