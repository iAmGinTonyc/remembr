import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { joinPairLink } from "@/lib/data/pair";

export default async function JoinPairPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/pair/join/${code}`)}`);
  }

  const { error } = await joinPairLink(supabase, code, user.id);

  if (!error) {
    await supabase.from("profiles").update({ mode: "pair" }).eq("id", user.id);
  }

  redirect(error ? `/pair?joinError=${encodeURIComponent(error)}` : "/pair");
}
