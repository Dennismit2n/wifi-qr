/*
 * Erzeugt die Vorschaubilder aus tools/promo.html.
 *
 *   node tools/make-promo.mjs
 *
 * Die Bilder werden eingecheckt — sie müssen beim Ausliefern vorliegen —, aber
 * sie sind aus der Vorlage reproduzierbar. Ändert sich Farbe, Name oder
 * Untertitel, läuft das hier einmal neu.
 *
 * wifi-qr hat bewusst keine package.json und keine Abhängigkeiten; das ist im
 * README ein Versprechen und soll für ein Werbebild nicht gebrochen werden.
 * Playwright wird deshalb dort gesucht, wo es ohnehin schon liegt: in einem
 * Nachbarprojekt, das es für seine Browser-Tests braucht. Findet sich nichts,
 * bricht das Skript mit einer Anleitung ab, statt still etwas zu installieren.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, isAbsolute } from 'node:path';
import { stat } from 'node:fs/promises';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = resolve(hier, '..');

const FORMATE = [
  { id: 'og', datei: 'assets/og.png', breite: 1200, hoehe: 630, zweck: 'Vorschaukarte in Messengern' },
  { id: 'ig', datei: 'assets/instagram.png', breite: 1080, hoehe: 1080, zweck: 'Instagram, quadratisch' },
];

/*
 * Reihenfolge: erst das eigene Projekt (falls hier doch einmal installiert
 * wird), dann die Nachbarprojekte, dann ein selbst gesetzter Pfad.
 */
const QUELLEN = [
  process.env.PLAYWRIGHT_MODULE,
  '@playwright/test',
  'playwright',
  'playwright-core',
  resolve(wurzel, '../collective-calc/node_modules/@playwright/test/index.mjs'),
  resolve(wurzel, '../collective-calc/node_modules/@playwright/test/index.js'),
  resolve(wurzel, '../collective-calc/node_modules/playwright-core/index.js'),
].filter(Boolean);

async function ladeChromium() {
  for (const quelle of QUELLEN) {
    try {
      const kennung = isAbsolute(quelle) ? pathToFileURL(quelle).href : quelle;
      const modul = await import(kennung);
      // Bei den CommonJS-Einstiegen hängt alles unter default.
      const chromium = modul.chromium ?? modul.default?.chromium;
      if (chromium) {
        return { chromium, herkunft: quelle };
      }
    } catch {
      /* nächste Quelle versuchen */
    }
  }
  throw new Error(
    'Playwright nicht gefunden.\n' +
      'Entweder in einem Nachbarprojekt installieren (dort wird es für die Tests\n' +
      'ohnehin gebraucht), oder einmalig ohne Installation im Projekt:\n' +
      '  npx --yes playwright@1.62.0 --version   # holt das Paket in den npx-Zwischenspeicher\n' +
      'oder den Pfad selbst setzen:\n' +
      '  PLAYWRIGHT_MODULE=/pfad/zu/playwright-core/index.js node tools/make-promo.mjs',
  );
}

const { chromium, herkunft } = await ladeChromium();
console.log(`Playwright aus: ${herkunft}\n`);

const browser = await chromium.launch();
/*
 * Einfache Pixeldichte.
 *
 * 1200×630 ist die Norm für Vorschaukarten und 1080×1080 die native Größe bei
 * Instagram — beide werden nirgends vergrößert dargestellt. Mit doppelter
 * Dichte wird die Datei mehrere hundert Kilobyte groß, ohne dass es jemand
 * sieht. Bei einem Werkzeug, dessen Reiz die Schlankheit ist, wäre das ein
 * schlechter Witz.
 */
const seite = await browser.newPage({ deviceScaleFactor: 1 });
await seite.goto('file://' + resolve(wurzel, 'tools/promo.html').replace(/\\/g, '/'));

for (const f of FORMATE) {
  const ziel = resolve(wurzel, f.datei);
  await seite.locator(`#${f.id}`).screenshot({ path: ziel });
  const { size } = await stat(ziel);
  console.log(`${f.datei.padEnd(22)} ${f.breite}×${f.hoehe}  ${(size / 1024).toFixed(0)} KB  — ${f.zweck}`);
}

await browser.close();
