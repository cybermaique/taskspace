import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { getCurrentUser } from "@/lib/auth";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: translate(await getLocale(), "Entrar") };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <LoginScreen />;
}
