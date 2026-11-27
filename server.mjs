// ============================================================
//  MTG HOLOSTUDIO — servidor local (sem dependências: só o Node)
//
//    node server.mjs              abre o Studio no navegador (usa a sua placa de vídeo)
//    node server.mjs --no-open
//
//  Só serve esta pasta em 127.0.0.1 e grava:
//    data/holofoil/presets/<look>.json      looks salvos
//    data/holofoil/maps|bumps|backs/        imagens que você abriu no Studio
//    output/holofoil/<carta>/…              PNGs, sequências e clipes (mov/webm com alpha, mp4)
//  Variáveis opcionais: HOLOFOIL_PORT (porta, padrão 4517) e FFMPEG_PATH (caminho do ffmpeg).
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PRESETS = path.join(ROOT, 'data', 'holofoil', 'presets');
const OUT = path.join(ROOT, 'output', 'holofoil');
const MAPS = path.join(ROOT, 'data', 'holofoil', 'maps');
const PORT = Number(process.env.HOLOFOIL_PORT) || 4517;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.sdf': 'application/octet-stream' };
const clean = (s) => (s || 'carta').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'carta';
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const json = (res, body, code = 200) => res.writeHead(code, { 'content-type': 'application/json' }).end(JSON.stringify(body));
const body = (req) => new Promise((ok, no) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => ok(Buffer.concat(chunks)));
    req.on('error', no);
});
/** imagens de carta que você deixou na pasta cards/, as mais novas primeiro */
function localImages() {
    const found = [];
    const walk = (dir, depth) => {
        if (depth > 5 || !fs.existsSync(dir))
            return;
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory())
                walk(p, depth + 1);
            else if (/\.(png|jpe?g|webp)$/i.test(e.name))
                found.push({ url: '/' + rel(p).split('/').map(encodeURIComponent).join('/'), t: fs.statSync(p).mtimeMs });
        }
    };
    walk(path.join(ROOT, 'cards'), 0);
    return found.sort((a, b) => b.t - a.t).slice(0, 240).map((f) => f.url);
}
function presets() {
    const list = [];
    try {
        for (const p of JSON.parse(fs.readFileSync(path.join(ROOT, 'holofoil', 'presets-base.json'), 'utf8')))
            list.push({ ...p, base: true });
    }
    catch {
        /* sem looks de base */
    }
    if (fs.existsSync(PRESETS)) {
        for (const f of fs.readdirSync(PRESETS).filter((x) => x.endsWith('.json')).sort()) {
            try {
                const mine = JSON.parse(fs.readFileSync(path.join(PRESETS, f), 'utf8'));
                // a sua versão de um look de base toma o lugar dele no menu (remover a sua devolve o de base)
                const at = list.findIndex((x) => x.base && x.name === mine.name);
                if (at >= 0)
                    list[at] = mine;
                else
                    list.push(mine);
            }
            catch {
                /* arquivo quebrado: ignora */
            }
        }
    }
    return list;
}
const jobs = new Map();
const results = new Map();
function encode(dir, fps, fmt, alpha) {
    if (fmt === 'png')
        return {};
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
    const input = ['-y', '-v', 'error', '-framerate', String(fps), '-i', path.join(dir, 'frames', 'f_%05d.png')];
    const even = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    let file;
    let args;
    if (fmt === 'mov') {
        file = path.join(dir, 'clipe.mov');
        args = [...input, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', alpha ? 'yuva444p10le' : 'yuv444p10le', '-vendor', 'apl0', file];
    }
    else if (fmt === 'webm') {
        file = path.join(dir, 'clipe.webm');
        args = [...input, '-vf', even, '-c:v', 'libvpx-vp9', '-pix_fmt', alpha ? 'yuva420p' : 'yuv420p', '-b:v', '0', '-crf', '18', '-row-mt', '1', file];
    }
    else {
        file = path.join(dir, 'clipe.mp4');
        args = [...input, '-vf', even, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file];
    }
    const r = spawnSync(ffmpeg, args, { encoding: 'utf8' });
    if (r.status !== 0)
        return { error: `O ffmpeg não codificou (${(r.stderr || r.error?.message || 'não encontrado').toString().trim().split('\n').pop()}). Instale o ffmpeg ou aponte a variável FFMPEG_PATH para ele.` };
    return { file: rel(file) };
}
const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? '/', 'http://x');
        const p = decodeURIComponent(url.pathname);
        if (p === '/')
            return res.writeHead(302, { location: '/holofoil/' }).end();
        if (p === '/favicon.ico')
            return res.writeHead(204).end();
        if (p === '/api/local')
            return json(res, localImages());
        if (p === '/api/maps' && req.method === 'GET') {
            // padrões de foil: os de base (holofoil/maps) e os abertos pelo usuário (data/holofoil/maps)
            const list = [];
            for (const dir of [path.join(ROOT, 'holofoil', 'maps'), MAPS]) {
                if (!fs.existsSync(dir))
                    continue;
                for (const f of fs.readdirSync(dir).filter((x) => /\.(png|jpe?g|webp)$/i.test(x)).sort()) {
                    const base = f.replace(/\.[a-z]+$/i, '');
                    list.push({ name: dir === MAPS ? base : base.charAt(0).toUpperCase() + base.slice(1), url: '/' + rel(path.join(dir, f)) });
                }
            }
            return json(res, list);
        }
        if (p === '/api/maps' && req.method === 'POST') {
            // imagens que o usuário abre no Studio: padrões de foil (maps), relevos (bumps) e versos de carta (backs)
            const kind = ['maps', 'bumps', 'backs'].includes(url.searchParams.get('kind') ?? '') ? url.searchParams.get('kind') : 'maps';
            const dir = path.join(ROOT, 'data', 'holofoil', kind);
            const raw = url.searchParams.get('name') ?? 'imagem.png';
            const ext = (/\.(png|jpe?g|webp)$/i.exec(raw)?.[0] ?? '.png').toLowerCase();
            fs.mkdirSync(dir, { recursive: true });
            const file = path.join(dir, `${clean(raw.replace(/\.[a-z]+$/i, ''))}${ext}`);
            fs.writeFileSync(file, await body(req));
            return json(res, { file: rel(file), url: '/' + rel(file) });
        }
        if (p === '/api/presets' && req.method === 'GET')
            return json(res, presets());
        if (p === '/api/presets' && req.method === 'DELETE') {
            const file = path.join(PRESETS, `${clean(url.searchParams.get('name') ?? '')}.json`);
            if (!fs.existsSync(file))
                return json(res, { error: 'look não encontrado (os de base não são removíveis)' }, 404);
            fs.unlinkSync(file);
            return json(res, { ok: true });
        }
        if (p === '/api/presets' && req.method === 'POST') {
            const b = JSON.parse((await body(req)).toString('utf8'));
            fs.mkdirSync(PRESETS, { recursive: true });
            fs.writeFileSync(path.join(PRESETS, `${clean(b.name)}.json`), JSON.stringify({ name: b.name, state: b.state }, null, 2));
            return json(res, { ok: true });
        }
        if (p === '/api/still' && req.method === 'POST') {
            const name = clean(url.searchParams.get('name') ?? '');
            const dir = path.join(OUT, name);
            fs.mkdirSync(dir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const file = path.join(dir, `${name}_${stamp}.png`);
            fs.writeFileSync(file, await body(req));
            return json(res, { file: rel(file) });
        }
        if (p === '/api/export/start' && req.method === 'POST') {
            const name = clean(url.searchParams.get('name') ?? '');
            const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const dir = path.join(OUT, name, stamp);
            fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
            const job = `${name}-${stamp}`;
            jobs.set(job, dir);
            return json(res, { job });
        }
        if (p === '/api/export/frame' && req.method === 'POST') {
            const dir = jobs.get(url.searchParams.get('job') ?? '');
            const i = Number(url.searchParams.get('i'));
            if (!dir || !Number.isInteger(i) || i < 0)
                return json(res, { error: 'job desconhecido' }, 400);
            fs.writeFileSync(path.join(dir, 'frames', `f_${String(i).padStart(5, '0')}.png`), await body(req));
            return json(res, { ok: true });
        }
        // automação (render.mjs): a página publica o resultado aqui e o script lê
        if (p === '/api/automation/result') {
            const id = (url.searchParams.get('id') ?? '').replace(/[^\w-]/g, '').slice(0, 64);
            if (!id)
                return json(res, { error: 'falta id' }, 400);
            if (req.method === 'POST') {
                results.set(id, JSON.parse((await body(req)).toString('utf8') || '{}'));
                return json(res, { ok: true });
            }
            return results.has(id) ? json(res, results.get(id)) : json(res, { pending: true });
        }
        if (p === '/api/export/finish' && req.method === 'POST') {
            const dir = jobs.get(url.searchParams.get('job') ?? '');
            if (!dir)
                return json(res, { error: 'job desconhecido' }, 400);
            const r = encode(dir, Number(url.searchParams.get('fps')) || 30, url.searchParams.get('fmt') ?? 'mov', url.searchParams.get('alpha') === '1');
            return json(res, { dir: rel(dir), ...r });
        }
        // arquivos estáticos: só de dentro desta pasta, e nunca .env nem .git
        let file = path.normalize(path.join(ROOT, p));
        if (!file.startsWith(ROOT) || path.basename(file).startsWith('.env') || /(^|[\\/])\.git([\\/]|$)/.test(path.relative(ROOT, file)))
            return res.writeHead(403).end();
        if (fs.existsSync(file) && fs.statSync(file).isDirectory())
            file = path.join(file, 'index.html');
        if (!fs.existsSync(file))
            return res.writeHead(404).end('not found');
        res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
        fs.createReadStream(file).pipe(res);
    }
    catch (e) {
        json(res, { error: e.message }, 500);
    }
});
for (const need of ['vendor/holospot/dist/holo.js', 'vendor/three/three.module.js', 'holofoil/index.html']) {
    if (!fs.existsSync(path.join(ROOT, need))) {
        console.error(`✗ Falta ${need}.`);
        process.exit(1);
    }
}
server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `✗ A porta ${PORT} já está em uso: o Studio já está aberto? (http://127.0.0.1:${PORT}/holofoil/)` : `✗ ${e.message}`);
    process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${PORT}/holofoil/`;
    console.log(`MTG HoloStudio em ${url}\n(deixe esta janela aberta; Ctrl+C para fechar)`);
    if (!process.argv.includes('--no-open')) {
        const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
        try {
            spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => { }).unref();
        }
        catch {
            /* sem navegador: o endereço está no console */
        }
    }
});
