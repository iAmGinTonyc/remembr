import { createClient } from "@/lib/supabase/server";
import { getDailyChallenges } from "@/lib/data/challenges";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const supabase = await createClient();
  const challenges = await getDailyChallenges(supabase);

  return <HomeClient challenges={challenges} />;
}
