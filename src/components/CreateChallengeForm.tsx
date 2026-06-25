"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCustomChallenge } from "@/lib/data/challenges";
import {
  CATEGORY_LABELS,
  Category,
  Difficulty,
  DIFFICULTY_LABELS,
  ProofType,
  PROOF_LABELS,
} from "@/lib/types";

const CATEGORIES: Category[] = [
  "photo",
  "walk",
  "creativity",
  "home",
  "new-experience",
  "self-care",
  "communication",
  "good-deeds",
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const PROOF_TYPES: ProofType[] = ["photo", "text", "checkbox"];

export default function CreateChallengeForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("photo");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [proofType, setProofType] = useState<ProofType>("photo");
  const [forMode, setForMode] = useState<"single" | "pair" | "friends">("single");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: submitError } = await createCustomChallenge(supabase, userId, {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      proofType,
      forMode,
      isPublic,
    });
    setBusy(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-5xl">🌱</div>
        <h1 className="mt-4 text-2xl font-bold">
          {isPublic ? "Отправлено на модерацию" : "Челлендж сохранён"}
        </h1>
        <p className="mt-2 text-zinc-500">
          {isPublic
            ? "Публичные челленджи проверяются командой перед тем, как попасть в общую библиотеку."
            : "Приватный челлендж сразу доступен только тебе."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white"
        >
          На главный экран
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight">Создать челлендж</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Добавь свой челлендж в библиотеку — для себя или для всех.
      </p>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Фотографии людей модерацией не принимаются — доказательством может
        быть только результат, место или предмет.
      </div>

      <label className="mt-6 block text-sm font-medium text-zinc-700">Название</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Например: испечь хлеб, который никогда не пекла"
        className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
      />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Описание</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Что нужно сделать и как подтвердить выполнение"
        className="mt-1 w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
      />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Категория</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              category === c ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700">Сложность</label>
      <div className="mt-1 flex gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
              difficulty === d
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700">
        Тип доказательства
      </label>
      <div className="mt-1 flex gap-2">
        {PROOF_TYPES.map((p) => (
          <button
            key={p}
            onClick={() => setProofType(p)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
              proofType === p
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {PROOF_LABELS[p]}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700">Для кого</label>
      <div className="mt-1 flex gap-2">
        {(
          [
            ["single", "Одному"],
            ["pair", "Пары"],
            ["friends", "Друзей"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setForMode(value)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
              forMode === value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-200 p-4">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-5 w-5"
        />
        <span className="text-sm">
          <span className="font-medium">Опубликовать в общую библиотеку</span>
          <br />
          <span className="text-zinc-500">
            Пройдёт модерацию. Если выключить — останется только у тебя.
          </span>
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || busy}
        className="mt-6 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
      >
        {busy ? "Сохраняем…" : "Создать челлендж"}
      </button>
    </div>
  );
}
