<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data access goes through the browser Supabase client in `src/lib/plans.ts`; security is enforced by RLS on `plans`/`plan_tasks` (why: no server secrets needed, owner-only access at DB level).
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirect to /auth).
- Task progress is always computed from task statuses, never stored.
