import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <LoginScreen />;
}
