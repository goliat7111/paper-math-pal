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
- Additionens minnessiffror beräknas kolumnvis i `setupLayout()` och visas i en 4 mm hög rad direkt under övre strecket endast vid flersiffrig undre faktor, så arbetsblad och facit behåller samma radplacering.
- Alla nuvarande och framtida hela arbetsblad och facit använder `SheetHeader` med titel, undertitel och skrivrader för namn, datum och poäng; `Snabba tal` är undantaget eftersom dess fyra övningar ska klippas isär.
- Utskrivbara mallar bor på en egen sida (`/mallar`); 100-rutan ritas som en 11×11 HTML-tabell vars produkter kan visas eller döljas, och rutorna fyller tillgänglig A4-yta via antalstyrd grid så direktutskrift och PDF får samma rutindelning.
- Addition och subtraktion delar `AddSubPage`/`SheetAddSub` och logiken i `src/lib/addsub.ts`; uppgifter utan växling konstrueras kolumnvis (slumpa-och-förkasta hittar dem inte vid 3 termer och decimaler).
- Teckenstorleken i rutmallarna (100-rutan, additionsrutorna) är proportionell mot cellhöjden: tabellen ligger i en `.hundred-grid-box` med `container-type: size` (tabeller kan inte vara size-containrar i Chromium — cqh faller då tillbaka på viewporten), och `th`/`td` får `font-size: calc(40cqh / var(--rows))` där `--rows` sätts inline per ruta.
- Klipplinjer: streckade linjer ritas som SVG-data-URI-bakgrunder (--cut-v/--cut-h i :root) på rutnätscontainrarna — de ligger exakt i grid-gapet (50 %/33 %/25 % vid lika rader) och korsar aldrig tabellerna. Gäller .hundred-grid-layout--2/4/6/8, .talkamrat-grid-2/-4, .talkamrat-halves (liggande) och .snabba-grid.
