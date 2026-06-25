import type { SupabaseClient } from "@supabase/supabase-js";
import { Category, Difficulty, HistoryEntry, ProofType } from "@/lib/types";

interface HistoryRow {
  id: string;
  challenge_title: string;
  category: Category;
  difficulty: Difficulty;
  proof_type: ProofType;
  proof_text: string | null;
  proof_photo_path: string | null;
  photo_expires_at: string | null;
  completed_at: string;
}

async function mapRow(
  supabase: SupabaseClient,
  row: HistoryRow
): Promise<HistoryEntry> {
  const photoExpired = Boolean(
    row.photo_expires_at && new Date(row.photo_expires_at) < new Date()
  );

  let photoUrl: string | undefined;
  if (row.proof_photo_path && !photoExpired) {
    const { data } = await supabase.storage
      .from("proofs")
      .createSignedUrl(row.proof_photo_path, 60 * 60);
    photoUrl = data?.signedUrl;
  }

  return {
    id: row.id,
    date: row.completed_at,
    challengeTitle: row.challenge_title,
    category: row.category,
    proofType: row.proof_type,
    proofPreview: row.proof_text ?? undefined,
    photoUrl,
    photoExpired,
  };
}

export async function getHistoryForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("history_entries")
    .select(
      "id, challenge_title, category, difficulty, proof_type, proof_text, proof_photo_path, photo_expires_at, completed_at"
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error || !data) return [];
  return Promise.all((data as HistoryRow[]).map((row) => mapRow(supabase, row)));
}

/** Серия дней подряд, считая от сегодня/вчера назад по completed_at. */
export function computeStreak(entries: HistoryEntry[]): number {
  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  // Если сегодня ещё не выполнен — серия считается со вчерашнего дня.
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface SubmitProofInput {
  userId: string;
  challengeId: string | null;
  challengeTitle: string;
  category: Category;
  difficulty: Difficulty;
  proofType: ProofType;
  proofText?: string;
  photoFile?: File;
  isSubscribed: boolean;
}

const FREE_PHOTO_TTL_DAYS = 30;

export async function submitProof(
  supabase: SupabaseClient,
  input: SubmitProofInput
): Promise<{ error: string | null }> {
  let proofPhotoPath: string | null = null;

  if (input.proofType === "photo" && input.photoFile) {
    const path = `${input.userId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(path, input.photoFile, { contentType: input.photoFile.type });

    if (uploadError) {
      return { error: uploadError.message };
    }
    proofPhotoPath = path;
  }

  const photoExpiresAt =
    input.proofType === "photo" && !input.isSubscribed
      ? new Date(Date.now() + FREE_PHOTO_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase.from("history_entries").insert({
    user_id: input.userId,
    challenge_id: input.challengeId,
    challenge_title: input.challengeTitle,
    category: input.category,
    difficulty: input.difficulty,
    proof_type: input.proofType,
    proof_text: input.proofText ?? null,
    proof_photo_path: proofPhotoPath,
    photo_expires_at: photoExpiresAt,
  });

  if (error?.message.includes("duplicate key")) {
    return { error: "Челлендж на сегодня уже засчитан." };
  }

  return { error: error?.message ?? null };
}
