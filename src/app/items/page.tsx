import { redirect } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { ApiError, getSession, listItems, type Item } from "@/lib/api";

export default async function ItemsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let items: Item[];
  try {
    items = await listItems();
  } catch (error) {
    // 액세스 토큰이 15분을 넘겨 만료되면 401 이다. 다시 로그인시킨다.
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-[0.3em]">
            Whale ERP
          </span>
          <form action={logoutAction} className="flex items-center gap-4">
            <span className="text-sm opacity-60">{session.user.name}</span>
            <button
              type="submit"
              className="text-sm opacity-60 transition-opacity hover:opacity-100"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-baseline gap-4">
          <h1 className="text-sm opacity-60">품목</h1>
          <span className="font-mono text-3xl font-medium tabular-nums">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 max-w-md border-t border-black/10 pt-8 text-sm leading-relaxed opacity-60 dark:border-white/15">
            등록된 품목이 없습니다.
          </p>
        ) : (
          <ul className="mt-8">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border-t border-black/10 py-5 sm:grid-cols-[12rem_1fr_3rem_auto] dark:border-white/15"
              >
                <span className="font-mono text-xs tracking-wider opacity-60 sm:text-sm sm:opacity-100">
                  {item.sku}
                </span>
                <span className="order-last col-span-2 text-base sm:order-none sm:col-span-1 sm:text-lg">
                  {item.name}
                  {/* 단위는 좁은 화면에서도 빠지면 안 되는 값이라 품목명 옆에 붙인다. */}
                  <span className="ml-2 font-mono text-[0.7rem] uppercase tracking-widest opacity-60 sm:hidden">
                    {item.unit}
                  </span>
                </span>
                <span className="hidden font-mono text-[0.7rem] uppercase tracking-widest opacity-60 sm:block">
                  {item.unit}
                </span>
                <span
                  className={`row-span-2 self-center text-right font-mono text-3xl font-medium tabular-nums sm:row-span-1 sm:text-4xl ${
                    item.stock > 0 ? "" : "opacity-40"
                  }`}
                >
                  {item.stock}
                </span>
              </li>
            ))}
            <li className="border-t border-black/10 dark:border-white/15" />
          </ul>
        )}
      </main>
    </div>
  );
}
