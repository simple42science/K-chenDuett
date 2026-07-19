# KüchenDuett – Projekt- und Veröffentlichungsplan

> Stand: 19. Juli 2026
>
> Ziel: Eine sichere mobile Webapp für zwei Personen mit **GitHub Pages + Supabase** veröffentlichen.
>
> Legende: `[x]` erledigt · `[ ]` offen

## 1. Aktueller Stand

- [x] Öffentliches Repository erstellt: [simple42science/K-chenDuett](https://github.com/simple42science/K-chenDuett)
- [x] Lokaler `main` verfolgt `origin/main` und ist mit GitHub synchronisiert
- [x] React-/TypeScript-/Vite-Grundgerüst mit mobiler Navigation vorhanden
- [x] GitHub-CI für Lint, Typprüfung, Tests und Build vorhanden
- [x] Letzter lokaler Qualitätslauf erfolgreich: 15/15 Tests und Produktionsbuild
- [x] Supabase-Organisation **simple42science's Org** und Projekt **KüchenDuett** vorhanden
- [x] Datenbankschema, RLS und Funktionen auf Supabase angewendet
- [x] Alle elf Anwendungstabellen vorhanden; RLS bei allen elf Tabellen aktiviert
- [x] Remote-Linter fehlerfrei; 9/9 selbstvalidierende RLS-Assertions bestanden und zurückgerollt
- [x] Anmeldung, Profil und gemeinsamer Haushalt technisch implementiert
- [ ] Anmeldung und Haushalt mit zwei echten Konten abnehmen
- [ ] GitHub Pages aktivieren und die App veröffentlichen

## 2. Aufgabenverteilung

**Codex übernimmt:** App-Code, Datenbankmigrationen, RLS, Tests, Git, CI/CD, Deployment, Fehlersuche und Dokumentation.

**Du übernimmst nur:** persönliche Logins/Freigaben, E-Mail-Bestätigungen, sichere Eingabe von Zugangsdaten und kurze Tests mit zwei Konten bzw. auf dem Smartphone.

Der Supabase-Secret-/Service-Role-Key darf niemals ins Frontend, in den Chat oder ins Repository. Im Browser werden ausschliesslich Project URL und Publishable-/Anon-Key verwendet; die Sicherheit kommt durch RLS.

## 3. MVP-Umfang

- Registrierung und Anmeldung per E-Mail/Passwort
- zwei getrennte Konten in einem gemeinsamen Haushalt
- Einladung der zweiten Person per einmaligem Code
- Lebensmittel anlegen, bearbeiten, suchen und filtern
- Mengen erhöhen/reduzieren, verbrauchen, löschen und kurz rückgängig machen
- Lagerorte, Ablaufdaten, Ablaufwarnungen und Änderungsverlauf
- gemeinsame, bearbeitbare Küchengeräte
- gespeicherte Rezepte, Favoriten und Vorschläge anhand des Inventars
- installierbare mobile PWA
- JSON-Export, Inventar leeren, Haushalt/Konto löschen

Nicht im MVP: KI, Barcode, Spracheingabe, Bild-/Kassenzettelerkennung, Push-Mitteilungen und vollständiges Offline-Schreiben.

## 4. Technik und Datenmodell

- **Frontend:** React, TypeScript, Vite, Hash-Routing
- **Backend:** bestehendes Supabase-Projekt mit Auth, PostgreSQL und Realtime
- **Sicherheit:** RLS auf allen Haushaltsdaten; atomare Datenbankfunktionen
- **Hosting:** GitHub Pages unter `https://simple42science.github.io/K-chenDuett/`
- **Deployment:** GitHub Actions bei Push auf `main`
- **Vite-Basispfad:** `/K-chenDuett/`
- **Kosten-Ziel:** 0 CHF/Monat ohne Domain und KI-API

| Tabelle | Zweck | Stand |
|---|---|---|
| `profiles` | Anzeigenamen | [x] Migration |
| `households` | gemeinsamer Haushalt | [x] Migration |
| `household_members` | Konten im Haushalt | [x] Migration |
| `household_invitations` | einmalige Einladungen | [x] Migration |
| `storage_locations` | Lagerorte | [x] Migration |
| `inventory_items` | Lebensmittelbestand | [x] Migration |
| `inventory_transactions` | Verlauf und Undo | [x] Migration |
| `equipment` | Küchengeräte | [x] Migration |
| `recipes` | gespeicherte Rezepte | [x] Migration |
| `recipe_ingredients` | Rezeptzutaten | [x] Migration |
| `favorite_recipes` | gemeinsame Favoriten | [x] Migration |

## 5. Arbeitspakete

Die Pakete werden in Reihenfolge umgesetzt. Ein Paket ist erst abgeschlossen, wenn seine offenen Punkte und Abnahmekriterien erfüllt sind.

### AP 0 – Zugänge und Repository · abgeschlossen

**Codex:**

- [x] Git lokal initialisiert
- [x] Remote `simple42science/K-chenDuett` verbunden
- [x] GitHub-Berechtigung korrigiert; Fork ist nicht nötig
- [x] `main` veröffentlicht und Upstream eingerichtet
- [x] Supabase-CLI-Anmeldung geprüft und Projekt **KüchenDuett** eindeutig ermittelt

**Du:**

- [x] GitHub-Browserfreigabe für `simple42science` bestätigt
- [x] Öffentliches Repository bestätigt
- [x] Im Projektterminal `npx supabase login` ausgeführt und Browserfreigabe bestätigt
- [x] Keine Zugangstoken oder Datenbankpasswörter im Repository gespeichert

**Fertig, wenn:** GitHub und Supabase CLI erreichbar sind, ohne dass ein Secret im Repository liegt.

### AP 1 – App-Grundgerüst · abgeschlossen

**Codex:**

- [x] React, TypeScript und Vite eingerichtet
- [x] Mobile Navigation und Hash-Routing erstellt
- [x] Grunddesign, Leer- und Fehlerzustände erstellt
- [x] `.gitignore`, `.env.example`, README und Lockdatei erstellt
- [x] Unit-/Komponententest-Basis eingerichtet
- [x] GitHub-CI für Lint, Typprüfung, Tests und Build erstellt
- [x] Vite-Basispfad an `K-chenDuett` angepasst
- [x] Lokale Prüfungen erfolgreich ausgeführt
- [x] Stand nach GitHub gepusht

**Du:** Keine offenen Aufgaben.

**Abnahme:** `main` liegt auf GitHub; `npm run check` ist erfolgreich.

### AP 2 – Supabase-Schema und Sicherheit · abgeschlossen

**Codex:**

- [x] Supabase-Projektstruktur initialisiert
- [x] Migration für alle elf Tabellen geschrieben
- [x] Fremdschlüssel, Mengenregeln und Indizes definiert
- [x] Standardlagerorte und Gerätevorlagen vorgesehen
- [x] RLS-Policies für getrennte Haushalte erstellt
- [x] Funktionen für Haushalt, Einladung, Menge, Undo und Löschung erstellt
- [x] pgTAP/RLS-Test mit drei Identitäten geschrieben
- [x] Supabase-Projekt per CLI verknüpft
- [x] `supabase db push --dry-run` geprüft: genau eine erwartete Migration
- [x] Migration auf **KüchenDuett** angewendet
- [x] Lokaler und Remote-Migrationsstand stimmen überein
- [x] `supabase db lint --linked` ohne Schemafehler ausgeführt
- [x] Docker-freien, transaktionalen Remote-RLS-Test ergänzt
- [x] 9/9 Remote-Assertions bestanden; alle Testdaten zurückgerollt
- [x] Elf Anwendungstabellen und elf aktivierte RLS-Tabellen separat verifiziert
- [x] TypeScript-Datenbanktypen aus dem angewendeten Schema generiert

**Du:**

- [x] `npx supabase login` ausgeführt
- [x] Browserfreigabe erteilt; ein Datenbankpasswort musste nicht geteilt werden
- [x] Fortsetzung von AP2 bestätigt

**Abnahme:** Migration, Linter und alle RLS-Tests laufen gegen das verknüpfte Projekt; ein fremder Haushalt erhält keinen Zugriff.

### AP 3 – Anmeldung und gemeinsamer Haushalt · technische Umsetzung abgeschlossen

**Codex:**

- [x] Supabase-Client und validierte Umgebungsvariablen angebunden
- [x] Registrierung, Login, Logout und Session-Wiederaufnahme implementiert
- [x] Profil und geschützte Routen implementiert
- [x] Haushalt erstellen sowie Einladung erzeugen/annehmen implementiert
- [x] Einmalige Einladungscodes nur gehasht speichern und auf 24 Stunden begrenzen
- [x] Lade-, Fehler- und abgelaufene Einladungszustände getestet
- [x] Sandbox-sicheren Test- und Buildlauf ohne Kindprozesse eingerichtet
- [x] 15/15 Tests, Lint, Typprüfung und Produktionsbuild erfolgreich

**Du:**

- [x] In Supabase E-Mail/Passwort, Bestätigung und starke Passwortregeln manuell konfiguriert
- [x] Lokale und produktive Redirect-URLs manuell freigegeben
- [x] Entscheidung: Standard-E-Mail-Vorlage und MFA-/Session-Einstellungen nicht verändern
- [ ] Bestätigungslinks für zwei Testkonten anklicken
- [ ] Konto A erstellt einen Haushalt und einen Einladungscode; Konto B nimmt ihn an

**Abnahme:** Zwei getrennte Konten sehen sicher denselben Haushalt; ein drittes Konto bleibt ausgeschlossen.

### AP 4 – Inventar und Verlauf · offen

**Codex:**

- [ ] Schnellerfassung und Bearbeiten aller Inventarfelder
- [ ] Suche, Filter und Ablauf-Sortierung
- [ ] Erhöhen, Reduzieren, Verbrauchen, Löschen und Zusammenführen
- [ ] Zehn-Sekunden-Undo und verständlichen Verlauf anbinden
- [ ] Realtime-Aktualisierung und Versionskonflikte behandeln
- [ ] Komponenten-, Datenbank- und Zwei-Konten-Tests ergänzen

**Du:**

- [ ] Zehn realistische Lebensmittel erfassen
- [ ] Mengen- und Partneränderungen kurz auf zwei Konten prüfen

**Abnahme:** Alle Inventaraktionen funktionieren mobil, Mengen werden nie negativ und Partneränderungen erscheinen zuverlässig.

### AP 5 – Küchengeräte · offen

**Codex:**

- [ ] Geräteliste und Geräteeditor implementieren
- [ ] Hinzufügen, Bearbeiten, Deaktivieren und Löschen umsetzen
- [ ] Standardgeräte und bekannte Spezialgeräte anzeigen
- [ ] Fähigkeiten für späteres Rezept-Matching strukturiert verwenden

**Du:**

- [ ] Fähigkeiten von Panasonic SD-YR2550, Reiskocher und Tefal-Sandwichmaker bestätigen

**Abnahme:** Beide Konten verwalten dieselbe Ausstattung; deaktivierte Geräte gelten als nicht verfügbar.

### AP 6 – Rezepte und Inventar-Matching · offen

**Codex:**

- [ ] Gespeicherte Rezepte, Zutaten und gemeinsame Favoriten implementieren
- [ ] Aufwand, Zeiten, Mahlzeit, Ernährung und Geräte filterbar machen
- [ ] Zutaten mit sicheren Einheitenumrechnungen abgleichen
- [ ] Treffer als „alles vorhanden“, „wenig fehlt“ und „nutzt bald Ablaufendes“ einteilen
- [ ] Treffergründe verständlich anzeigen und Fachlogik testen

**Du:**

- [ ] Gewünschte eigene Rezepte bzw. Testrezepte bestätigen
- [ ] Fünf typische Rezepttreffer kurz beurteilen

**Abnahme:** Vorschläge sind ohne KI nachvollziehbar und passen zu Inventar, Zeit und aktiven Geräten.

### AP 7 – PWA und Datenschutz · offen

**Codex:**

- [ ] PWA-Manifest, Icons, Service Worker und Updatehinweis
- [ ] App-Shell offline verfügbar machen; Schreibaktionen ehrlich als onlinepflichtig behandeln
- [ ] JSON-Export implementieren
- [ ] Inventar leeren, Haushalt verlassen/löschen und Konto löschen
- [ ] Barrierefreiheit, mobile Bedienung und Sicherheitsfälle testen

**Du:**

- [ ] App auf dem Smartphone installieren und Hauptabläufe prüfen
- [ ] Endgültige Löschwarnungen beurteilen

**Abnahme:** Die PWA ist installierbar; Export und Löschwege funktionieren sicher und verständlich.

### AP 8 – GitHub Pages Deployment · offen

**Codex:**

- [ ] Pages-Workflow für Test, Build und Deployment erstellen
- [ ] Öffentliche Supabase-Werte als GitHub Repository Variables anbinden
- [ ] GitHub Pages auf Actions als Quelle konfigurieren, soweit per CLI möglich
- [ ] Deployment bis zum erfolgreichen Lauf überwachen
- [ ] Asset-Pfade und Produktions-URL prüfen

**Du:**

- [ ] Falls nötig unter **Settings → Pages → Source: GitHub Actions** bestätigen
- [x] In Supabase die Site URL `https://simple42science.github.io/K-chenDuett/` eingetragen
- [x] Lokale und exakte produktive Auth-Redirect-URLs freigegeben

**Abnahme:** Die Produktions-URL lädt; Login funktioniert; jeder erfolgreiche Push auf `main` veröffentlicht automatisch.

### AP 9 – Produktionsabnahme · offen

**Codex:**

- [ ] Vollständige automatisierte Prüfungen ausführen
- [ ] RLS-Angriffstest wiederholen
- [ ] GitHub-Actions- und Browserfehler prüfen und beheben
- [ ] Abnahmeprotokoll erstellen

**Du:**

- [ ] Mit beiden Konten den kompletten Hauptablauf auf der öffentlichen URL testen

**Abnahme:** Konto, Haushalt, Inventar, Undo, Geräte, Rezepte, Export, Installation und Löschung funktionieren produktiv.

### AP 10 – Betrieb, Backup und Wartung · nach MVP

**Codex:**

- [ ] Monatliche Export-/Backup-Checkliste dokumentieren
- [ ] Wiederherstellung eines Exports mit Testdaten prüfen
- [ ] Supabase- und GitHub-Free-Tier-Grenzen dokumentieren
- [ ] Sichere Abhängigkeitsupdates und regelmässigen Qualitätslauf einrichten
- [ ] Kleine Fehler- und Wartungsliste führen

**Du:**

- [ ] Monatlich bzw. vor grossen Änderungen einen Export herunterladen
- [ ] Kosten-/Quota-Hinweise gelegentlich kontrollieren

**Abnahme:** Daten können gesichert und testweise wiederhergestellt werden; Wartung verursacht keine unerwarteten Kosten.

### AP 11 – Optionale Erweiterungen · erst nach stabilem MVP

Reihenfolge nach tatsächlichem Bedarf:

1. [ ] gemeinsame Einkaufsliste aus fehlenden Rezeptzutaten
2. [ ] Barcode-Scanner mit manueller Bestätigung
3. [ ] Ablauf-Erinnerungen/Push-Mitteilungen
4. [ ] Spracheingabe
5. [ ] Foto- oder Kassenzettelerkennung
6. [ ] kostenbegrenzte KI-Rezepte mit Serverfunktion und austauschbarem Anbieter

Für jede Erweiterung entscheidet **du** nur Nutzen und Budget; **Codex** übernimmt Architektur, Umsetzung, Datenschutzprüfung und Tests.

## 6. MVP-Abnahmekriterien

- [ ] Zwei Konten arbeiten sicher im selben Haushalt.
- [ ] Ein fremder Haushalt kann keine Daten lesen oder verändern.
- [ ] Inventar, Mengenaktionen, Ablaufanzeige, Verlauf und Undo funktionieren.
- [ ] Geräte und deterministische Rezeptvorschläge funktionieren ohne KI.
- [ ] Die PWA ist mobil installierbar.
- [ ] Export und Löschwege funktionieren mit klarer Bestätigung.
- [x] Lokale Tests und Produktionsbuild bestehen im aktuellen Grundgerüst.
- [x] Aktuell liegen keine geheimen Schlüssel im Repository oder Browser-Bundle.
- [x] RLS-Tests bestehen gegen das verknüpfte Supabase-Projekt.
- [ ] GitHub Pages veröffentlicht automatisch aus `main`.
- [ ] Laufende Infrastrukturkosten bleiben bei 0 CHF.

## 7. Direkter nächster Schritt

AP3 ist technisch umgesetzt. Für die reale Abnahme fehlen nur zwei bestätigte Testkonten:

> `npm run dev` starten, zwei Konten registrieren und beide E-Mail-Links bestätigen.

Danach erstellt Konto A einen Haushalt und unter **Mehr** einen Einladungscode. Konto B meldet
sich in einem privaten Browserfenster an und nimmt den Code über **Beitreten** an. Codex wertet
das Ergebnis aus und schliesst AP3 ab.

Referenzen: [GitHub Pages mit Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
