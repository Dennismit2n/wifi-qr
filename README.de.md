# WLAN-QR-Karte (WiFi QR Card)

![WLAN-QR-Karte](assets/promo.png)

**➡️ Ausprobieren: [dennismit2n.github.io/wifi-qr](https://dennismit2n.github.io/wifi-qr/)** &nbsp;·&nbsp; 🇬🇧 [English version](README.md)

Erstelle eine druckfertige WLAN-Karte mit QR-Code direkt im Browser. Gäste halten einfach die Handy-Kamera auf den Code — keine App, kein Passwort-Abtippen — und sind verbunden. Perfekt für den Kühlschrank, das Gästezimmer, die Ferienwohnung, das Café oder das Wartezimmer.

## Funktionen

- 📶 **Alle Netzwerktypen** — WPA / WPA2 / WPA3, WEP, offene und versteckte Netzwerke
- 🖨️ **Druckfertig** — gestaltetes Kärtchen und faltbarer Tischaufsteller, direkt aus dem Druckdialog
- 📤 **Teilen & Exportieren** — natives Teilen-Menü, PNG-Download, SVG für den Profi-Druck, Kopieren in die Zwischenablage
- 🌍 **9 Sprachen** — Deutsch, English, Español, Français, Italiano, Türkçe, हिन्दी, 中文, 日本語 (automatisch erkannt)
- 📱 **Installierbare PWA** — zum Startbildschirm hinzufügen; funktioniert komplett offline
- 🔒 **Radikal privat** — dein Passwort verlässt nie deinen Browser

## Datenschutz

Die ganze App besteht aus einer Handvoll statischer Dateien. Kein Server, kein CDN, keine Cookies, kein Tracking. Der QR-Code entsteht lokal in deinem Browser — schalte den Flugmodus ein, es funktioniert trotzdem. Du musst das nicht glauben: Öffne die DevTools und beobachte den Netzwerk-Tab, oder lies den Quellcode; er liegt komplett hier.

*Optionale Statistik:* Die App ist für [GoatCounter](https://www.goatcounter.com) vorbereitet (anonyme Besucherzählung ohne Cookies, offen im Footer deklariert). Aktuell ist sie **nicht aktiviert**.

## Entwicklung

Kein Build-Schritt, keine Abhängigkeiten.

```bash
node tools/dev-server.js
```

Dann http://localhost:8613 öffnen. Ändern, neu laden, fertig.

## Übersetzungen

Alle Oberflächen-Texte liegen in [js/i18n.js](js/i18n.js). Einige Übersetzungen sind maschinell erstellt — wenn etwas in deiner Sprache seltsam klingt, freuen wir uns sehr über Korrekturen per Pull Request oder Issue!

## Danksagung

- QR-Kodierung durch [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT, © Kazuhiko Arase), lokal eingebunden in `js/vendor/`, damit die App ohne externe Requests auskommt.
- „QR Code" ist eine eingetragene Marke von DENSO WAVE INCORPORATED.

## Lizenz

[MIT](LICENSE)
