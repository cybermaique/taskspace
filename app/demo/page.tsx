import type { Metadata } from "next";

import { DemoWorkspace } from "@/components/demo/demo-workspace";

export const metadata: Metadata = {
  title: "Demonstração",
  description: "Explore o Taskboard sem criar conta. Os dados ficam apenas no seu navegador.",
};

export default function DemoPage() {
  return <DemoWorkspace />;
}
