import { createClient } from "@/lib/supabase/server";
import CreateChallengeForm from "@/components/CreateChallengeForm";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <CreateChallengeForm userId={user.id} />;
}
