"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitProof } from "@/lib/data/history";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TIME,
  CATEGORY_LABELS,
  Challenge,
  ProofType,
} from "@/lib/types";

const PROOF_OPTIONS: { type: ProofType; label: string; icon: string }[] = [
  { type: "photo", label: "Фото", icon: "📷" },
  { type: "text", label: "Текст", icon: "✍️" },
  { type: "checkbox", label: "Сделано", icon: "✅" },
];

export default function ChallengeExecution(props: {
  challenge: Challenge | null;
  userId: string | null;
  isSubscribed: boolean;
}) {
  return (
    <Suspense>
      <ChallengeExecutionContent {...props} />
    </Suspense>
  );
}

function ChallengeExecutionContent({
  challenge,
  userId,
  isSubscribed,
}: {
  challenge: Challenge | null;
  userId: string | null;
  isSubscribed: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isOwn = challenge === null;
  const ownText = searchParams.get("text") ?? "";

  const [proofType, setProofType] = useState<ProofType>(
    challenge?.proofType ?? "photo"
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [textProof, setTextProof] = useState("");
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    (proofType === "photo" && Boolean(photoFile)) ||
    (proofType === "text" && textProof.trim().length > 0) ||
    (proofType === "checkbox" && done);

  const handleSubmit = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: submitError } = await submitProof(supabase, {
      userId,
      challengeId: isOwn ? null : challenge!.id,
      challengeTitle: isOwn ? ownText : challenge!.title,
      category: isOwn ? "custom" : challenge!.category,
      difficulty: isOwn ? "medium" : challenge!.difficulty,
      proofType,
      proofText: proofType === "text" ? textProof.trim() : undefined,
      photoFile: proofType === "photo" ? photoFile ?? undefined : undefined,
      isSubscribed,
    });

    setSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold">День засчитан!</h1>
        <p className="mt-2 text-zinc-500">Серия продолжается.</p>
        <button
          onClick={() => router.push("/history")}
          className="mt-8 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white"
        >
          Смотреть историю
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-zinc-500"
      >
        ← Назад
      </button>

      {isOwn ? (
        <>
          <span className="text-xs font-medium text-zinc-500">
            Свой челлендж
          </span>
          <h1 className="mt-1 text-2xl font-bold">{ownText}</h1>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span>{CATEGORY_LABELS[challenge!.category]}</span>
            <span>•</span>
            <span>{DIFFICULTY_LABELS[challenge!.difficulty]}</span>
            <span>•</span>
            <span>{DIFFICULTY_TIME[challenge!.difficulty]}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{challenge!.title}</h1>
          <p className="mt-2 text-zinc-600">{challenge!.description}</p>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Без лиц.</strong> Не снимай людей — снимай результат, место
        или предмет.
      </div>

      <h2 className="mt-8 text-sm font-semibold text-zinc-700">
        Прикрепи доказательство
      </h2>
      <div className="mt-3 flex gap-2">
        {PROOF_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setProofType(opt.type)}
            className={`flex-1 rounded-xl border py-3 text-sm font-medium ${
              proofType === opt.type
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            <div className="text-lg">{opt.icon}</div>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {proofType === "photo" && (
          <label
            className={`flex h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed text-sm cursor-pointer ${
              photoFile
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-zinc-300 text-zinc-400"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            {photoFile ? (
              <>
                <span className="text-2xl">✅</span>
                {photoFile.name}
              </>
            ) : (
              <>
                <span className="text-2xl">📷</span>
                Нажми, чтобы прикрепить фото
              </>
            )}
          </label>
        )}

        {proofType === "text" && (
          <textarea
            value={textProof}
            onChange={(e) => setTextProof(e.target.value)}
            placeholder="Расскажи в двух словах, как прошёл челлендж"
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-200 p-4 text-sm focus:border-zinc-400 focus:outline-none"
          />
        )}

        {proofType === "checkbox" && (
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium">Сделано</span>
          </label>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="mt-8 w-full rounded-full bg-zinc-900 py-3.5 font-semibold text-white disabled:opacity-30"
      >
        {submitting ? "Сохраняем…" : "Завершить челлендж"}
      </button>
    </div>
  );
}
