import { Challenge, DIFFICULTY_LABELS, DIFFICULTY_TIME, CATEGORY_LABELS, PROOF_LABELS } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  photo: "📸",
  walk: "🚶",
  creativity: "🎨",
  home: "🏡",
  "new-experience": "🌟",
  "self-care": "🧘",
  communication: "💬",
  pair: "💞",
  friends: "👥",
  "good-deeds": "💛",
};

export default function ChallengeCard({
  challenge,
  selected,
  onSelect,
}: {
  challenge: Challenge;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white hover:border-zinc-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {CATEGORY_EMOJI[challenge.category]}
          </span>
          <span
            className={`text-xs font-medium ${
              selected ? "text-zinc-300" : "text-zinc-500"
            }`}
          >
            {CATEGORY_LABELS[challenge.category]}
          </span>
        </div>
        <span
          className={`text-xs rounded-full px-2 py-1 ${
            selected ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {DIFFICULTY_LABELS[challenge.difficulty]}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold">{challenge.title}</h3>
      <p
        className={`mt-1 text-sm ${
          selected ? "text-zinc-300" : "text-zinc-600"
        }`}
      >
        {challenge.description}
      </p>

      <div
        className={`mt-3 flex items-center gap-3 text-xs ${
          selected ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        <span>⏱ {DIFFICULTY_TIME[challenge.difficulty]}</span>
        <span>•</span>
        <span>Доказательство: {PROOF_LABELS[challenge.proofType]}</span>
      </div>
    </button>
  );
}
