"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { chooseChallengeForDay, submitSolution } from "@/lib/data/pair";
import {
  CATEGORY_LABELS,
  Challenge,
  DIFFICULTY_LABELS,
  PAIR_SUBMISSION_LABELS,
} from "@/lib/types";

export default function PairBoard({
  pairDayId,
  userId,
  isChooserToday,
  challenge,
  pairChallenges,
  mySolutionSubmitted,
  partnerSolutionSubmitted,
  mySolutionText,
  partnerSolutionText,
}: {
  pairDayId: string;
  userId: string;
  isChooserToday: boolean;
  challenge: Challenge | null;
  pairChallenges: Challenge[];
  mySolutionSubmitted: boolean;
  partnerSolutionSubmitted: boolean;
  mySolutionText: string | null;
  partnerSolutionText: string | null;
}) {
  const router = useRouter();

  const handlePick = async (challengeId: string) => {
    const supabase = createClient();
    await chooseChallengeForDay(supabase, pairDayId, challengeId);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Челлендж пары</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isChooserToday
            ? "Сегодня твой день выбирать — завтра очередь партнёра."
            : "Сегодня день сюрприза — партнёр выбирает челлендж для вас обоих."}
        </p>
      </header>

      {!challenge ? (
        isChooserToday ? (
          <ChallengePicker options={pairChallenges} onPick={handlePick} />
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            Партнёр ещё не выбрал челлендж дня. Загляни чуть позже.
          </div>
        )
      ) : challenge.pairSubmissionType === "joint" ? (
        <JointChallenge
          pairDayId={pairDayId}
          userId={userId}
          challenge={challenge}
          isChooserToday={isChooserToday}
          submitted={mySolutionSubmitted || partnerSolutionSubmitted}
          resultText={mySolutionText ?? partnerSolutionText}
        />
      ) : (
        <SeparateChallenge
          pairDayId={pairDayId}
          userId={userId}
          challenge={challenge}
          isChooserToday={isChooserToday}
          mySubmitted={mySolutionSubmitted}
          partnerSubmitted={partnerSolutionSubmitted}
          mySolutionText={mySolutionText}
          partnerSolutionText={partnerSolutionText}
        />
      )}
    </div>
  );
}

function ChallengePicker({
  options,
  onPick,
}: {
  options: Challenge[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-700">
        Выбери челлендж дня для вас двоих
      </h2>
      <div className="flex flex-col gap-2">
        {options.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className="rounded-xl border border-zinc-200 bg-white p-3 text-left hover:border-zinc-400"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">{CATEGORY_LABELS[c.category]}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500">{DIFFICULTY_LABELS[c.difficulty]}</span>
              <span
                className={`rounded-full px-2 py-0.5 ${
                  c.pairSubmissionType === "joint"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {PAIR_SUBMISSION_LABELS[c.pairSubmissionType!]}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{c.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{c.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChallengeSummary({ challenge }: { challenge: Challenge }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span>{CATEGORY_LABELS[challenge.category]}</span>
        <span>•</span>
        <span>{DIFFICULTY_LABELS[challenge.difficulty]}</span>
        <span>•</span>
        <span className={challenge.pairSubmissionType === "joint" ? "text-sky-600" : "text-violet-600"}>
          {PAIR_SUBMISSION_LABELS[challenge.pairSubmissionType!]}
        </span>
      </div>
      <h2 className="mt-1 text-lg font-semibold">{challenge.title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{challenge.description}</p>
    </div>
  );
}

function JointChallenge({
  pairDayId,
  userId,
  challenge,
  isChooserToday,
  submitted,
  resultText,
}: {
  pairDayId: string;
  userId: string;
  challenge: Challenge;
  isChooserToday: boolean;
  submitted: boolean;
  resultText: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: submitError } = await submitSolution(supabase, {
      pairDayId,
      userId,
      text: text.trim(),
    });
    setBusy(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <ChallengeSummary challenge={challenge} />
      <p className="mt-3 text-xs text-sky-700">
        Это совместный челлендж — доказательство одно на двоих, грузит тот,
        кто выполняет его сейчас. Партнёр увидит результат без своей загрузки.
      </p>

      {!submitted ? (
        <div className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Опиши совместный результат — предмет или место, без лиц"
            rows={3}
            className="w-full resize-none rounded-2xl border border-zinc-200 p-4 text-sm focus:border-zinc-400 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || busy}
            className="mt-3 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
          >
            {busy ? "Сохраняем…" : "Завершить совместный челлендж"}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">🎉 Готово! Общий результат сохранён.</p>
          {resultText && <p className="mt-2 text-sm text-emerald-700">«{resultText}»</p>}
        </div>
      )}

      {!isChooserToday && (
        <p className="mt-3 text-xs text-zinc-400">
          У тебя есть право на один отказ/замену, если предложенное не подходит.
        </p>
      )}
    </>
  );
}

function SeparateChallenge({
  pairDayId,
  userId,
  challenge,
  isChooserToday,
  mySubmitted,
  partnerSubmitted,
  mySolutionText,
  partnerSolutionText,
}: {
  pairDayId: string;
  userId: string;
  challenge: Challenge;
  isChooserToday: boolean;
  mySubmitted: boolean;
  partnerSubmitted: boolean;
  mySolutionText: string | null;
  partnerSolutionText: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bothSubmitted = mySubmitted && partnerSubmitted;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: submitError } = await submitSolution(supabase, {
      pairDayId,
      userId,
      text: text.trim(),
    });
    setBusy(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <ChallengeSummary challenge={challenge} />
      <p className="mt-3 text-xs text-violet-700">
        Это раздельный челлендж — каждый загружает своё доказательство
        отдельно. Результаты раскрываются одновременно, как только оба
        готовы.
      </p>

      {!isChooserToday && (
        <p className="mt-3 text-xs text-zinc-400">
          У тебя есть право на один отказ/замену, если предложенное не подходит.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 text-center ${mySubmitted ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
          <p className="text-xs text-zinc-500">Ты</p>
          <p className="mt-1 font-medium">{mySubmitted ? "Готово ✅" : "Ждём твой ход"}</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${partnerSubmitted ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
          <p className="text-xs text-zinc-500">Партнёр</p>
          <p className="mt-1 font-medium">{partnerSubmitted ? "Готово ✅" : "Ещё не отправил(а)"}</p>
        </div>
      </div>

      {!mySubmitted ? (
        <div className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Своё доказательство — текст или описание предмета/места, без лиц"
            rows={3}
            className="w-full resize-none rounded-2xl border border-zinc-200 p-4 text-sm focus:border-zinc-400 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || busy}
            className="mt-3 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
          >
            {busy ? "Сохраняем…" : "Отправить своё решение"}
          </button>
        </div>
      ) : bothSubmitted ? (
        <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">🎉 Оба готовы — решения раскрыты!</p>
          {mySolutionText && <p className="mt-2 text-sm text-emerald-700">Твой ответ: «{mySolutionText}»</p>}
          {partnerSolutionText && <p className="mt-1 text-sm text-emerald-700">Ответ партнёра: «{partnerSolutionText}»</p>}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
          Твоё решение отправлено. Раскроется, как только партнёр тоже отправит своё.
        </div>
      )}
    </>
  );
}
