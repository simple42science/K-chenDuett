# KüchenDuett – kompakter Veröffentlichungsplan

> Stand: 19. Juli 2026  
> Ziel: Eine nutzbare mobile Webapp für zwei Personen mit **GitHub Pages + Supabase** veröffentlichen.

## 1. Aktueller Stand

- Supabase-Organisation vorhanden: **simple42science's Org**
- Supabase-Projekt vorhanden: **KüchenDuett**
- Lokal existiert noch keine App und kein funktionsfähiges Git-Repository.
- Die GitHub-CLI kennt das Konto `YannickLuca`, muss aber neu angemeldet werden.
- Einzige Projektdatei ist aktuell dieser Plan.

## 2. Klare Aufgabenverteilung

**Codex übernimmt:** Architektur, App-Code, Datenbankschema, Migrationen, RLS-Sicherheit, Tests, Git, GitHub Actions, Deployment-Konfiguration, Fehlerbehebung und Dokumentation.

**Du übernimmst nur:** persönliche Logins/Freigaben, das sichere Hinterlegen von Zugangsdaten, E-Mail-Bestätigungen sowie kurze Tests mit zwei Konten und auf dem Smartphone.

Geheimnisse werden nie in Chat oder GitHub eingegeben. Der Supabase-`service_role`-/Secret-Key darf niemals ins Frontend. Die Supabase-Projekt-URL und der Publishable-/Anon-Key sind dagegen für Browser-Apps vorgesehen.

## 3. Umfang der ersten Veröffentlichung

Die erste Version enthält nur:

- Registrierung und Anmeldung per E-Mail/Passwort
- zwei getrennte Konten in einem gemeinsamen Haushalt
- Einladung der zweiten Person per einmaligem Code
- Lebensmittel anlegen, bearbeiten, suchen und filtern
- Menge erhöhen/reduzieren, verbrauchen und löschen
- Ablaufdatum, Lagerort und Anzeige bald ablaufender Lebensmittel
- zehn Sekunden „Rückgängig“ und kurzer Änderungsverlauf
- bearbeitbare Küchengeräte
- gespeicherte Rezepte und einfache Vorschläge anhand vorhandener Zutaten
- installierbare mobile PWA
- JSON-Export, Inventar leeren, Haushalt/Konto löschen

Nicht Teil dieser Veröffentlichung: KI, Barcode, Spracheingabe, Foto-/Kassenzettelerkennung, Push-Mitteilungen und vollständiges Offline-Schreiben.

## 4. Feste Technikentscheidungen

- **Frontend:** React, TypeScript und Vite
- **Navigation:** Hash-Routing, damit direkte Aufrufe auf GitHub Pages nicht mit 404 enden
- **Backend:** bestehendes Supabase-Projekt für Auth, PostgreSQL und Realtime
- **Sicherheit:** Row Level Security auf allen Haushaltsdaten
- **Hosting:** GitHub Pages
- **Deployment:** GitHub Actions bei jedem Push auf `main`
- **Repository:** `kuechen-duett`, öffentlich für kostenloses GitHub Pages
- **Produktions-URL:** voraussichtlich `https://yannickluca.github.io/kuechen-duett/`
- **Kosten:** 0 CHF/Monat innerhalb der kostenlosen Kontingente; keine Domain und keine KI-API

Vite erhält den Basis-Pfad `/kuechen-duett/`. Dynamische Inventardaten werden nicht vom Service Worker gecacht; offline startet nur die App-Oberfläche. GitHub Pages veröffentlicht das gebaute `dist`-Verzeichnis über einen offiziellen Actions-Workflow.

## 5. Minimales Datenmodell

| Tabelle | Zweck |
|---|---|
| `profiles` | Anzeigename zum Supabase-Konto |
| `households` | gemeinsamer Haushalt |
| `household_members` | Zuordnung der beiden Konten |
| `household_invitations` | einmalige, ablaufende Einladungscodes |
| `storage_locations` | Kühlschrank, Tiefkühler, Schränke, Keller usw. |
| `inventory_items` | Lebensmittel, Menge, Einheit, Lagerort und Daten |
| `inventory_transactions` | Änderungen und Rückgängig-Funktion |
| `equipment` | normale und spezielle Küchengeräte |
| `recipes` | gespeicherte Rezepte |
| `recipe_ingredients` | strukturierte Rezeptzutaten |
| `favorite_recipes` | gemeinsame Favoriten |

