"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPairLink, joinPairLink } from "@/lib/data/pair";
import type { PairLink } from "@/lib/data/pair";

export default function PairInvite({
  userId,
  existingLink,
}: {
  userId: string;
  existingLink: PairLink | null;
}) {
  const router = useRouter();
  const [link, setLink] = useState<PairLink | null>(existingLink);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const referralUrl = link
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/pair/join/${link.referralCode}`
    : null;

  const handleCreateLink = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ mode: "pair" })
      .eq("id", userId);
    const { link: created, error: createError } = await createPairLink(
      supabase,
      userId
    );
    setBusy(false);
    if (createError) {
      setError(createError);
      return;
    }
    setLink(created);
  };

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: joinError } = await joinPairLink(
      supabase,
      joinCode.trim(),
      userId
    );
    if (joinError) {
      setBusy(false);
      setError(joinError);
      return;
    }
    await supabase.from("profiles").update({ mode: "pair" }).eq("id", userId);
    setBusy(false);
    router.refresh();
  };

  if (link && !link.userB) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-5xl">💌</div>
        <h1 className="mt-4 text-2xl font-bold">Ждём партнёра</h1>
        <p className="mt-2 text-zinc-500">
          Отправь эту ссылку близкому человеку — как только он перейдёт по
          ней, пара будет готова.
        </p>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 break-all">
          {referralUrl}
        </div>
        <button
          onClick={() => referralUrl && navigator.clipboard.writeText(referralUrl)}
          className="mt-4 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white"
        >
          Скопировать ссылку
        </button>
        <button
          onClick={() => router.refresh()}
          className="mt-2 w-full py-2 text-sm text-zinc-400"
        >
          Партнёр уже подключился? Обновить
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="text-5xl">💞</div>
      <h1 className="mt-4 text-2xl font-bold">Парный режим</h1>
      <p className="mt-2 text-zinc-500">
        Подключите близкого человека по реферальной ссылке, чтобы выполнять
        челленджи вместе. Приложение никого не знакомит — только между уже
        знакомыми людьми.
      </p>
      <button
        onClick={handleCreateLink}
        disabled={busy}
        className="mt-8 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
      >
        Получить ссылку для партнёра
      </button>

      <p className="mt-6 text-sm text-zinc-400">или, если у тебя есть код от партнёра:</p>
      <input
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
        placeholder="код приглашения"
        className="mt-2 w-full rounded-xl border border-zinc-200 p-3 text-sm text-center focus:border-zinc-400 focus:outline-none"
      />
      <button
        onClick={handleJoin}
        disabled={busy || !joinCode.trim()}
        className="mt-2 w-full rounded-full border border-zinc-300 py-3 text-sm font-medium text-zinc-700 disabled:opacity-30"
      >
        Подключиться
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
