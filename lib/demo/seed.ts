import type { Note } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Subtask, Task, TaskStatus } from "@/types/task";

export interface DemoState {
  tasks: Task[];
  notes: Note[];
  profile: Profile;
}

const DAY = 86_400_000;

interface TaskSeed {
  title: string;
  status: TaskStatus;
  priority?: Task["priority"];
  type?: Task["type"];
  category?: string;
  description?: string;
  subtasks?: Array<[string, boolean]>;
  comment?: string;
  createdDaysAgo: number;
  completedDaysAgo?: number;
}

const TASKS: TaskSeed[] = [
  {
    title: "Redesenhar o fluxo de onboarding do app",
    status: "in_progress",
    priority: "high",
    description:
      "Reduzir o onboarding para no máximo 3 passos.\n\nReferências > linear.app/method\n\n```json\n{\"meta\": \"ativação +15%\", \"prazo\": \"sprint 42\"}\n```",
    subtasks: [
      ["Auditar telas atuais", true],
      ["Wireframes de baixa fidelidade", true],
      ["Protótipo navegável", false],
      ["Teste com 5 usuários", false],
    ],
    comment: "Alinhado com design: seguimos com a opção B.",
    createdDaysAgo: 6,
  },
  {
    title: "Corrigir upload de PDF acima de 20 MB no Safari",
    status: "not_started",
    priority: "high",
    type: "bug",
    description: "Reproduz no Safari 18 com arquivos grandes. Ver logs no Sentry.",
    createdDaysAgo: 2,
  },
  {
    title: "Escrever ADR sobre reordenação atômica",
    status: "waiting",
    priority: "medium",
    type: "improvement",
    description: "Aguardando revisão do time de plataforma.",
    createdDaysAgo: 5,
  },
  {
    title: "Estudar React Server Components a fundo",
    status: "in_progress",
    priority: "low",
    type: "study",
    category: "pessoal",
    subtasks: [
      ["Ler a documentação oficial", true],
      ["Refazer um projeto com RSC", false],
    ],
    createdDaysAgo: 9,
  },
  {
    title: "Planejar viagem para Lisboa",
    status: "not_started",
    priority: "medium",
    type: "travel",
    category: "pessoal",
    description: "Passagens para março e hospedagem em Alfama.",
    createdDaysAgo: 4,
  },
  {
    title: "Melhorar performance da listagem de pedidos",
    status: "not_started",
    priority: "medium",
    type: "improvement",
    createdDaysAgo: 8,
  },
  {
    title: "Configurar alertas de erro em produção",
    status: "completed",
    type: "feature",
    createdDaysAgo: 12,
    completedDaysAgo: 1,
  },
  {
    title: "Exportar relatórios em CSV",
    status: "completed",
    type: "feature",
    createdDaysAgo: 14,
    completedDaysAgo: 3,
  },
  {
    title: "Atualizar dependências do monorepo",
    status: "completed",
    priority: "low",
    type: "improvement",
    createdDaysAgo: 10,
    completedDaysAgo: 9,
  },
];

const NOTES: Array<Pick<Note, "title" | "content"> & { pinned?: number; daysAgo: number }> = [
  {
    title: "Bem-vindo à demonstração",
    content:
      "Tudo aqui é editável e fica salvo só neste navegador. Experimente:\n- Arrastar tarefas entre colunas\n- Ctrl K para buscar e executar ações\n- Fixar e reordenar anotações #demo",
    pinned: 0,
    daysAgo: 0,
  },
  {
    title: "Comandos úteis do Git",
    content: "Desfazer o último commit mantendo as alterações:\n```code\ngit reset --soft HEAD~1\n```\n#git #dev",
    pinned: 1,
    daysAgo: 3,
  },
  {
    title: "1:1 com a liderança",
    content:
      "Pontos discutidos:\n1. Plano de carreira para o próximo ciclo\n2. Mentoria do time júnior\n3. Estudos de arquitetura\n\nPróxima conversa em duas semanas. #trabalho",
    daysAgo: 2,
  },
  {
    title: "Payload do webhook de pagamento",
    content:
      "```json\n{\"event\":\"payment.approved\",\"amount\":12990,\"currency\":\"BRL\",\"customer\":{\"id\":\"cus_123\"}}\n```\n#api",
    daysAgo: 5,
  },
  {
    title: "Referências de design",
    content: "Linear > linear.app\nVercel > vercel.com/design\nRefactoring UI > refactoringui.com #design",
    daysAgo: 6,
  },
];

export function createDemoState(now = Date.now()): DemoState {
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();

  const tasks = TASKS.map((seed, position): Task => {
    const id = crypto.randomUUID();
    const createdAt = at(seed.createdDaysAgo);
    const subtasks: Subtask[] = (seed.subtasks ?? []).map(([title, done], index) => ({
      id: crypto.randomUUID(),
      task_id: id,
      title,
      is_completed: done,
      completed_at: done ? at(1) : null,
      position: index,
      created_at: createdAt,
      updated_at: createdAt,
    }));
    const changedAt = seed.completedDaysAgo !== undefined ? at(seed.completedDaysAgo) : at(Math.max(0, seed.createdDaysAgo - 1));

    return {
      id,
      title: seed.title,
      description: seed.description ?? null,
      status: seed.status,
      priority: seed.priority ?? "medium",
      type: seed.type ?? "feature",
      category: seed.category ?? "trabalho",
      position,
      deleted_at: null,
      created_at: createdAt,
      completed_at: seed.completedDaysAgo !== undefined ? at(seed.completedDaysAgo) : null,
      updated_at: changedAt,
      attachments: [],
      subtasks,
      status_history: [
        { id: crypto.randomUUID(), task_id: id, from_status: null, to_status: "not_started", changed_at: createdAt },
        ...(seed.status !== "not_started"
          ? [{ id: crypto.randomUUID(), task_id: id, from_status: "not_started" as const, to_status: seed.status, changed_at: changedAt }]
          : []),
      ],
      description_history: [],
      comments: seed.comment
        ? [{ id: crypto.randomUUID(), task_id: id, content: seed.comment, created_at: at(0.2) }]
        : [],
    };
  });

  const notes = NOTES.map(
    (seed): Note => ({
      id: crypto.randomUUID(),
      title: seed.title,
      content: seed.content,
      tags: null,
      is_pinned: seed.pinned !== undefined,
      pinned_position: seed.pinned ?? null,
      deleted_at: null,
      attachments: [],
      created_at: at(seed.daysAgo + 1),
      updated_at: at(seed.daysAgo),
    }),
  );

  return {
    tasks,
    notes,
    profile: {
      id: "demo",
      nickname: "Visitante",
      avatar_url: null,
      accent_color: "violet",
      display_mode: "full",
      task_column_widths: null,
      created_at: at(30),
      updated_at: at(0),
    },
  };
}
