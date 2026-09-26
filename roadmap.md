# Roadmap

## Klart
- [x] Uppställningsblad: bred minnessifferruta till höger + × under första siffran i övre faktorn
- [x] Fixa bugg: minnessiffror till vänster och produkten feljusterad — nu explicit kolumnplacering via setupLayout
- [x] Bedöm utskriftslayout: 12 uppställningar i 3 kolumner ryms på A4, PDF ger 2 sidor
- [x] Tester: linjering av minnessiffror, faktorer och produkt (29/29 gröna)
- [x] Välj storlek på båda faktorerna i uppställningsbladet; kolumnbredder och mellanrum anpassas automatiskt
- [x] Flersiffrig undre faktor: 1–3 siffror i undre talet med delprodukter, egna minnessiffror per delprodukt och streck ovanför produkten
- [x] Övre talet: valbart 1–3 siffror (heltal 0–9999, första siffran aldrig 0); femsiffriga tal borttagna
- [x] Undre faktorn kan aldrig ha fler siffror än övre talet (fälten kopplade, värden klagas automatiskt)
- [x] Ensiffriga faktorer är aldrig 1 – ensiffrigt tal genereras alltid som 2–9
- [x] Bladet fyller A4-sidan: fler uppgifter när talen är små (pool på 40, sidfyllnad mäts i webbläsaren)
- [x] Förhandsgranskning i inställningarna: "N uppgifter ryms på A4-sidan (rader × kolumner)"
- [x] Mellanrummen fördelas jämnt över sidan (aldrig mindre än grundmellanrummet, inom utskriftsmarginalerna)
- [x] Varje uppgift hålls ihop vid utskrift (break-inside: avoid)

## Senare (väntar på Magnus)
- [ ] Decimaltal i uppställningen – välja decimaltal som faktorer (heltal är klart)
