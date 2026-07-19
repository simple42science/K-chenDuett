# KüchenDuett

Mobile Webapp für ein gemeinsames Lebensmittel-Inventar und passende Rezeptideen für zwei Personen.

## Lokaler Start

Voraussetzung: Node.js 24.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Die App ist danach unter `http://localhost:5173/K-chenDuett/` erreichbar.

## Prüfungen

```powershell
npm run check
```

Der Befehl führt Lint, TypeScript-Prüfung, Tests und den Produktionsbuild vollständig in der
Sandbox aus. Vite nutzt dafür den nativen Config-Loader; Vitest arbeitet mit einem einzelnen
Worker-Thread statt mit Kindprozessen.

## Supabase

Öffentliche Browserwerte gehören in `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Secret-/Service-Role-Keys dürfen niemals in eine `VITE_*`-Variable, den Browser oder das Repository gelangen. Datenbankänderungen liegen unter `supabase/migrations`.

Für Auth müssen in Supabase die Site URL `https://simple42science.github.io/K-chenDuett/`
sowie die lokalen Redirects `http://localhost:5173/**` und `http://127.0.0.1:5173/**`
freigegeben sein. Diese Einstellungen werden bewusst manuell im Dashboard verwaltet.

Für den vollständigen lokalen Datenbanklauf wird Docker benötigt:

```powershell
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
```

Ohne Docker kann das vorhandene Supabase-Projekt nach persönlicher CLI-Anmeldung verknüpft werden:

```powershell
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
npm run db:test:linked
```

`db:test:linked` führt selbstvalidierende RLS-Assertions in einer Transaktion aus und rollt sämtliche Testdaten zurück. Der lokale pgTAP-Befehl `db:test` benötigt Docker.

## Deployment

Das Ziel ist GitHub Pages unter `/K-chenDuett/`. Der eigentliche Pages-Workflow wird in AP8 ergänzt; bis dahin prüft `.github/workflows/ci.yml` jeden Push und Pull Request.

Siehe [PROJECT_PLAN.md](./PROJECT_PLAN.md) für Umfang und Arbeitspakete.
