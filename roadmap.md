# Roadmap Planung - Boardgame Hub
Das Ziel ist eine App, die Spaß macht und intuitiv bedienbar ist. Die Terminplanung steht im Zentrum.

## 🚀 Phase 0: UI/UX Quick-Wins (Aktuell)
*   **[x] Redesign der Gruppen-Aktionsleiste:** Weg mit dem Leerraum, klare Benennung ("Spiel nachtragen").
*   **[x] Erweitertes Spiel-Logging ("Spiel nachtragen"):** (Erledigt)
    *   **Komponenten**: Spieldauer, Stimmung (Emoji), detaillierte Statistiken, Notizen.
    *   **[x] Visuelle Erinnerungen**: Upload von Sessions-Fotos (Kamera/Album). (Erledigt)
    *   **[x] Post-Event Reviews**: Direkte Aufforderung zur Bewertung/Logging des Spiels nach dem Event auf dem Dashboard.
    *   **[x] Smart Recommendations**: Gruppenspezifische Empfehlungen ("Pile of Shame") basierend auf Inventar vs. gespielte Spiele.
*   **[x] Gastgeber-Premium-Service**:
    *   **[x] Ortstypen**: Privat/Öffentlich Unterscheidung & Google Maps Route.
    *   **[x] Teilnehmer-Vorlieben**: Gast-Profil (Ernährung, Wünsche) impl.
    *   **[x] Planungsmodus:** Aktive Anfragen an Teilnehmer senden ("Kannst du Getränke/Spiel X mitbringen?"). (Erledigt)
*   **[x] Interaktives Dashboard / Kalender-View:** Ein vollwertiger Kalender unter `/calendar`, der alle Events der Gruppe zeigt und filtert.
    *   **[x] Ansicht:** Monatsansicht mit Event-Dots und Detail-Liste.
*   **[x] Check-in/Check-out System:** Speicherung der Anwesenheit (Check-in bei Ankunft, Check-out bei Ende).
*   **[x] Intelligente Benachrichtigungen:** Wenn nicht ausgecheckt wurde, folgt am nächsten Tag eine Erinnerung (via DB Cronjob).
*   **[x] UX für Terminplanung:** Schnellere Erstellung von Events via Quick-Action.
*   **[x] Direktions-Chat (1:1):** Wenn ein Spielerprofil angeklickt wird, öffnet sich eine Option zum privaten Chat.
*   **[x] Chat-Notifikationen-Management**: 
    *   **Globale Toggles**: Benachrichtigungen für Chats an/aus.
    *   **Mute-Funktion**: Gezieltes Stummschalten einzelner Spieler.
*   **[x] Permanenter Gruppenchat:** Ein zentraler Chatraum für jede Gruppe unter `/chat`. Echtzeit-Nachrichten via Supabase.

## 🎲 Phase 1.5: Game Logging 2.0 & Gruppen-Dynamik (Priorität)
*   **[x] Platzierungen Eingeben:** Unterstützung für manuelle Ränge (2., 3. Platz -> gibt XP) beim Loggen. (Erledigt)
*   **[x] UI-Optimierung Logging:** Größere Sterne, besseres Layout.
*   **[x] Chronik Interaktion:** Anklickbare Einträge für Details.
*   **[x] Gruppen-Wunschliste:** Voting für Spiele, die man spielen möchte.
*   **[x] Event-Tools:** Zeitfenster-Zusage ("Komme erst 19:00"), Bedingte zusagen (via Notiz), Event-Chat.
*   **[x] Epische Runde markieren:** Option nach Event-Ende, eine Session als "Episch" hervorzuheben. (Erledigt)
*   **[x] XP für nachträgliches Logging:** Belohnung auch für Spiele, die manuell nachgetragen werden. (Erledigt)
*   **[x] Bilder bei Spielen/Sessions:** Wichtiger Fokus auf Foto-Uploads bei Sessions. (Erledigt)
*   **[x] Feature Request Status:** "Erledigt" markieren funktioniert nun. (Erledigt)

## 📸 Phase 2: Orte & Atmosphäre
*   **[x] Visuelle Orte:** Fotos via URL bei Orten hinterlegt.
*   **[x] Ortstypen & Privatsphäre:** Unterscheidung Privat/Öffentlich implementiert.

## 🔔 Phase 3: Live-Event Experience & Mobile First
*   **[~] Push-Benachrichtigungen:** Implementierung gestartet. VAPID Keys generiert, Service Worker bereit, Frontend-Logik implementiert. Serverseitige Integration läuft. (IN ARBEIT)
*   **[x] Digitaler "Check-In":** Bei Eventstart erscheint ein Dialog: "Wer ist schon da?".
*   **[x] Pünktlichkeits-Tracking:** Statistiken darüber, wer am zuverlässigsten ist.
*   **[x] PWA Support & Mobile Nav:** Bottom-Navigation für bessere Handy-Bedienung.

## 🛠️ Phase 4: Usability & Scanner
*   **[x] Neue Spiele einfügen:** Gamification angepasst (+10 XP). (Erledigt)
*   **[x] Spiele mitbringen:** Gamification angepasst (+20 XP). (Erledigt)
*   **[x] Barcode-Scanner:** Integration eines Scanners (z.B. via QuaggaJS oder Barcode Detection API), um Spiele blitzschnell via EAN/UPC zur Sammlung hinzuzufügen.
*   **[ ] UI/UX Audit:** Überarbeitung der Navigation (z.B. Bottom-Navbar für Mobile) und Reduzierung von Klicks für Standard-Aktionen.

## 💡 Zusätzliche Ideen von Antigravity (Der letzte Schliff)
*   **[ ] KI-Spieleberater:** Ein Bot, der basierend auf der Gruppengröße und dem "Pile of Shame" Vorschläge macht.
*   **[x] Dynamic Badge System:** Verdienst von Abzeichen für besondere Leistungen.
*   **[x] XP & Level System:** Gamification-Fortschritt im Profil integriert.
*   **[ ] Personal Success Pulse:** Ein kleiner Graph auf dem Dashboard.
*   **[ ] "Game of the Group":** Ein Highlight-Bereich, der das am häufigsten gespielte Spiel des Monats in der Gruppe präsentiert.
*   **[ ] Pile of Shame Tracker:** Visueller Fortschrittsbalken: "Du hast 20% deiner Sammlung noch nicht gespielt – Zeit für einen neuen Termin!"
*   **[ ] Regel-Quickfinder:** Integration von Links zu Video-Tutorials oder PDF-Regeln bei jedem Spiel in der Sammlung.

## 🎨 Phase 5: Emotionale Features & Sammlungs-Insights
*   **[x] Erweiterte Sieges-Analyse (Smart Stats):**
    *   Automatische Bewertung des Sieges (z.B. "Knappe Kiste" bei <5% Abstand, "Klarer Sieg" bei >20%, "Dominiert" bei >50%).
    *   Dynamisches textliches Feedback im Log-Screen ("Das war eng!").
*   **[x] Visuelle Belohnungen (Celebration Mode):**
    *   **Konfetti-Effekt:** Animation beim Eintragen eines Sieges.
    *   Hervorhebung des Gewinners mit visuellen Effekten.
*   **[x] Smart Collection Insights:**
    *   Direktes Feedback beim Hinzufügen von Spielen zur Sammlung.
    *   Erkennung von Besonderheiten: "Wow, ein Top-10-Spiel!" (Popularität), "Ein Kickstarter-Exklusivtitel!", "Deine Sammlung ist jetzt über 100€ wert!".
