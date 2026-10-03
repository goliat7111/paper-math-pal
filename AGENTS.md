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

- Uppställningsbladets kolumner räknas i `setupLayout()` och placeras explicit med `gridColumn`/`gridRow`; grid-auto placerar minnessiffror fel.
- Additionens minnessiffror räknas kolumnvis och visas i en 4 mm rad under övre strecket vid flersiffrig undre faktor.
- Alla nuvarande och framtida hela arbetsblad och facit använder `SheetHeader` med titel, undertitel och skrivrader för namn, datum och poäng; `Snabba tal` är undantaget eftersom dess fyra övningar ska klippas isär.
- Mallar bor på `/mallar`; 100-rutan är en 11×11-tabell och antalstyrd grid ger samma A4-indelning i utskrift och PDF.
- Addition och subtraktion delar `AddSubPage`/`SheetAddSub` och logiken i `src/lib/addsub.ts`; uppgifter utan växling konstrueras kolumnvis (slumpa-och-förkasta hittar dem inte vid 3 termer och decimaler).
- Rutmallarnas teckenstorlek följer cellhöjden via `.hundred-grid-box` som size-container; tabeller kan inte vara size-containrar.
- Klipplinjer: streckade linjer ritas som SVG-data-URI-bakgrunder (--cut-v/--cut-h i :root) på rutnätscontainrarna — de ligger exakt i grid-gapet (50 %/33 %/25 % vid lika rader) och korsar aldrig tabellerna. Gäller .hundred-grid-layout--2/4/6/8, .talkamrat-grid-2/-4, .talkamrat-halves (liggande) och .snabba-grid.
- Bladsidor använder `useSheetZoom()`/`ZoomControls`; zoom 0,5–3 påverkar aldrig utskrift/PDF.
- Direktutskrift isolerar `.print-area`; varje `.a4-page` använder namngiven stående/liggande `@page`, så skärmlayouten inte skapar extrasidor.
- Blandade övningar återanvänder räknemotorer och uppställningar för de fyra räknesätten; nivåprofiler hålls separat så facit överensstämmer med befintliga blad.
- Slumpade decimaler i divisionsutmaningar och blandade övningar flyttar kommat lika mycket i täljare och kvot (`randomizeDecimals` i `src/lib/mixed-division.ts`); uppgifter med rest, decimal divisor eller oändlig kvot lämnas orörda så att facit och utmaningen förblir korrekta.
- Multiplikationsuppställning och division delar en fast 3×4 A4-rutlayout med addition/subtraktion; fasta tolv uppgifter håller elevblad och facit identiska och fyller skrivytan.
- Multiplikationens valfria rutnät ritas endast i elevbladets tomma uppgiftsrutor; facit behåller sina färdiga uppställningar oavsett elevbladets rutval.