Jede Fachtabelle erhält eine Haushaltszuordnung. Mitglieder sehen und ändern nur Daten ihres Haushalts. Mengenänderungen, Undo, Einladung und endgültige Löschungen laufen atomar über geprüfte Datenbankfunktionen. Ein Testkonto aus einem anderen Haushalt muss bei allen Lese- und Schreibversuchen abgewiesen werden.

## 6. Heutiger Plan bis zur Veröffentlichung

Die Arbeitspakete werden in dieser Reihenfolge erledigt. Codex arbeitet jeweils selbstständig bis zur Abnahme oder bis eine persönliche Anmeldung/Freigabe nötig ist.

### AP 0 – Zugänge freigeben

**Du:**

1. In PowerShell `gh auth refresh -h github.com` ausführen und das Konto `YannickLuca` erneut autorisieren.
2. Bestätigen, dass das Repository `kuechen-duett` öffentlich sein darf. Bei GitHub Free ist das für kostenloses GitHub Pages erforderlich.
3. Im Supabase-Dashboard bereithalten: Project URL und Publishable-/Anon-Key. Keinen Secret-/Service-Role-Key teilen.
4. Falls Codex das Supabase-Projekt direkt verknüpfen soll, die Supabase-CLI persönlich anmelden; Codex gibt dafür bei Bedarf den exakten Befehl aus.

**Codex:** Danach GitHub- und Supabase-Zugriff prüfen. Keine geheimen Werte ausgeben oder committen.

**Fertig, wenn:** `gh auth status` erfolgreich ist und die Projektwerte sicher lokal verfügbar sind.

### AP 1 – Repository und App-Grundgerüst

**Codex:**

- Git-Repository initialisieren und GitHub-Repository `kuechen-duett` erstellen/verbinden
- React-/TypeScript-/Vite-App einrichten
- mobile Navigation, Hash-Router, Fehlerzustände und Grunddesign erstellen
- `.gitignore`, `.env.example`, README, Tests und Produktionsbuild einrichten
- Vite-Basis-Pfad für GitHub Pages konfigurieren

**Du:** Nur die Erstellung bzw. Verbindung des öffentlichen GitHub-Repositories bestätigen, falls GitHub danach fragt.

**Fertig, wenn:** App lokal startet, Tests/Build bestehen und `main` auf GitHub liegt.

### AP 2 – Supabase-Schema und Sicherheit

**Codex:**

- SQL-Migrationen für die Tabellen aus Kapitel 5 schreiben
- Fremdschlüssel, Mengenregeln, Standardlagerorte und Gerätevorlagen anlegen
- RLS und atomare Funktionen für Haushalt, Einladung, Mengenänderung, Undo und Löschung erstellen
- Migrationen mit dem vorhandenen Projekt **KüchenDuett** verknüpfen und anwenden
- RLS mit mindestens drei Testidentitäten prüfen

**Du:** Einmal die Projektverknüpfung oder Datenbankänderung bestätigen, falls die CLI/Dashboard-Sitzung dies verlangt.

**Fertig, wenn:** Migrationen reproduzierbar laufen und ein fremder Haushalt keinerlei Zugriff erhält.

### AP 3 – Anmeldung und gemeinsamer Haushalt

**Codex:** Registrierung, Login, Logout, Session, Profil, Haushalt erstellen sowie Einladung erzeugen/annehmen implementieren und testen.

**Du:**

- In Supabase Auth E-Mail/Passwort und E-Mail-Bestätigung nach Codex-Anleitung aktivieren
- zunächst `http://localhost:5173/**` als erlaubte Redirect-URL setzen
- zwei E-Mail-Adressen für den realen Einladungstest verwenden und Bestätigungslinks anklicken

**Fertig, wenn:** Beide Konten getrennt angemeldet sind und denselben Haushalt sehen.

### AP 4 – Inventar und Verlauf

**Codex:**

- Schnellerfassung und Bearbeiten von Name, Kategorie, Menge, Einheit, Lagerort, Ablauf-/Öffnungsdatum und Notiz
- Suche, Filter und Ablauf-Sortierung
- Erhöhen, Reduzieren, Verbrauchen, Löschen und Zusammenführen
- zehn Sekunden Undo, Änderungsverlauf und Realtime-Aktualisierung
- Konflikt-, Komponenten- und Datenbanktests

**Du:** Zehn echte Beispielartikel erfassen und auf zwei Konten kurz prüfen, ob Mengen, Lagerorte und Ablaufanzeige verständlich sind.

