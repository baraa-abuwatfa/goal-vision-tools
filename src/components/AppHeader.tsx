import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";

export function AppHeader() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const link = "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground";
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/plans" className="mr-4"><Wordmark /></Link>
        <nav className="flex items-center gap-1">
          <Link to="/plans" className={link} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-medium bg-muted" }}>My Plans</Link>
          <Link to="/plans/new" className={link} activeProps={{ className: "text-foreground font-medium bg-muted" }}>Create Plan</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {email && <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>}
          <Button variant="outline" size="sm" onClick={signOut}>Log out</Button>
        </div>
      </div>
    </header>
  );
}
