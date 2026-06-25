import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, getHistoryForUser } from "@/lib/data/history";
import { CATEGORY_LABELS } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // proxy.ts уже отправит на /login
  }

  const history = await getHistoryForUser(supabase, user.id);
  const streak = computeStreak(history);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">История</h1>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-orange-800">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-lg font-bold leading-none">
              {streak} {streak === 1 ? "день" : "дней"} подряд
            </p>
            <p className="text-xs text-orange-600">
              Серия хранится бесплатно и навсегда
            </p>
          </div>
        </div>
      </header>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Пока нет выполненных челленджей — начни с главного экрана.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-xl">
                {entry.photoUrl ? (
                  <Image
                    src={entry.photoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : entry.proofType === "checkbox" ? (
                  "✅"
                ) : (
                  "📷"
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-400">
                  {new Date(entry.date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {CATEGORY_LABELS[entry.category]}
                </p>
                <p className="font-medium">{entry.challengeTitle}</p>
                {entry.proofType === "text" && entry.proofPreview && (
                  <p className="mt-1 text-sm text-zinc-500">
                    «{entry.proofPreview}»
                  </p>
                )}
                {entry.photoExpired && (
                  <p className="mt-1 text-xs text-amber-600">
                    Фото истекло — оформите подписку, чтобы хранить
                    воспоминания
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
