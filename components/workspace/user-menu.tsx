"use client";

import { ChevronsUpDown, Keyboard, LogOut, Settings2, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { ProfileAvatar } from "@/components/workspace/profile-avatar";
import { THEME_OPTIONS } from "@/components/workspace/theme-options";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { profile, email, mode } = useWorkspace();
  const { signOut } = useWorkspaceActions();
  const { setSettingsOpen, setTrashOpen, setShortcutsOpen } = useWorkspaceUI();
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <MenuTrigger
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-lg text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring data-popup-open:bg-accent",
          compact ? "p-1" : "w-full p-2",
        )}
        aria-label={t("Abrir menu da conta")}
      >
        <ProfileAvatar profile={profile} />
        {!compact ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{profile.nickname}</span>
              {email ? (
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              ) : null}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        ) : null}
      </MenuTrigger>
      <MenuContent side={compact ? "bottom" : "top"} align={compact ? "end" : "start"} className="w-60">
        <MenuGroup>
          <MenuLabel>{t("Tema")}</MenuLabel>
          <MenuRadioGroup value={theme ?? "system"} onValueChange={(value) => setTheme(String(value))}>
            {THEME_OPTIONS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                <option.icon />
                {t(option.label)}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem onClick={() => setSettingsOpen(true)}>
          <Settings2 />{t("Preferências")}</MenuItem>
        <MenuItem onClick={() => setTrashOpen(true)}>
          <Trash2 />{t("Lixeira")}</MenuItem>
        <MenuItem onClick={() => setShortcutsOpen(true)}>
          <Keyboard />{t("Atalhos de teclado")}</MenuItem>
        <MenuSeparator />
        <MenuItem destructive onClick={() => void signOut()}>
          <LogOut />
          {mode === "demo" ? t("Sair da demonstração") : t("Sair")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
