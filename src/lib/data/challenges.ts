import type { SupabaseClient } from "@supabase/supabase-js";
import { Challenge, Difficulty } from "@/lib/types";

interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  category: Challenge["category"];
  difficulty: Difficulty;
  proof_type: Challenge["proofType"];
  for_mode: Challenge["forMode"];
  pair_submission_type: Challenge["pairSubmissionType"] | null;
  is_custom: boolean;
}

function mapRow(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    proofType: row.proof_type,
    forMode: row.for_mode,
    pairSubmissionType: row.pair_submission_type ?? undefined,
    isCustom: row.is_custom,
  };
}

/** Простой детерминированный хэш строки в число — чтобы у всех пользователей
 * был один и тот же набор челленджей в течение дня, без отдельной таблицы. */
function dateSeed(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Дневная подборка: 2 челленджа на каждую сложность, из разных категорий,
 * одинаковая для всех пользователей в течение календарного дня. */
export async function getDailyChallenges(
  supabase: SupabaseClient,
  date: string = new Date().toISOString().slice(0, 10)
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, title, description, category, difficulty, proof_type, for_mode, pair_submission_type, is_custom"
    )
    .eq("for_mode", "single")
    .eq("status", "published")
    .eq("is_public", true);

  if (error || !data) return [];

  const all = (data as ChallengeRow[]).map(mapRow);
  const seed = dateSeed(date);

  const pickTwo = (difficulty: Difficulty): Challenge[] => {
    const pool = seededShuffle(
      all.filter((c) => c.difficulty === difficulty),
      seed + difficulty.length
    );
    const usedCategories = new Set<string>();
    const picked: Challenge[] = [];
    for (const c of pool) {
      if (picked.length === 2) break;
      if (usedCategories.has(c.category)) continue;
      picked.push(c);
      usedCategories.add(c.category);
    }
    return picked;
  };

  return [...pickTwo("easy"), ...pickTwo("medium"), ...pickTwo("hard")];
}

export async function getChallengeById(
  supabase: SupabaseClient,
  id: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, title, description, category, difficulty, proof_type, for_mode, pair_submission_type, is_custom"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as ChallengeRow);
}

export async function getPairChallenges(
  supabase: SupabaseClient
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, title, description, category, difficulty, proof_type, for_mode, pair_submission_type, is_custom"
    )
    .eq("for_mode", "pair")
    .eq("status", "published")
    .eq("is_public", true);

  if (error || !data) return [];
  return (data as ChallengeRow[]).map(mapRow);
}

export async function createCustomChallenge(
  supabase: SupabaseClient,
  userId: string,
  input: {
    title: string;
    description: string;
    category: Challenge["category"];
    difficulty: Difficulty;
    proofType: Challenge["proofType"];
    forMode: Challenge["forMode"];
    isPublic: boolean;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("challenges").insert({
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    proof_type: input.proofType,
    for_mode: input.forMode,
    is_custom: true,
    is_public: input.isPublic,
    created_by: userId,
    // Публичные/отправляемые партнёру челленджи проходят модерацию — см. ТЗ §5.6
    status: input.isPublic ? "pending_review" : "published",
  });

  return { error: error?.message ?? null };
}
