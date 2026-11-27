#!/usr/bin/env node
// MTG HoloStudio, headless renderer. Zero dependencies: it starts the Studio server if it is not running,
// opens the Studio in your installed Chrome or Edge with the automation URL, waits for the clip and prints
// the result as JSON. This is the entry point the Claude Skill and Agent use.
//
//   node render.mjs --card "Sothera, the Supervoid" --set eoe --look "Golden vortex" --duration 2
//   node render.mjs --card "Island" --set eoe --number 368 --look "Galaxy foil" --format mov
//   node render.mjs --image cards/my-art.png --look "MTG Foil" --render still
//   node render.mjs --list-looks
//
// Options (all optional except a card source):
//   --card <name>        card name, English or Portuguese, typos tolerated (Scryfall fuzzy match)
//   --set <code>         set code, e.g. eoe, mh3, lea (pins the edition)
//   --number <cn>        collector number inside the set (pins the exact printing / variant)
//   --lang <xx|any>      printing language (default: English, else any language)
//   --face back          the back face of a double-faced card
//   --image <path|url>   use your own art instead of Scryfall (path relative to this folder, or /cards/...)
//   --look <name>        a look from the Look menu (base looks or your saved ones)
//   --motion <type>      motion preset (see --list-motions)
//   --amp <n> --period <s> --tiltx <deg> --tilty <deg>   motion amount, loop period, tilt
//   --zoom <n>           camera zoom, 0.2 to 5
//   --show back          start showing the card back
//   --back <path|url>    custom back PNG
//   --p.<id> <value>     any parameter by id, e.g. --p.comp.ink 0.8 --p.prism.intensity 1.2
//   --render <video|still>   default video
//   --format <webm|mov|mp4|png>   default webm (VP9 with alpha); mov = ProRes 4444 with alpha
//   --duration <s> --fps <n>      default 4 s at 30 fps (set duration = period for a perfect loop)
//   --bg <transparent|solid>      default transparent
//   --show-browser       run the browser in a visible window (use if headless WebGL is slow or black)
//   --timeout <s>        give up after this long (default 600)
//   --port <n>           Studio port (default 4517 or HOLOFOIL_PORT)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opt[key] = true;
    else { opt[key] = next; i++; }
}
const PORT = Number(opt.port ?? process.env.HOLOFOIL_PORT ?? 4517);
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { console.log(JSON.stringify({ ok: false, error: msg })); process.exit(1); };

