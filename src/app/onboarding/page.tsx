"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AVATARS = ["🌿", "🌙", "☀️", "🌊", "🔥", "🌸", "🦊", "🐢"];

const STEPS = [
  {
    title: "Каждый день — маленькое приключение",
    text: "Это не трекер задач и не соцсеть. Это дневник дней, не похожих на вчерашний.",
    emoji: "✨",
  },
  {
    title: "Без лиц",
    text: "Доказательством никогда не является фотография человека — снимаем результат, место или предмет.",
    emoji: "🙈",
  },
  {
    title: "1 день = 1 челлендж",
    text: "Выбери один из пяти вариантов или впиши свой — и сохрани день в историю.",
    emoji: "🗓️",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [birthDate, setBirthDate] = useState("");
  const [mode, setMode] = useState<"single" | "pair">("single");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isIntro = step < STEPS.length;

  const handleFinish = async () => {
    if (!name.trim() || !birthDate) {
      setError("Заполни имя и дату рождения.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        avatar_emoji: avatar,
        birth_date: birthDate,
        mode,
      })
      .eq("id", user.id);

    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (isIntro) {
    const current = STEPS[step];
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl">{current.emoji}</div>
        <h1 className="mt-4 text-2xl font-bold">{current.title}</h1>
        <p className="mt-2 text-zinc-500">{current.text}</p>

        <div className="mt-8 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i === step ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setStep((s) => s + 1)}
          className="mt-8 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white"
        >
          {step === STEPS.length - 1 ? "Создать профиль" : "Далее"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-bold">Расскажи о себе</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Это базовая информация для профиля — без неё не получится начать.
      </p>

      <label className="mt-6 block text-sm font-medium text-zinc-700">Имя</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Как тебя называть"
        className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
      />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Аватар</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => setAvatar(a)}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
              avatar === a ? "bg-zinc-900" : "bg-zinc-100"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700">
        Дата рождения
      </label>
      <input
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
      />

      <label className="mt-4 block text-sm font-medium text-zinc-700">
        В каком режиме начнёшь?
      </label>
      <div className="mt-1 flex gap-2">
        {(
          [
            ["single", "Один"],
            ["pair", "Пара"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
              mode === value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleFinish}
        disabled={busy}
        className="mt-6 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
      >
        {busy ? "Сохраняем…" : "Начать"}
      </button>
    </div>
  );
}
