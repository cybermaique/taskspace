"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Eye, EyeOff, LoaderCircle, NotebookPen, Search, SquareKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Já existe uma conta com esse e-mail.",
};

const HIGHLIGHTS = [
  { icon: SquareKanban, title: "Quadro fluido", text: "Arraste tarefas entre colunas, no mouse ou no toque." },
  { icon: NotebookPen, title: "Anotações vivas", text: "Links, #tags, blocos de código e anexos." },
  { icon: Search, title: "Tudo a um Ctrl K", text: "Busque e aja sem tirar as mãos do teclado." },
];

function BoardPreview() {
  const columns = [
    { label: "A fazer", tone: "bg-status-todo", cards: [78, 52] },
    { label: "Em andamento", tone: "bg-status-progress", cards: [64] },
    { label: "Concluída", tone: "bg-status-done", cards: [56, 70, 44] },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur" aria-hidden="true">
      {columns.map((column) => (
        <div key={column.label} className="space-y-2">
          <div className="flex items-center gap-1.5 px-0.5 text-[0.65rem] font-medium text-white/70">
            <span className={cn("size-1.5 rounded-full", column.tone)} />
            {column.label}
          </div>
          {column.cards.map((width, index) => (
            <div key={index} className="space-y-1.5 rounded-lg border border-white/10 bg-white/10 p-2">
              <div className="h-1.5 rounded-full bg-white/60" style={{ width: `${width}%` }} />
              <div className="h-1.5 w-1/3 rounded-full bg-white/25" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const isSignUp = mode === "signup";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setLoading(false);
      setMessage({ kind: "error", text: AUTH_ERRORS[result.error.message] ?? result.error.message });
      return;
    }
    if (isSignUp && !result.data.session) {
      setLoading(false);
      setMessage({ kind: "info", text: "Conta criada! Enviamos um link de confirmação para o seu e-mail." });
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40rem 30rem at 0% 0%, oklch(from var(--swatch-violet) l c h / 0.35), transparent 70%), radial-gradient(36rem 28rem at 100% 100%, oklch(from var(--primary) l c h / 0.35), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-zinc-950">
            <SquareKanban className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">Taskboard</span>
        </div>
        <div className="relative mt-auto max-w-lg space-y-8">
          <div>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
              Clareza para o que importa hoje.
            </h1>
            <p className="mt-3 text-base text-white/60">
              Tarefas, subtarefas e anotações num só lugar — rápido como deve ser.
            </p>
          </div>
          <BoardPreview />
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <item.icon className="mt-0.5 size-4 shrink-0 text-white/70" />
                <p className="text-sm">
                  <span className="font-medium">{item.title}.</span>{" "}
                  <span className="text-white/60">{item.text}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="app-backdrop flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <SquareKanban className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">Taskboard</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignUp ? "Leva menos de um minuto." : "Entre para continuar de onde parou."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="h-10 bg-card"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Senha</span>
              <span className="relative block">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignUp ? "Mínimo de 6 caracteres" : "••••••••"}
                  className="h-10 bg-card pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            {message ? (
              <p
                role={message.kind === "error" ? "alert" : "status"}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                  message.kind === "error"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-status-done/30 bg-status-done/10",
                )}
              >
                {message.kind === "info" ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-status-done" /> : null}
                {message.text}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : null}
              {isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(isSignUp ? "signin" : "signup");
                setMessage(null);
              }}
            >
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
