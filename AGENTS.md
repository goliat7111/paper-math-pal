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

# Tekniska beslut

- Kolumnplacering i uppställningsbladet (minnessiffror, ×-tecken, produkt) räknas ut i `setupLayout()` i `src/lib/worksheets.ts` och renderas med explicit `gridColumn`/`gridRow` — aldrig grid auto-placering, som placerade minnessiffrorna fel (span-cellen hamnade först). Layoutlogiken är därmed enhetstestad.
