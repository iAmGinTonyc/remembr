import { createClient } from "@/lib/supabase/server";
import { getChallengeById, getPairChallenges } from "@/lib/data/challenges";
import { getMyPairLink, getOrCreatePairDay, getSolutionsForDay } from "@/lib/data/pair";
import PairInvite from "@/components/PairInvite";
import PairBoard from "@/components/PairBoard";

export default async function PairPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("mode")
    .eq("id", user.id)
    .maybeSingle();

  const link = await getMyPairLink(supabase, user.id);

  if (profile?.mode !== "pair" || !link || !link.userB) {
    return <PairInvite userId={user.id} existingLink={link} />;
  }

  const pairDay = await getOrCreatePairDay(supabase, link);
  if (!pairDay) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-zinc-500">
        Не получилось загрузить день пары. Обнови страницу.
      </div>
    );
  }

  const isChooserToday = pairDay.chooserUserId === user.id;
  const challenge = pairDay.challengeId
    ? await getChallengeById(supabase, pairDay.challengeId)
    : null;
  const pairChallenges = isChooserToday && !challenge ? await getPairChallenges(supabase) : [];
  const solutions = challenge ? await getSolutionsForDay(supabase, pairDay.id) : [];

  const mySolution = solutions.find((s) => s.userId === user.id) ?? null;
  const partnerSolution = solutions.find((s) => s.userId !== user.id) ?? null;

  return (
    <PairBoard
      pairDayId={pairDay.id}
      userId={user.id}
      isChooserToday={isChooserToday}
      challenge={challenge}
      pairChallenges={pairChallenges}
      mySolutionSubmitted={Boolean(mySolution)}
      partnerSolutionSubmitted={Boolean(partnerSolution)}
      mySolutionText={mySolution?.solutionText ?? null}
      partnerSolutionText={partnerSolution?.solutionText ?? null}
    />
  );
}
