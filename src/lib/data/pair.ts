import type { SupabaseClient } from "@supabase/supabase-js";

export interface PairLink {
  id: string;
  userA: string;
  userB: string | null;
  referralCode: string;
  createdAt: string;
}

export interface PairDay {
  id: string;
  pairId: string;
  date: string;
  chooserUserId: string;
  challengeId: string | null;
}

export interface PairSolutionRow {
  id: string;
  pairDayId: string;
  userId: string;
  solutionText: string | null;
  solutionPhotoPath: string | null;
}

export async function getMyPairLink(
  supabase: SupabaseClient,
  userId: string
): Promise<PairLink | null> {
  const { data } = await supabase
    .from("pair_links")
    .select("id, user_a, user_b, referral_code, created_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    userA: data.user_a,
    userB: data.user_b,
    referralCode: data.referral_code,
    createdAt: data.created_at,
  };
}

export async function createPairLink(
  supabase: SupabaseClient,
  userId: string
): Promise<{ link: PairLink | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pair_links")
    .insert({ user_a: userId })
    .select("id, user_a, user_b, referral_code, created_at")
    .single();

  if (error || !data) return { link: null, error: error?.message ?? "Не удалось создать ссылку" };
  return {
    link: {
      id: data.id,
      userA: data.user_a,
      userB: data.user_b,
      referralCode: data.referral_code,
      createdAt: data.created_at,
    },
    error: null,
  };
}

export async function joinPairLink(
  supabase: SupabaseClient,
  referralCode: string,
  userId: string
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from("pair_links")
    .select("id, user_a, user_b")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!existing) return { error: "Ссылка не найдена." };
  if (existing.user_a === userId) return { error: "Это твоя собственная ссылка." };
  if (existing.user_b) return { error: "К этой ссылке уже подключился другой человек." };

  const { error } = await supabase
    .from("pair_links")
    .update({ user_b: userId })
    .eq("id", existing.id);

  return { error: error?.message ?? null };
}

/** Чередующийся выбирающий: считаем дни с момента создания пары,
 * чётный/нечётный день определяет, кто сегодня выбирает. */
export function computeChooserUserId(link: PairLink, date: string): string {
  const start = new Date(link.createdAt);
  start.setHours(0, 0, 0, 0);
  const current = new Date(date);
  const daysSinceStart = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const userB = link.userB ?? link.userA;
  return daysSinceStart % 2 === 0 ? link.userA : userB;
}

export async function getOrCreatePairDay(
  supabase: SupabaseClient,
  link: PairLink,
  date: string = new Date().toISOString().slice(0, 10)
): Promise<PairDay | null> {
  const { data: existing } = await supabase
    .from("pair_days")
    .select("id, pair_id, date, chooser_user_id, challenge_id")
    .eq("pair_id", link.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      pairId: existing.pair_id,
      date: existing.date,
      chooserUserId: existing.chooser_user_id,
      challengeId: existing.challenge_id,
    };
  }

  const chooserUserId = computeChooserUserId(link, date);
  const { data: created, error } = await supabase
    .from("pair_days")
    .insert({ pair_id: link.id, date, chooser_user_id: chooserUserId })
    .select("id, pair_id, date, chooser_user_id, challenge_id")
    .single();

  if (error || !created) return null;
  return {
    id: created.id,
    pairId: created.pair_id,
    date: created.date,
    chooserUserId: created.chooser_user_id,
    challengeId: created.challenge_id,
  };
}

export async function chooseChallengeForDay(
  supabase: SupabaseClient,
  pairDayId: string,
  challengeId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("pair_days")
    .update({ challenge_id: challengeId })
    .eq("id", pairDayId);

  return { error: error?.message ?? null };
}

/** RLS сам решает, что видно: своя строка — всегда, строка партнёра — только
 * если своя уже отправлена. Поэтому здесь просто читаем все доступные строки. */
export async function getSolutionsForDay(
  supabase: SupabaseClient,
  pairDayId: string
): Promise<PairSolutionRow[]> {
  const { data } = await supabase
    .from("pair_solutions")
    .select("id, pair_day_id, user_id, solution_text, solution_photo_path")
    .eq("pair_day_id", pairDayId);

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    pairDayId: row.pair_day_id,
    userId: row.user_id,
    solutionText: row.solution_text,
    solutionPhotoPath: row.solution_photo_path,
  }));
}

export async function submitSolution(
  supabase: SupabaseClient,
  input: {
    pairDayId: string;
    userId: string;
    text?: string;
    photoFile?: File;
    sharedPhotoPath?: string; // для joint-челленджей: общий путь к файлу
  }
): Promise<{ error: string | null }> {
  let photoPath: string | null = input.sharedPhotoPath ?? null;

  if (input.photoFile && !photoPath) {
    const path = `${input.userId}/pair-${input.pairDayId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(path, input.photoFile, {
        contentType: input.photoFile.type,
        upsert: true,
      });
    if (uploadError) return { error: uploadError.message };
    photoPath = path;
  }

  const { error } = await supabase.from("pair_solutions").insert({
    pair_day_id: input.pairDayId,
    user_id: input.userId,
    solution_text: input.text ?? null,
    solution_photo_path: photoPath,
  });

  return { error: error?.message ?? null };
}
