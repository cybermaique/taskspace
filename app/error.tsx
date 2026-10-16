"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Não foi possível carregar seu espaço</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Verifique sua conexão e tente novamente."}
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw />
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
