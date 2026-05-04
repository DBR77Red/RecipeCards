-- Add missing DELETE policy on recipes table.
-- Without this, validated users cannot delete their own cards.
create policy "invite_validated users delete own recipes"
  on public.recipes for delete
  using (
    (auth.jwt() -> 'app_metadata' ->> 'invite_validated')::boolean = true
    and auth.uid() = user_id
  );