async function up() {
    try { return (await fetch(`${BASE}/api/presets`, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
}
async function ensureServer() {
    if (await up()) {
        // a Studio server started before this update has no automation endpoint
        const probe = await fetch(`${BASE}/api/automation/result?id=probe`).catch(() => null);
        if (!probe?.ok) fail(`the Studio running on port ${PORT} is an older version: close the MTG HoloStudio window and open it again (or use --port 4600)`);
        return null;
    }
    const child = spawn(process.execPath, [path.join(ROOT, 'server.mjs'), '--no-open'], { cwd: ROOT, env: { ...process.env, HOLOFOIL_PORT: String(PORT) }, stdio: 'ignore' });
    for (let i = 0; i < 40; i++) { await sleep(250); if (await up()) return child; }
    child.kill();
    fail(`could not start the Studio server on port ${PORT}`);
}

// ------------------------------------------------------------------ list looks / motions without a browser
if (opt['list-looks'] || opt['list-motions']) {
    // English names come from the interface dictionary (holofoil/i18n.js); --look accepts either language
    const i18n = fs.readFileSync(path.join(ROOT, 'holofoil', 'i18n.js'), 'utf8');
    const en = (name) => i18n.match(new RegExp(`"${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*"([^"]+)"`))?.[1] ?? name;
    if (opt['list-motions']) {
        const line = fs.readFileSync(path.join(ROOT, 'holofoil', 'app.js'), 'utf8').match(/const MOTIONS = \{([^}]+)\}/)[1];
        console.log(JSON.stringify([...line.matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => ({ id: m[1], name: en(m[2]) })), null, 2));
        process.exit(0);
    }
    const child = await ensureServer();
    const list = await (await fetch(`${BASE}/api/presets`)).json();
    console.log(JSON.stringify(list.map((p) => ({ name: p.name, en: en(p.name), base: !!p.base, material: p.state?.material })), null, 2));
    child?.kill();
    process.exit(0);
}
if (!opt.card && !opt.image) fail('give a card (--card "<name>") or your own art (--image <path>)');

// ------------------------------------------------------------------ find a Chromium browser
function findBrowser() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
    const pf = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    const candidates = process.platform === 'win32'
        ? pf.flatMap((d) => [path.join(d, 'Google/Chrome/Application/chrome.exe'), path.join(d, 'Microsoft/Edge/Application/msedge.exe'), path.join(d, 'BraveSoftware/Brave-Browser/Application/brave.exe')])
        : process.platform === 'darwin'
            ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium']
            : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge', '/snap/bin/chromium'];
    return candidates.find((c) => fs.existsSync(c));
}

// ------------------------------------------------------------------ build the automation URL
const q = new URLSearchParams();
const pass = ['card', 'set', 'number', 'lang', 'face', 'image', 'look', 'material', 'motion', 'amp', 'period', 'tiltx', 'tilty', 'zoom', 'show', 'back', 'duration', 'fps', 'bg', 't'];
for (const k of pass) if (opt[k] !== undefined && opt[k] !== true) q.set(k, String(opt[k]));
for (const [k, v] of Object.entries(opt)) if (k.startsWith('p.')) q.set(k, String(v));
if (q.has('image') && !/^(https?:|\/)/.test(q.get('image'))) {
    // a local file: it must be inside this folder so the Studio server can serve it
    const abs = path.resolve(opt.image);
    if (!abs.startsWith(ROOT)) fail(`--image must be inside ${ROOT} (put it in cards/) or be a URL`);
    q.set('image', '/' + path.relative(ROOT, abs).replace(/\\/g, '/'));
}
if (q.has('back') && !/^(https?:|\/)/.test(q.get('back'))) q.set('back', '/' + path.relative(ROOT, path.resolve(opt.back)).replace(/\\/g, '/'));
const mode = String(opt.render ?? 'video');
q.set('render', mode === 'still' ? 'still' : String(opt.format ?? 'webm'));
const job = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
q.set('job', job);
const url = `${BASE}/holofoil/?${q}`;

// ------------------------------------------------------------------ run
const server = await ensureServer();
const browserPath = findBrowser();
if (!browserPath) { server?.kill(); fail('no Chrome, Edge, Brave or Chromium found: set CHROME_PATH to the browser executable'); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'holostudio-'));
const flags = [
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--window-size=1600,1000', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    ...(opt['show-browser'] ? [`--app=${url}`] : ['--headless=new', '--enable-unsafe-swiftshader', url]),
];
const browser = spawn(browserPath, flags, { stdio: 'ignore' });
const t0 = Date.now(), limit = Number(opt.timeout ?? 600) * 1000;
let result = null;
process.stderr.write(`rendering ${opt.card ?? opt.image}${opt.set ? ` [${opt.set}${opt.number ? ` #${opt.number}` : ''}]` : ''}${opt.look ? ` as "${opt.look}"` : ''}…\n`);
while (Date.now() - t0 < limit) {
    await sleep(1000);
    try {
        const r = await (await fetch(`${BASE}/api/automation/result?id=${job}`)).json();
        if (!r.pending) { result = r; break; }
    } catch { /* server busy encoding */ }
}
browser.kill();
server?.kill();
setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch { } }, 1500);
if (!result) fail(`timed out after ${Math.round(limit / 1000)} s (try --show-browser, or a shorter --duration)`);
const out = { ...result };
for (const k of ['file', 'dir']) if (out.result?.[k]) out.result[`${k}Abs`] = path.join(ROOT, out.result[k]);
console.log(JSON.stringify(out, null, 2));
process.exit(result.ok ? 0 : 1);