**Fertig, wenn:** Alle Inventaraktionen mobil funktionieren, keine Menge negativ wird und Partneränderungen sichtbar werden.

### AP 5 – Geräte und Rezepte

**Codex:**

- Standardgeräte sowie Panasonic SD-YR2550, kleinen Reiskocher und Tefal Ultracompact Sandwichmaker als editierbare Vorlagen anlegen
- Geräte hinzufügen, ändern, deaktivieren und löschen
- gespeicherte Rezepte, Zutaten, Favoriten und Filter implementieren
- Vorschläge in „alles vorhanden“, „wenig fehlt“ und „nutzt bald Ablaufendes“ einteilen

**Du:** Nur tatsächliche Fähigkeiten der drei Spezialgeräte und gewünschte eigene Rezepte bestätigen. Codex erfindet keine Geräteprogramme.

**Fertig, wenn:** Rezepttreffer anhand Inventar und aktiven Geräten nachvollziehbar sind.

### AP 6 – PWA, Datenschutz und Endtests

**Codex:**

- PWA-Manifest, Icons, Service Worker und Updatehinweis einrichten
- JSON-Export, Inventar leeren, Haushalt verlassen/löschen und Konto löschen umsetzen
- mobile Bedienung, Barrierefreiheit, Offline-/Fehlerzustände und Sicherheitsfälle testen
- vollständigen Produktionsbuild und End-to-End-Test ausführen

**Du:** App einmal auf dem Smartphone installieren und die Hauptabläufe sowie Löschwarnungen beurteilen.

**Fertig, wenn:** Tests und Build grün sind, keine Secrets enthalten sind und die App mobil installierbar ist.

### AP 7 – GitHub Pages veröffentlichen

**Codex:**

- GitHub-Actions-Workflow für Test, Build und Pages-Deployment erstellen
- benötigte öffentliche Supabase-Werte als GitHub Repository Variables verwenden
- Repository pushen und Workflow bis zum erfolgreichen Deployment überwachen
- Produktions-URL und Auth-Weiterleitungen prüfen

**Du:**

1. Falls nicht automatisierbar: Repository → **Settings → Pages → Source: GitHub Actions** wählen.
2. In Supabase → **Authentication → URL Configuration** setzen:
   - Site URL: `https://yannickluca.github.io/kuechen-duett/`
   - zusätzliche Redirect-URL: `http://localhost:5173/**`
   - Produktions-Redirect exakt gemäss der von Codex erzeugten Callback-URL
3. Notwendige GitHub-/Supabase-Freigaben bestätigen.

**Fertig, wenn:** `https://yannickluca.github.io/kuechen-duett/` lädt, Login/Bestätigungslink funktioniert und ein Push auf `main` automatisch neu veröffentlicht.

### AP 8 – Produktionsabnahme

**Codex:** Automatisierte Tests erneut ausführen, RLS-Angriffstest wiederholen, Deployment-Logs prüfen und gefundene Fehler beheben.

**Du:** Mit beiden Konten je einmal anmelden, einen Artikel hinzufügen, mit dem anderen Konto reduzieren, Undo testen, ein Rezept öffnen und die App installieren.

**Fertig, wenn:** Der komplette Ablauf auf der öffentlichen URL funktioniert. Dann ist das MVP veröffentlicht.

## 7. Abnahmekriterien

- [ ] Zwei Konten arbeiten sicher im selben Haushalt.
- [ ] Ein fremder Haushalt kann keine Daten lesen oder verändern.
- [ ] Inventar, Mengenaktionen, Ablaufanzeige, Verlauf und Undo funktionieren.
- [ ] Geräte und deterministische Rezeptvorschläge funktionieren ohne KI.
- [ ] Die PWA ist mobil installierbar.
- [ ] Export und Löschwege funktionieren mit klarer Bestätigung.
- [ ] Tests und Produktionsbuild bestehen.
- [ ] Keine geheimen Schlüssel liegen im Repository oder Browser-Bundle.
- [ ] GitHub Pages veröffentlicht automatisch aus `main`.
- [ ] Laufende Infrastrukturkosten bleiben bei 0 CHF.

## 8. Direkter nächster Schritt

Du erledigst nur **AP 0, Schritt 1** (`gh auth refresh -h github.com`) und meldest dich danach mit „GitHub ist angemeldet“. Anschliessend kann Codex AP 0 prüfen und die Arbeitspakete 1–8 weitgehend selbstständig abarbeiten.

Offizielle Referenzen: [GitHub Pages mit Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [GitHub Pages Custom Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
