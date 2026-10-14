import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  PRIORITIES, STATUSES, createTask, deletePlan, deleteTask, getPlan, progress, updatePlan, updateTask,
  type Plan, type Priority, type Status, type Task,
} from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/plans/$id")({
  head: () => ({
    meta: [
      { title: "Plan — TaskBridge" },
      { name: "description", content: "Plan details, tasks, and progress." },
      { property: "og:title", content: "Plan — TaskBridge" },
      { property: "og:description", content: "Plan details, tasks, and progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanDetails,
});

const selectCls = "h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
const priorityCls: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-foreground",
  Low: "bg-muted text-muted-foreground",
};

function PlanDetails() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const key = ["plan", id];
  const q = useQuery({ queryKey: key, queryFn: () => getPlan(id) });
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["plans"] }); };
  const [editing, setEditing] = useState(false);

  const delPlan = useMutation({
    mutationFn: () => deletePlan(id),
    onSuccess: () => { toast.success("Plan deleted"); qc.invalidateQueries({ queryKey: ["plans"] }); navigate({ to: "/plans" }); },
    onError: (e) => toast.error(`Could not delete plan: ${e.message}`),
  });

  if (q.isPending) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  if (q.isError) return <p role="alert" className="text-destructive">Could not load plan: {q.error.message}</p>;
  if (!q.data) return (
    <div className="text-center">
      <h1 className="text-xl font-semibold">Plan not found</h1>
      <Button asChild variant="link"><Link to="/plans">Back to My Plans</Link></Button>
    </div>
  );

  const { plan, tasks } = q.data;
  const stats = progress(tasks);

  return (
    <div className="space-y-6">
      <Link to="/plans" className="text-sm text-muted-foreground hover:text-foreground">← My Plans</Link>
      {editing ? (
        <PlanEditor plan={plan} onDone={() => { setEditing(false); refresh(); }} onCancel={() => setEditing(false)} />
      ) : (
        <section className="rounded-lg border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{plan.title}</h1>
              {plan.deadline && <p className="mt-1 text-sm text-muted-foreground">Deadline: {new Date(plan.deadline + "T00:00").toLocaleDateString()}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit plan</Button>
              <ConfirmDelete title="Delete this plan?" description="The plan and all of its tasks will be permanently deleted." onConfirm={() => delPlan.mutate()}
                trigger={<Button size="sm" variant="ghost" disabled={delPlan.isPending}>Delete</Button>} />
            </div>
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <Info label="Task description" value={plan.description} />
            <Info label="Goal" value={plan.goal} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Desired deliverables</dt>
              <dd className="mt-1 text-sm">
                {plan.deliverables.length ? <ul className="list-disc pl-5">{plan.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul> : <span className="text-muted-foreground">None yet</span>}
              </dd>
            </div>
            <Info label="Next step" value={plan.next_step} />
          </dl>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Overall progress · {stats.done}/{stats.total} done</span>
              <span className="font-semibold">{stats.pct}%</span>
            </div>
            <Progress value={stats.pct} />
          </div>
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {tasks.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No tasks yet. Add the first one below.</p>}
        <ul className="mt-4 divide-y">
          {tasks.map((t) => <TaskRow key={t.id} task={t} onChange={refresh} />)}
        </ul>
        <AddTask planId={id} nextOrder={tasks.length} onAdded={refresh} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm">{value || <span className="text-muted-foreground">Not set</span>}</dd>
    </div>
  );
}

function PlanEditor({ plan, onDone, onCancel }: { plan: Plan; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    title: plan.title, description: plan.description, goal: plan.goal, deadline: plan.deadline ?? "",
    deliverables: plan.deliverables.join("\n"), next_step: plan.next_step ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!f.title.trim() || !f.description.trim() || !f.goal.trim()) return setError("Title, description and goal are required.");
    setBusy(true); setError(null);
    try {
      await updatePlan(plan.id, {
        title: f.title.trim(), description: f.description.trim(), goal: f.goal.trim(), deadline: f.deadline || null,
        deliverables: f.deliverables.split("\n").map((s) => s.trim()).filter(Boolean), next_step: f.next_step.trim() || null,
      });
      toast.success("Plan updated");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setBusy(false);
    }
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Edit plan</h2>
      <div className="space-y-1.5"><Label htmlFor="e-title">Plan title *</Label><Input id="e-title" value={f.title} onChange={set("title")} /></div>
      <div className="space-y-1.5"><Label htmlFor="e-desc">Task description *</Label><Textarea id="e-desc" value={f.description} onChange={set("description")} /></div>
      <div className="space-y-1.5"><Label htmlFor="e-goal">Goal *</Label><Textarea id="e-goal" value={f.goal} onChange={set("goal")} /></div>
      <div className="space-y-1.5"><Label htmlFor="e-del">Desired deliverables (one per line)</Label><Textarea id="e-del" value={f.deliverables} onChange={set("deliverables")} /></div>
      <div className="space-y-1.5"><Label htmlFor="e-next">Next step</Label><Input id="e-next" value={f.next_step} onChange={set("next_step")} /></div>
      <div className="space-y-1.5"><Label htmlFor="e-dl">Deadline</Label><Input id="e-dl" type="date" value={f.deadline} onChange={set("deadline")} /></div>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}

function TaskRow({ task, onChange }: { task: Task; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description ?? "");
  const m = useMutation({
    mutationFn: (patch: Parameters<typeof updateTask>[1]) => updateTask(task.id, patch),
    onSuccess: () => { setEditing(false); onChange(); },
    onError: (e) => toast.error(`Could not update task: ${e.message}`),
  });
  const del = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => { toast.success("Task deleted"); onChange(); },
    onError: (e) => toast.error(`Could not delete task: ${e.message}`),
  });
  const busy = m.isPending || del.isPending;

  if (editing) return (
    <li className="space-y-2 py-3">
      <Input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea aria-label="Task description" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || !title.trim()} onClick={() => m.mutate({ title: title.trim(), description: desc.trim() || null })}>{m.isPending ? "Saving…" : "Save"}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(task.title); setDesc(task.description ?? ""); }}>Cancel</Button>
      </div>
    </li>
  );

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className={task.status === "Done" ? "font-medium text-muted-foreground line-through" : "font-medium"}>{task.title}</p>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityCls[task.priority]}`}>{task.priority}</span>
        <select aria-label="Priority" className={selectCls} value={task.priority} disabled={busy} onChange={(e) => m.mutate({ priority: e.target.value as Priority })}>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select aria-label="Status" className={selectCls} value={task.status} disabled={busy} onChange={(e) => m.mutate({ status: e.target.value as Status })}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={busy}>Edit</Button>
        <ConfirmDelete title="Delete this task?" description={`"${task.title}" will be permanently deleted.`} onConfirm={() => del.mutate()}
          trigger={<Button size="sm" variant="ghost" disabled={busy}>Delete</Button>} />
      </div>
    </li>
  );
}

function AddTask({ planId, nextOrder, onAdded }: { planId: string; nextOrder: number; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => createTask(planId, { title: title.trim(), description: desc.trim() || null, priority, sort_order: nextOrder }),
    onSuccess: () => { setTitle(""); setDesc(""); setPriority("Medium"); setError(null); toast.success("Task added"); onAdded(); },
    onError: (e) => setError(e.message),
  });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return setError("Task title is required."); if (!m.isPending) m.mutate(); }}
      className="mt-4 space-y-3 rounded-md bg-muted p-4"
    >
      <h3 className="text-sm font-semibold">Add a task</h3>
      <div className="space-y-1.5"><Label htmlFor="t-title">Title *</Label><Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="t-desc">Description</Label><Textarea id="t-desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="t-pri">Priority</Label>
          <select id="t-pri" className={selectCls + " block h-9"} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={m.isPending}>{m.isPending ? "Adding…" : "Add task"}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">Could not add task: {error}</p>}
    </form>
  );
}
