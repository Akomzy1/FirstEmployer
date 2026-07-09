import { redirect } from "next/navigation";
import { AuthForm } from "@/components/app/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const next = searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : "/app";
  if (user) redirect(next);

  return <AuthForm next={next} />;
}
