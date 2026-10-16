import { Coffee, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export const THEME_OPTIONS: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "comfort", label: "Conforto", icon: Coffee },
  { value: "dark", label: "Escuro", icon: Moon },
];
