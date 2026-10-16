"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatar } from "@/components/workspace/profile-avatar";
import { THEME_OPTIONS } from "@/components/workspace/theme-options";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";
import { errorMessage } from "@/lib/api-client";
import { applyDocumentAccent } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { PROFILE_ACCENTS, type ProfileAccent, type ProfileDisplayMode } from "@/types/profile";

const ACCENT_LABELS: Record<ProfileAccent, string> = {
  teal: "Turquesa",
  cyan: "Ciano",
  blue: "Azul",
  indigo: "Índigo",
  violet: "Violeta",
  fuchsia: "Fúcsia",
  rose: "Rosa",
  orange: "Laranja",
  amber: "Âmbar",
  emerald: "Esmeralda",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const { profile, email } = useWorkspace();
  const actions = useWorkspaceActions();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [nickname, setNickname] = useState(profile.nickname);
  const [accent, setAccent] = useState<ProfileAccent>(profile.accent_color);
  const [displayMode, setDisplayMode] = useState<ProfileDisplayMode>(profile.display_mode);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarSource = removeAvatar ? null : (avatarPreview ?? profile.avatar_url);

  // Live preview of the accent; reverted on cancel.
  const previewAccent = (value: ProfileAccent) => {
    setAccent(value);
    applyDocumentAccent(value);
  };

  const cancel = () => {
    applyDocumentAccent(profile.accent_color);
    onClose();
  };

  const save = async () => {
    const name = nickname.trim().slice(0, 40);
    if (!name) {
      toast.error("Digite como quer ser chamado.");
      return;
    }
    setSaving(true);
    try {
      await actions.saveProfile(
        { nickname: name, accent_color: accent, display_mode: displayMode, removeAvatar },
        avatarFile,
      );
      toast.success("Preferências salvas");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível salvar o perfil."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Preferências</DialogTitle>
        <DialogDescription>{email ?? "Personalize seu espaço."}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <Field label="Foto" hint="PNG, JPG ou GIF até 4 MB.">
          <div className="flex items-center gap-3">
            <ProfileAvatar src={avatarSource} name={nickname || profile.nickname} className="size-14 text-base" />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              aria-label="Escolher foto de perfil"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (!file.type.startsWith("image/")) return toast.error("Escolha uma imagem.");
                if (file.size > 4 * 1024 * 1024) return toast.error("A imagem deve ter no máximo 4 MB.");
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
                setRemoveAvatar(false);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={saving}>
              <ImagePlus />
              Trocar
            </Button>
            {avatarSource ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setRemoveAvatar(true);
                }}
              >
                <X />
                Remover
              </Button>
            ) : null}
          </div>
        </Field>

        <Field label="Nome" hint="Aparece nas saudações.">
          <Input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={40}
            className="h-9"
            disabled={saving}
          />
        </Field>

        <Field label="Cor de destaque">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor de destaque">
            {PROFILE_ACCENTS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={accent === value}
                aria-label={ACCENT_LABELS[value]}
                title={ACCENT_LABELS[value]}
                onClick={() => previewAccent(value)}
                data-accent-swatch={value}
                className={cn(
                  "grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110",
                  accent === value && "ring-2 ring-foreground/70",
                )}
                style={{ background: `var(--swatch-${value})` }}
              >
                {accent === value ? <Check className="size-4 text-white drop-shadow" /> : null}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tema">
          <SegmentedControl
            label="Tema"
            value={theme ?? "system"}
            onChange={setTheme}
            options={THEME_OPTIONS.map((option) => ({
              value: option.value,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <option.icon className="size-3.5" />
                  {option.label}
                </span>
              ),
            }))}
            className="scrollbar-none max-w-full overflow-x-auto"
          />
        </Field>

        <Field label="Densidade" hint="Compacto esconde descrições e indicadores.">
          <SegmentedControl
            label="Densidade"
            value={displayMode}
            onChange={setDisplayMode}
            options={[
              { value: "full", label: "Confortável" },
              { value: "compact", label: "Compacto" },
            ]}
          />
        </Field>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={cancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : null}
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useWorkspaceUI();
  const { profile } = useWorkspace();

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(open) => {
        if (!open) applyDocumentAccent(profile.accent_color);
        setSettingsOpen(open);
      }}
    >
      <DialogContent className="max-w-2xl">
        {settingsOpen ? <SettingsForm onClose={() => setSettingsOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
