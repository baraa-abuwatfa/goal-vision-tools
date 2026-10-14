import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlan } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/plans/new")({
  head: () => ({
    meta: [
      { title: "Create Plan — TaskBridge" },
      { name: "description", content: "Create a new TaskBridge work plan." },
      { property: "og:title", content: "Create Plan — TaskBridge" },
      { property: "og:description", content: "Create a new TaskBridge work plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatePlan,
});

function CreatePlan() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", goal: "", deadline: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs["title"] = "Plan title is required.";
    if (!f.description.trim()) errs["description"] = "Task description is required.";
    if (!f.goal.trim()) errs["goal"] = "Desired outcome is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createPlan({
        title: f.title.trim(), description: f.description.trim(), goal: f.goal.trim(), deadline: f.deadline || null,
      });
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan created");
      navigate({ to: "/plans/$id", params: { id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create plan.");
      setBusy(false);
    }
  }

  const field = (k: keyof typeof f, label: string, el: "input" | "textarea", opts: { required?: boolean; type?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}{opts.required ? " *" : " (optional)"}</Label>
      {el === "input" ? (
        <Input id={k} type={opts.type ?? "text"} value={f[k]} aria-invalid={!!errors[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      ) : (
        <Textarea id={k} rows={4} value={f[k]} aria-invalid={!!errors[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      )}
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Create Plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Describe the request. You'll add tasks on the next screen.</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5 rounded-lg border bg-card p-6">
        {field("title", "Plan Title", "input", { required: true })}
        {field("description", "Task Description", "textarea", { required: true })}
        {field("goal", "Desired Outcome", "textarea", { required: true })}
        {field("deadline", "Deadline", "input", { type: "date" })}
        {error && <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">Could not create plan: {error}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create Plan"}</Button>
      </form>
    </div>
  );
}
