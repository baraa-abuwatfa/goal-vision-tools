import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deletePlan, listPlans } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/plans/")({
  head: () => ({
    meta: [
      { title: "My Plans — TaskBridge" },
      { name: "description", content: "Your saved TaskBridge work plans." },
      { property: "og:title", content: "My Plans — TaskBridge" },
      { property: "og:description", content: "Your saved TaskBridge work plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPlans,
});

function MyPlans() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["plans"], queryFn: listPlans });
  const del = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => { toast.success("Plan deleted"); qc.invalidateQueries({ queryKey: ["plans"] }); },
    onError: (e) => toast.error(`Could not delete plan: ${e.message}`),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Plans</h1>
        <Button asChild><Link to="/plans/new">Create New Plan</Link></Button>
      </div>

      {q.isPending && <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}</div>}
      {q.isError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load plans: {q.error.message}{" "}
          <button className="underline" onClick={() => q.refetch()}>Retry</button>
        </div>
      )}
      {q.data && q.data.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">No plans yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create your first plan to start organizing a request.</p>
          <Button asChild className="mt-4"><Link to="/plans/new">Create New Plan</Link></Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {q.data?.map((p) => (
          <article key={p.id} className="flex flex-col rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.goal}</p>
            {p.deadline && <p className="mt-2 text-xs text-muted-foreground">Due {new Date(p.deadline + "T00:00").toLocaleDateString()}</p>}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{p.stats.done} of {p.stats.total} tasks done</span>
                <span className="font-medium text-foreground">{p.stats.pct}%</span>
              </div>
              <Progress value={p.stats.pct} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm"><Link to="/plans/$id" params={{ id: p.id }}>Open Plan</Link></Button>
              <ConfirmDelete
                title="Delete this plan?"
                description="The plan and all of its tasks will be permanently deleted."
                onConfirm={() => del.mutate(p.id)}
                trigger={<Button size="sm" variant="ghost" disabled={del.isPending}>Delete</Button>}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
