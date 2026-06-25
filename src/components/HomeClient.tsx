"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Challenge, Difficulty, DIFFICULTY_LABELS } from "@/lib/types";
import ChallengeCard from "@/components/ChallengeCard";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function HomeClient({
  challenges,
}: {
  challenges: Challenge[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [ownChallenge, setOwnChallenge] = useState("");
  const [showOwnInput, setShowOwnInput] = useState(false);

  const visibleChallenges = challenges.filter(
    (c) => difficultyFilter === "all" || c.difficulty === difficultyFilter
  );

  const handleStart = () => {
    if (selectedId) {
      router.push(`/challenge/${selectedId}`);
    } else if (ownChallenge.trim()) {
      router.push(`/challenge/own?text=${encodeURIComponent(ownChallenge.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <p className="text-sm text-zinc-500">
          {new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Выбери своё приключение дня
        </h1>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setDifficultyFilter("all")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
            difficultyFilter === "all"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Все
        </button>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              difficultyFilter === d
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {challenges.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Пока нет опубликованных челленджей — загляни позже.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              selected={selectedId === challenge.id}
              onSelect={() => {
                setSelectedId(challenge.id);
                setShowOwnInput(false);
                setOwnChallenge("");
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        {!showOwnInput ? (
          <button
            onClick={() => {
              setShowOwnInput(true);
              setSelectedId(null);
            }}
            className="w-full rounded-2xl border border-dashed border-zinc-300 p-4 text-center text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
          >
            + Вписать свой челлендж на сегодня
          </button>
        ) : (
          <div className="rounded-2xl border border-zinc-300 bg-white p-4">
            <label className="text-sm font-medium text-zinc-700">
              Твой челлендж на сегодня
            </label>
            <textarea
              value={ownChallenge}
              onChange={(e) => setOwnChallenge(e.target.value)}
              placeholder="Например: испечь хлеб, который никогда не пекла"
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
              rows={3}
              autoFocus
            />
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={!selectedId && !ownChallenge.trim()}
        className="mt-6 w-full rounded-full bg-zinc-900 py-3.5 text-center font-semibold text-white disabled:opacity-30"
      >
        Начать челлендж
      </button>

      <button
        onClick={() => router.push("/create")}
        className="mt-3 w-full py-2 text-center text-sm text-zinc-400 underline"
      >
        Предложить челлендж в библиотеку
      </button>
    </div>
  );
}
