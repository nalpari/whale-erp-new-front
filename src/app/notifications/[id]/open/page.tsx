import { OpenNotification } from "./open-notification";

// 알림 → 업무 화면 이동(#255). 알림함 · 종이 이 주소로 온다(메일 버튼은 업무 화면으로 바로 간다, 운영 정책 NTF-03).
// 이 페이지를 불러오는 것(GET)으로는 아무것도 바꾸지 않는다 — 화면에 실제로 뜬 뒤에 읽음 처리한다(OpenNotification).
export default async function OpenNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return <OpenNotification id={Number.isInteger(id) && id >= 1 ? id : null} />;
}
