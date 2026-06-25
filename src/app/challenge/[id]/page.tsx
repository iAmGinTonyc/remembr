import { createClient } from "@/lib/supabase/server";
import { getChallengeById } from "@/lib/data/challenges";
import ChallengeExecution from "@/components/ChallengeExecution";

export default async function ChallengeExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isOwn = id === "own";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const challenge = isOwn ? null : await getChallengeById(supabase, id);

  if (!isOwn && !challenge) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center text-zinc-500">
        Челлендж не найден.
      </div>
    );
  }

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <ChallengeExecution
      challenge={challenge}
      userId={user?.id ?? null}
      isSubscribed={profile?.is_subscribed ?? false}
    />
  );
}
