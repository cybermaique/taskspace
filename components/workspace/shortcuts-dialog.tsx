"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { useI18n } from "@/components/i18n-provider";

const SHORTCUTS: Array<[string[], string]> = [
  [["Ctrl", "K"], "Abrir a paleta de comandos"],
  [["C"], "Criar tarefa ou anotação"],
  [["/"], "Focar a busca da seção"],
  [["1"], "Ir para Tarefas"],
  [["2"], "Ir para Anotações"],
  [["?"], "Mostrar atalhos"],
  [["Ctrl", "↵"], "Salvar em formulários"],
  [["Espaço"], "Pegar/soltar um card focado no quadro"],
  [["Esc"], "Fechar janelas e cancelar edição"],
];

export function ShortcutsDialog() {
  const { t } = useI18n();
  const { shortcutsOpen, setShortcutsOpen } = useWorkspaceUI();
  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Atalhos de teclado")}</DialogTitle>
          <DialogDescription>{t("Funcionam quando o foco não está em um campo de texto.")}</DialogDescription>
        </DialogHeader>
        <dl className="divide-y">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt>{t(label)}</dt>
              <dd className="flex shrink-0 gap-1">
                {keys.map((key) => (
                  <Kbd key={key} className="h-6 min-w-6 text-xs">
                    {t(key)}
                  </Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
