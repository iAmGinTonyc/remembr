"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileClient({
  name,
  avatarEmoji,
  level,
  isSubscribed,
  streak,
  badges,
}: {
  name: string;
  avatarEmoji: string;
  level: number;
  isSubscribed: boolean;
  streak: number;
  badges: string[];
}) {
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-3xl">
          {avatarEmoji}
        </div>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-sm text-zinc-500">Уровень {level}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs text-zinc-500">дней серии</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold">{badges.length}</p>
          <p className="text-xs text-zinc-500">бейджей</p>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-zinc-700">Бейджи</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Выполни первый челлендж, чтобы получить бейдж.
          </p>
        ) : (
          badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
            >
              🏅 {badge}
            </span>
          ))
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="font-medium">Хранение фото-воспоминаний</p>
        <p className="mt-1 text-sm text-zinc-500">
          {isSubscribed
            ? "Подписка активна — фото хранятся всегда."
            : "Бесплатный тариф: фото истекают через 30 дней."}
        </p>
        {!isSubscribed && (
          <button
            onClick={() => setShowPaywall(true)}
            className="mt-3 w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white"
          >
            Сохранять воспоминания навсегда
          </button>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="mt-8 w-full rounded-full border border-zinc-200 py-3 text-sm font-medium text-zinc-500"
      >
        Выйти
      </button>

      {showPaywall && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <p className="text-center text-3xl">🖼️</p>
            <h3 className="mt-2 text-center text-lg font-bold">
              Сохранить это воспоминание?
            </h3>
            <p className="mt-2 text-center text-sm text-zinc-500">
              Подпишись, чтобы фото из твоих приключений хранились вечно, а
              не истекали через 30 дней.
            </p>
            <button className="mt-5 w-full rounded-full bg-zinc-900 py-3 font-semibold text-white">
              Оформить подписку
            </button>
            <button
              onClick={() => setShowPaywall(false)}
              className="mt-2 w-full py-2 text-sm text-zinc-400"
            >
              Не сейчас
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
