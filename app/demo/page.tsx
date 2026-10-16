import type { Metadata } from "next";

import { DemoWorkspace } from "@/components/demo/demo-workspace";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "Demonstração"),
    description: translate(locale, "Explore o Taskspace sem criar conta. Os dados ficam apenas no seu navegador."),
  };
}

export default function DemoPage() {
  return <DemoWorkspace />;
}
