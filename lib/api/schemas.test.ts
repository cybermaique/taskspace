import { describe, expect, it } from "vitest";

import {
  createTaskSchema,
  describeIssue,
  reorderTasksSchema,
  updateProfileSchema,
  updateTaskSchema,
} from "@/lib/api/schemas";

describe("api schemas", () => {
  it("trims titles and drops unknown fields", () => {
    const parsed = createTaskSchema.parse({ title: "  Título  ", user_id: "x", position: 99 });
    expect(parsed).toEqual({ title: "Título" });
  });

  it("explains missing titles in Portuguese", () => {
    const result = createTaskSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
    expect(describeIssue(result.error!)).toBe("Informe um título para a tarefa.");
  });

  it("prefixes other issues with the field name", () => {
    const result = updateTaskSchema.safeParse({ status: "done" });
    expect(describeIssue(result.error!)).toMatch(/^status: /);
  });

  it("allows clearing nullable fields", () => {
    expect(updateTaskSchema.parse({ description: null, category: null })).toEqual({
      description: null,
      category: null,
    });
  });

  it("requires uuids when reordering", () => {
    expect(reorderTasksSchema.safeParse({ task_ids: ["1"] }).success).toBe(false);
    expect(
      reorderTasksSchema.safeParse({ task_ids: ["6f1c2a4e-8d3b-4c5a-9e7f-1a2b3c4d5e6f"] }).success,
    ).toBe(true);
  });

  it("only accepts null for avatar_url so URLs can't be injected", () => {
    expect(updateProfileSchema.safeParse({ avatar_url: null }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ avatar_url: "https://evil.example" }).success).toBe(false);
  });
});
