---
name: holostudio
description: Render holographic foil animations of Magic: The Gathering (or any TCG) cards with MTG HoloStudio. Use when the user wants a foil, holo, surge, galaxy or vortex card clip, a spinning or tilting card video with alpha, a card PNG with a foil look, or animated card assets to feed into another video, motion or AI-generation tool. Finds cards on Scryfall by name (English or Portuguese, typos tolerated) and by set and collector number.
---

# MTG HoloStudio

MTG HoloStudio turns a card image into a physically lit holographic card (holo.spot engine on three.js)
and exports frame-exact clips at 1920 × 1080: WebM VP9 or ProRes 4444 with alpha, or MP4.
The Studio panel is a browser app; `render.mjs` drives the same panel headlessly, so you can produce
clips with one command and hand them to any other tool.

## Before the first render

Run from the repository root (the folder with `server.mjs` and `render.mjs`).

1. `node --version` must be 20 or newer.
2. `ffmpeg -version` must work, or set `FFMPEG_PATH`. Without ffmpeg you still get the PNG frames.
3. Chrome, Edge, Brave or Chromium must be installed; `render.mjs` finds it, or set `CHROME_PATH`.
4. Scryfall lookups need internet access from the browser. Your own art needs no network.

`render.mjs` starts the Studio server by itself when it is not running, and stops it afterwards.
If the user already has the Studio open (http://127.0.0.1:4517/holofoil/), it reuses that server.

## The one command

```bash
node render.mjs --card "<name>" [--set <code>] [--number <collector #>] --look "<look>" [options]
```

It prints JSON on stdout. On success: `ok: true`, the resolved `card` (official name, printed name,
set, set name, collector number, language, Scryfall link) and `result.fileAbs`, the absolute path of the
clip. On failure: `ok: false` and `error`. The exit code is 0 or 1. Progress goes to stderr.

### Picking the card (Scryfall)

| You know | Pass |
|---|---|
| Just the name, in English or Portuguese, even misspelled | `--card "sothera supervoid"`, `--card "anel solar"` |
| The edition | add `--set eoe` (Scryfall set code: `eoe`, `mh3`, `lea`, `fdn`…) |
| The exact printing / variant (borderless, showcase, promo, full-art land) | add `--number 382` |
| A language | `--lang pt`, `--lang ja`, `--lang any`… (default: English, or any language when there is no English printing) |
| The back face of a double-faced card | `--face back` |
| Not on Scryfall (custom card, proxy art, another TCG) | `--image cards/my-card.png` (put the file in `cards/`) or an https URL |

Name resolution order: exact name, then Scryfall's fuzzy match, then the Studio's own similarity
search (Portuguese names included). Without `--set`/`--number` the newest printing wins. When the user
names a printing ("the borderless Sothera", "the galaxy-foil Island from Edge of Eternities"), confirm the
set code and collector number on scryfall.com first if you have web access, and pass both. Read back the
`card` block of the result and tell the user which printing you rendered.

### Picking the look

`node render.mjs --list-looks` prints every look with its Portuguese and English names and material.
`--look` accepts either name and partial matches. Base looks:

| English name | Material | Good for |
|---|---|---|
| Classic foil | prism | the standard rainbow sheen of a traditional foil |
| Surge foil | surge | Surge foil profile (holographic, not embossed) |
| Galaxy foil | galaxy | holographic by tone, with stars, over a traditional foil masked by the art |
| Foil on art only | prism | foil only in the art box, frame and text stay printed |
| Concentric rainbow | prism | circular diffraction |
| Galaxy (glitter) | nebula | glittering star field |
| Cracked ice | shatter | shattered ice pattern |
| Dotted | sparkle | sparkling dot foil |
| Golden vortex | vortex | swirling gilded vortex |

The user's own saved looks (from the Studio's Save button) are listed too, and work the same way.

### Motion and timing

| Option | Meaning |
|---|---|
| `--motion sway\|sweep\|orbit\|flip\|manual` | sway = gentle tilt, sweep = light sweep, orbit = circular tilt, flip = seamless 360° spin (shows the back) |
| `--amp <degrees>` | tilt amount, 0 to 35 (default 16) |
| `--period <seconds>` | one full motion cycle, 1 to 12 (default 4) |
| `--tiltx` / `--tilty <degrees>` | base tilt of the card |
| `--duration <seconds>` `--fps <n>` | clip length, default 4 s at 30 fps |
| `--zoom <0.2…5>` | camera zoom |

### Product shots (camera)

`--shots '<json>'` turns the clip into a product-style presentation: a list of camera moves, cut one after the
other. Each item is `{"tipo": <type>, "dur": <seconds>, "zoom": <×, optional>}`. Types:

| tipo | Shot |
|---|---|
| `macro-nome` | close on the name bar, sliding along it |
| `macro-arte` | close on the art, slow push and light sweep |
| `macro-texto` | close on the rules text, sliding down |
| `rodape` | close on the artist credit at the bottom |
| `foil` | whole card tilting hard so the foil catches the light |
| `afastar-girar` | starts on the art, pulls back and spins 360° |
| `passeio` | dramatic low fly-over across the art, with a slight roll |
| `inteira` | whole card, gentle sway |
| `giro` | whole card, 360° spin |

