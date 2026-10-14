import { supabase } from "@/integrations/supabase/client";

export const STATUSES = ["To Do", "In Progress", "Done"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export type Task = {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  sort_order: number;
};

export type Plan = {
  id: string;
  title: string;
  description: string;
  goal: string;
  deadline: string | null;
  deliverables: string[];
  next_step: string | null;
  created_at: string;
};

export function progress(tasks: { status: string }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listPlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*, plan_tasks(status)")
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map((p) => ({
    ...(p as unknown as Plan),
    deliverables: Array.isArray(p.deliverables) ? (p.deliverables as string[]) : [],
    stats: progress((p.plan_tasks as { status: string }[]) ?? []),
  }));
}

export async function getPlan(id: string) {
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  const { data: tasks, error: tErr } = await supabase
    .from("plan_tasks")
    .select("*")
    .eq("plan_id", id)
    .order("sort_order")
    .order("created_at");
  fail(tErr);
  return {
    plan: {
      ...(data as unknown as Plan),
      deliverables: Array.isArray(data.deliverables) ? (data.deliverables as string[]) : [],
    },
    tasks: (tasks ?? []) as unknown as Task[],
  };
}

export async function createPlan(input: {
  title: string;
  description: string;
  goal: string;
  deadline: string | null;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("You are signed out. Please sign in again.");
  const { data, error } = await supabase
    .from("plans")
    .insert({ ...input, user_id: u.user.id })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export async function updatePlan(
  id: string,
  patch: Partial<Pick<Plan, "title" | "description" | "goal" | "deadline" | "deliverables" | "next_step">>,
) {
  const { error } = await supabase.from("plans").update(patch).eq("id", id);
  fail(error);
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  fail(error);
}

export async function createTask(planId: string, t: { title: string; description: string | null; priority: Priority; sort_order: number }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("You are signed out. Please sign in again.");
  const { error } = await supabase.from("plan_tasks").insert({ ...t, plan_id: planId, user_id: u.user.id });
  fail(error);
}

export async function updateTask(id: string, patch: Partial<Pick<Task, "title" | "description" | "priority" | "status">>) {
  const { error } = await supabase.from("plan_tasks").update(patch).eq("id", id);
  fail(error);
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("plan_tasks").delete().eq("id", id);
  fail(error);
}
