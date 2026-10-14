import type { ReactNode } from "react";
import { Button } from "@/components/common";

// 로그인 전 홈(데모 home/index.html). 상단 메뉴 넷(/#ops 등)은 이 페이지 안의 구획으로 내려간다.
const WRAP = "mx-auto w-[1200px] px-[24px]";

// 구획. 바탕은 흰색과 #f8f9fb 를 번갈아 쓴다. 70px 는 고정된 상단 메뉴 높이다.
function Section({ id, soft, tag, title, lead, children }: { id: string; soft?: boolean; tag: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-[70px] border-t border-erp-bar-line py-[48px] ${soft ? "bg-erp-thead-bg" : "bg-white"}`}>
      <div className={`${WRAP} flex flex-col gap-[24px]`}>
        <div className="flex max-w-[60ch] flex-col gap-[10px]">
          <p className="text-[14px] font-medium text-erp-label">{tag}</p>
          <h2 className="text-[22px] font-semibold">{title}</h2>
          <p className="text-[15px] leading-[1.6]">{lead}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

// 소개 카드(그림자 없는 4px 카드)
function Card({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[10px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
      <p className="flex items-center">
        <b className="flex-1 text-[16px] font-semibold">{title}</b>
        {tag && <span className="text-[13px] text-erp-label">{tag}</span>}
      </p>
      <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>
    </div>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;

export default function PublicHome() {
  return (
    <>
      <section className="bg-white py-[72px]">
        <div className={`${WRAP} flex flex-col items-center gap-[18px] text-center`}>
          <p className="text-[14px] font-medium text-erp-label">다점포 · 프랜차이즈 점포 운영 플랫폼</p>
          <h1 className="text-[22px] leading-[1.4] font-semibold">
            점포가 늘어도
            <br />
            관리는 한 곳에서
          </h1>
          <p className="max-w-[54ch] text-[15px] leading-[1.6]">
            직원 채용부터 근무·급여까지, 점포마다 흩어지던 일을 하나의 기준으로 모읍니다. 직영과 가맹을 함께 운영해도 범위만 바꿔 같은 화면에서 봅니다.
          </p>
          <div className="flex gap-[6px]">
            <Button href="/signup">사업자 회원가입</Button>
            <Button href="/inquiry" variant="soft">
              도입문의
            </Button>
          </div>
          <Note>
            직원은 이 화면이 아니라 <b className="font-semibold text-erp-ink">직원 전용 앱</b>으로 들어갑니다.
          </Note>
        </div>
      </section>

      <Section
        id="ops"
        tag="매장운영"
        title="사람과 근무를 한 화면에서"
        lead="근로계약서 초안을 쓰면 초대가 자동으로 나갑니다. 가입이 끝나는 순간 계약서가 발송되고, 근무스케줄과 출퇴근이 급여명세서 초안까지 이어집니다."
      >
        <div className="grid grid-cols-3 gap-[12px]">
          <Card title="직원 · 근로계약">근로계약서 초안이 채용의 시작점입니다. 상태는 발송 대기부터 종료까지 여섯 단계로 남습니다.</Card>
          <Card title="근무스케줄">하루 근무를 시간축에 겹쳐 놓아 사람이 비는 시간과 몰리는 시간을 눈으로 찾습니다.</Card>
          <Card title="급여명세서">계약과 출퇴근을 참조해 초안을 만듭니다. 검토가 필요한 건은 사유와 함께 따로 모입니다.</Card>
        </div>
      </Section>

      <Section id="finance" soft tag="재무관리" title="들어온 돈과 나간 돈" lead="입출금과 거래를 등록하고 계정별로 현황을 봅니다. 부가서비스 구독으로 사용합니다." />

      <Section
        id="franchise"
        tag="프랜차이즈"
        title="본사가 정하면 가맹으로 내려갑니다"
        lead="가맹점을 초대하고 계약서를 관리합니다. 기초정보는 본사가 정한 것을 가맹이 그대로 씁니다."
      >
        <div className="grid grid-cols-2 gap-[12px]">
          <Card title="본사 · BP Master" tag="직접 관리">
            기초정보와 계약서 템플릿을 만들고, 가맹점을 초대해 계약을 맺습니다.
          </Card>
          <Card title="가맹 · 가맹 Master" tag="조회 전용 일부">
            본사가 정한 기초정보는 보기만 하고, 자기 점포의 직원과 근무는 직접 관리합니다.
          </Card>
        </div>
      </Section>

      <Section id="addons" soft tag="부가서비스" title="필요한 것만 구독합니다" lead="POS·KIOSK·주문·예약처럼 점포마다 다른 기능은 구독으로 붙입니다.">
        <div className="grid w-[720px] grid-cols-3 gap-[12px]">
          {["POS", "KIOSK", "QR 주문", "예약", "재고", "레시피"].map((t) => (
            <span key={t} className="flex h-[46px] items-center justify-center rounded-[4px] border border-erp-panel-line bg-white text-[14px] font-medium">
              {t}
            </span>
          ))}
        </div>
        <Note>구독한 상품은 로그인 후 홈의 바로가기에 나타납니다.</Note>
      </Section>

      <section className="border-t border-erp-bar-line bg-white py-[48px]">
        <div className={`${WRAP} flex items-center gap-[24px]`}>
          <div className="flex flex-1 flex-col gap-[10px]">
            <h2 className="text-[22px] font-semibold">먼저 물어보셔도 됩니다</h2>
            <p className="text-[15px]">가입 전에 도입 상담을 받을 수 있습니다. 로그인은 필요하지 않습니다.</p>
          </div>
          <Button href="/inquiry">도입문의 남기기</Button>
        </div>
      </section>
    </>
  );
}