Set `--duration` to the sum of the `dur` values. The camera really moves in (perspective), so sharpness is limited by
the card image: Scryfall images hold up to about 2×. `--size 1080x1920` renders vertical frames for shorts and reels.

```bash
node render.mjs --card "Silverquill Lecturer" --look "Galaxy foil" --size 1080x1920 --duration 7 \
  --shots '[{"tipo":"macro-nome","dur":1.2},{"tipo":"macro-arte","dur":1.8},{"tipo":"macro-texto","dur":1.5},{"tipo":"afastar-girar","dur":2.5}]'
```

**Seamless loop:** make `--duration` equal to `--period` (or a whole multiple). Rendering is deterministic,
frame by frame, so the last frame meets the first.

### Output

| Option | Result |
|---|---|
| `--format webm` (default) | VP9 with alpha: web, Remotion, HyperFrames, most editors |
| `--format mov` | ProRes 4444 with alpha: After Effects, Premiere, DaVinci, Final Cut |
| `--format mp4` | H.264, no alpha (use `--bg solid`) |
| `--format png` | only the PNG frame sequence |
| `--render still` (`--t <seconds>`) | one PNG of that instant, with alpha |
| `--bg transparent\|solid` | alpha or the Studio background |

Files land in `output/holofoil/<card-look>/<timestamp>/` (clip as `clipe.<ext>`, frames in `frames/`).

### Fine control

Any parameter of the panel can be set by id: `--p.<id> <value>`. Useful ones:

| id | What |
|---|---|
| `comp.foil` | foil intensity, 0 to 2 |
| `comp.ink` | ink density over the foil |
| `comp.varnish` | varnish highlight (looks ship with 0) |
| `mask.mode` | where the foil goes: `all`, `art`, `frame`, `custom` |
| `galaxy.gain`, `galaxy.base`, `galaxy.stars`, `galaxy.toneBlur` | Galaxy foil: holographic strength, traditional-foil mix, star noise, tone smoothing |
| `studio.*`, `bump.*`, `card.*` | holo.spot scene: lights, relief, card |

To see every id, open the Studio, press F12 and run `holostudio.params()`.
A look tuned by hand is reused by name once the user saves it in the panel (Look → Save as).

## Recipes

```bash
# loop for a short: borderless Sothera, gilded vortex, 4 s perfect loop, ProRes with alpha
node render.mjs --card "Sothera, the Supervoid" --set eoe --number 382 --look "Golden vortex" --period 4 --duration 4 --format mov

# galaxy-foil land, slow sway, WebM with alpha
node render.mjs --card "Island" --set eoe --number 368 --look "Galaxy foil" --motion sway --amp 12 --period 6 --duration 6

# reveal: 360° spin showing the back, 3 s
node render.mjs --card "Sol Ring" --look "Classic foil" --motion flip --period 3 --duration 3

# thumbnail still with the foil caught in the light
node render.mjs --card "Atraxa, Grand Unifier" --look "Surge foil" --render still --t 1.2

# your own art (another TCG, a proxy, a custom card)
node render.mjs --image cards/my-card.png --look "Cracked ice"
```

For a list of cards (a decklist, a top 10), run one command per card, sequentially (the renderer uses one
browser at a time), and collect the `fileAbs` of each.

## Feeding other generation panels

HoloStudio is the card layer; other tools do the rest. Pick the output by destination:

- **Editors and compositors** (After Effects, Premiere, DaVinci, Final Cut): `--format mov` with alpha, drop
  it over any background.
- **Code-based video** (Remotion, HyperFrames, Motion Canvas, a web page): `--format webm` with alpha; it
  plays as a transparent `<video>` layer.
- **AI video generators** (image-to-video, first/last-frame, reference images): render stills at the key
  moments (`--render still --t 0`, `--t <period/2>`) and use them as first frame, last frame or reference,
  so the generated shot keeps the real card and foil. Or render the clip and use it as a video reference.
- **Thumbnails and posts**: `--render still`, then compose in the design tool.
- **Frame-level work** (Blender, Nuke, custom pipelines): `--format png` and use the frame sequence.

When another tool needs a URL instead of a file, upload the file with that tool's own upload step.

## Check the result before handing it on

Extract one frame and look at it (needs ffmpeg; `-c:v libvpx-vp9` keeps the alpha of a WebM):

```bash
ffmpeg -v error -y -c:v libvpx-vp9 -i "<fileAbs>" -vf "select=eq(n\,15)" -frames:v 1 check.png
```

Then open `check.png`. The card must be centred and lit, not black, not white, not blank.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `no Chrome, Edge, Brave or Chromium found` | install one, or set `CHROME_PATH` |
| frames black, empty or very slow | add `--show-browser` (a visible window gets the real GPU) |
| `timed out` | shorter `--duration`, lower `--fps`, or `--show-browser`; raise `--timeout` |
| `look "…" does not exist` | `node render.mjs --list-looks` and use one of the names |
| `no card similar to "…"` / no printing with an image | check the name and set code on scryfall.com; some promos have no image |
| `ffmpeg did not encode` | install ffmpeg or set `FFMPEG_PATH`; the frames are still in `frames/` |
| `port … already in use` by something else | `--port 4600` |

Card images and data come from Scryfall. Magic: The Gathering and its card art are property of Wizards of
the Coast; tell users to follow the Wizards of the Coast Fan Content Policy when they publish.
