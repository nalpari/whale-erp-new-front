import { GuestFooter } from "./guest-footer";
import { GuestHeader } from "./guest-header";
import { GUEST_FONTS } from "./fonts";

// 비로그인 화면들의 틀. 머리말·푸터와 영문 글꼴을 한 번만 둔다.
// 화면 사이 이동은 머리말 메뉴와 본문 버튼으로 한다 — 디자인 샘플 아래 이동 메뉴에는 메인(/design/guest)만 둔다.
export default function GuestLayout({ children }: LayoutProps<"/design/guest">) {
  return (
    <div className={`${GUEST_FONTS} min-w-[1720px] bg-white break-keep`}>
      <GuestHeader />
      {children}
      <GuestFooter />
    </div>
  );
}
