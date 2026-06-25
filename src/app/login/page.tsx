"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });
    setStatus(error ? "error" : "sent");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4">
      <div className="text-4xl">✨</div>
      <h1 className="mt-3 text-2xl font-bold">День‑приключение</h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Войди по email — пришлём ссылку для входа, без пароля.
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          Письмо отправлено на {email}. Открой ссылку из письма, чтобы войти.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-3 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
          >
            {status === "sending" ? "Отправляем…" : "Получить ссылку для входа"}
          </button>
          {status === "error" && (
            <p className="mt-2 text-center text-sm text-red-600">
              Не получилось отправить письмо. Проверь адрес и попробуй снова.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
