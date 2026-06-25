import { createClient } from "@/lib/supabase/server";
import { computeStreak, getHistoryForUser } from "@/lib/data/history";
import ProfileClient from "@/components/ProfileClient";

function computeBadges(streak: number, totalCompleted: number): string[] {
  const badges: string[] = [];
  if (totalCompleted >= 1) badges.push("Первый шаг");
  if (streak >= 7) badges.push("Первая неделя");
  if (streak >= 30) badges.push("Месяц подряд");
  if (totalCompleted >= 10) badges.push("10 приключений");
  return badges;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_emoji, level, is_subscribed")
    .eq("id", user.id)
    .maybeSingle();

  const history = await getHistoryForUser(supabase, user.id);
  const streak = computeStreak(history);
  const badges = computeBadges(streak, history.length);

  return (
    <ProfileClient
      name={profile?.name ?? user.email ?? "Без имени"}
      avatarEmoji={profile?.avatar_emoji ?? "🌿"}
      level={profile?.level ?? 1}
      isSubscribed={profile?.is_subscribed ?? false}
      streak={streak}
      badges={badges}
    />
  );
}
