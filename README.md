# WiFi QR Card

![WiFi QR Card](assets/promo.png)

**➡️ Try it: [dennismit2n.github.io/wifi-qr](https://dennismit2n.github.io/wifi-qr/)** &nbsp;·&nbsp; 🇩🇪 [Deutsche Version dieser Seite](README.de.md)

Create a printable WiFi QR card right in your browser. Guests point their phone camera at the code — no app, no password typing — and they're connected. Perfect for your fridge, guest room, vacation rental, café or waiting room.

## Features

- 📶 **All network types** — WPA / WPA2 / WPA3, WEP, open and hidden networks
- 🖨️ **Print-ready** — designed card and a foldable table tent, straight from the print dialog
- 📤 **Share & export** — native share sheet, PNG download, SVG for professional printing, copy to clipboard
- 🌍 **12 languages** — Deutsch, English, Español, Français, Italiano, Português, Türkçe, Русский, हिन्दी, 中文, 日本語, 한국어 (auto-detected)
- 📱 **Installable PWA** — add it to your home screen; works fully offline
- 🔒 **Radically private** — your password never leaves your browser

## Privacy

The whole app is a handful of static files. There is no server, no CDN, no cookies, no accounts. The QR code is generated locally in your browser — turn on airplane mode and it still works. Don't take our word for it: open DevTools and watch the network tab, or read the source; it's all here.

*Analytics:* the app uses [GoatCounter](https://www.goatcounter.com) for anonymous, cookieless visit counting (disclosed in the footer). The script is vendored locally in `js/vendor/count.js`; the only external request is the count pixel. No personal data, no cookies, no cross-site tracking — and your WiFi password is never involved.

## Development

No build step, no dependencies.

```bash
node tools/dev-server.js
```

Then open http://localhost:8613. Edit, reload, done.

**When deploying:** bump the `CACHE` constant in [sw.js](sw.js) so installed clients pick up the new version immediately. (The service worker also refreshes cached assets in the background — stale-while-revalidate — so even a forgotten bump heals itself on the visitor's next visit.)

## Translations

Interface strings live in [js/i18n.js](js/i18n.js). Some translations are machine-generated — if something sounds off in your language, corrections via pull request or issue are very welcome!

## Credits

- QR encoding by [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT, © Kazuhiko Arase), vendored in `js/vendor/` so the app needs no external requests.
- "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## License

[MIT](LICENSE)
