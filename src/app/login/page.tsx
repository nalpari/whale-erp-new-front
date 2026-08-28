"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">WHALE ERP</h1>
        <p className="mt-2 text-sm opacity-60">고객 포털</p>

        <form action={formAction} className="mt-10 flex flex-col gap-6">
          <div>
            <label htmlFor="email" className="block text-sm opacity-70">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              defaultValue={state?.email ?? ""}
              className="mt-2 h-11 w-full rounded border border-black/15 bg-transparent px-3 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:focus:border-white/60"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm opacity-70">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 h-11 w-full rounded border border-black/15 bg-transparent px-3 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:focus:border-white/60"
            />
          </div>

          {state ? (
            <p role="alert" className="text-sm leading-relaxed text-red-600">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? "확인 중" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
