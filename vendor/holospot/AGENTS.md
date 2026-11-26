# holospot: guide for agents

This repository gives a three.js scene the holographic materials of [holo.spot](https://www.holo.spot): diffraction foils, glitter, kinetic spirals, volume holograms and foil-embossed paper cards. The pictures match the site because the kit runs the site's own rendering code (`engine/`, copied byte for byte) and compares the two pixel by pixel (`tools/parity.mjs`).

Read this page first. It is enough to make an object holographic, build a scene around the materials, and render stills or video. Open the other files only for what this page points to.

## The three calls

```js
import * as THREE from "three";
import { Holo } from "holospot";                 // dist/holo.js

const holo = new Holo(renderer);                        // once, with the scene's WebGLRenderer
holo.apply(mesh, { material: "nebula", sizeMm: 120 }); // any Mesh or Group already in the scene
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)
```

- `holo.apply(target, options)` returns at once. The object appears when its shader has compiled; `await obj.ready` or `await holo.ready()` if you need to wait (a screenshot, a video).
- `holo.render(scene, camera)` replaces every `renderer.render(scene, camera)` call of the frame loop. Keep everything else of the scene as it is.
- The original mesh stays in the scene and keeps its transform, animation and parent. Its own material is ignored while the kit draws it.

## Loading the kit

In a page without a build step, map the names in an import map (the kit needs `three` to be the same copy your scene uses). The quickest way loads the kit straight from this repository through a CDN, with nothing to copy:

```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/",
  "holospot": "https://cdn.jsdelivr.net/gh/dmitrykurash/holospot@v0.1.0/dist/holo.js"
} }</script>
```

Use this for a single-file page (a chat answer, a quick demo). Keep the `@v0.1.0`: a fixed version never changes under the page. The kit finds its bump maps and hologram volumes next to that address by itself.

To host the files yourself, copy `dist/holo.js` and the `assets/` folder together, keeping them side by side (`holo/dist/holo.js`, `holo/assets/…`), and map `"holospot": "./holo/dist/holo.js"`. The kit loads its assets from `../assets/` relative to `holo.js`; if they live elsewhere, pass `new Holo(renderer, { assets: "https://…/assets/" })`. In a bundled project, import `dist/holo.js` the same way and serve `assets/` as static files.

Requirements: three.js r170 or newer (built and checked on r187), `THREE.WebGLRenderer` (WebGL 2). `WebGPURenderer` is not supported.

## Choosing a material

| `material` | Name on holo.spot | Looks like |
|---|---|---|
| `prism` | Prism Rainbow | Smooth silver rainbow foil: clean spectral bands that sweep across as it tilts (linear, concentric or radial pattern) |
| `shatter` | Gold Shatter | Cracked-ice foil under a gold lacquer: angular shards, each flashing its own colour |
| `nebula` | Nebula Glitter | Blue holographic glitter flakes, as on galaxy foils. What holo.spot's 3D object opens with |
| `sparkle` | Sky Sparkle | Sky-blue sparkle film: a dense field of tiny dots that twinkle |
| `vortex` | Gilded Vortex | Gold kinetic foil: spirals that seem to turn as it tilts |
| `volume` | Volume Hologram | A 3D image floating inside the film. Subjects: eagle, chip, wolf, globe, skull, falcon, emblem, or one you bake |
| `emboss` | Foil Emboss | Heavy cotton paper with hot-stamped foil logos and hologram stickers. Cards only: `holo.card({ material: "emboss" })` |

The colours named here are the defaults; each material's tint and structure are settings. Every parameter of a material, with its range and what it changes, is in `docs/materials/<material>.md`. Read that one file before tuning a material.

## Size matters: `sizeMm`

The foils are physical: a grating has a pitch in nanometres, a glitter flake a size in millimetres. `sizeMm` is the real-world size of the object's largest side (default 90). The same material looks coarse on a 40 mm object and fine on a 400 mm one. Your scene's own units do not matter; the kit works out the scale from `sizeMm`. `structureScale` (default 1) changes the pattern's density without changing the size: above 1 gives smaller shards, flakes and bump tiles on the object, below 1 larger ones.

## Settings

Settings are a flat map of ids to values:

```js
holo.apply(mesh, { material: "prism", settings: { "prism.pitch": 1400, "prism.pattern": "radial" } });
obj.set({ "prism.pitch": 1200 });                                    // later changes to the material
holo.setScene({ "display.ev": 0.8, "studio.preset": "softbox" });   // lights, exposure, grain, bump map, depth of field
```

- Material ids start with the material's name (`prism.*`). Scene ids are shared by all objects: `studio.*` (lights), `display.*` (exposure, tone curve, glare), `grain.*`, `bump.*` (surface bump map), `dof.*` (depth of field), `card.*` (card finish), `scene.background`, `scene.bgColor`. They are listed in `docs/scene-settings.md`, and machine-readably in `schema/holo.schema.json`.
- An unknown id is ignored with a console warning. Keep values inside the ranges the docs give.
- What is not given comes from the look: the values holo.spot ships for that kind of object. `look: "object"` (default) is the site's 3D object, `"card"` its holographic card, `"image"` its paper card, `"plain"` the bare parameter defaults. The shipped looks are also files in `presets/`.
- The first `apply` also takes the look's scene settings (lights, exposure, grain, background, depth of field). Later ones do not, unless you pass `scene: true`.

### A look copied from holo.spot

holo.spot is the design tool for the kit. On the site, tune a look, press `</>` (Copy settings) in the Object tab, and pass the copied JSON as `settings`, unchanged. It names its own material and carries the lights and the camera:

```js
const obj = holo.apply(mesh, { settings: blob, scene: true });
await obj.ready;
mesh.rotation.copy(shotRotation(obj.pose));                          // the tilt it was copied at (optional)
shotCamera(camera, obj, { aspect: innerWidth / innerHeight });       // holo.spot's framing (optional)
```

When a person describes a look in words, prefer asking them for a Copy settings blob over guessing values.

## What draws the frame

`holo.render` picks one of two ways (`compose` option to force one):

- **`replace`**: the scene holds only holographic objects. The kit draws the whole frame: the object, a flat background, glare, tone curve, grain, depth of field. This is the exact holo.spot picture.
- **`over`**: the scene holds other things (meshes, lines, points, a background texture), or the canvas is transparent. Your renderer draws them first, exactly as without the kit, with your lights, materials and tone mapping. The kit then composites the holographic objects on top, hidden where your objects are in front. Depth of field is off in this mode.

The background, in `replace` mode: `new Holo(renderer, { background: "black" | "white" | "#rrggbb" })`, else a plain colour set as `scene.background`, else the look's (white). In both modes it also tells the lighting how light the surroundings are, so set it to match the page (`"black"` for a dark page).

## Lights

Each holographic object is lit by holo.spot's studio rig, centred on the object: a soft panel, up to three small spots, and a studio environment. Your scene's three.js lights do not light it (they have no spectrum, and the colours come from the spectrum).

- By default the rig travels with your camera (`lights: "camera"`), so the object is lit as on holo.spot from wherever you look, and colours move when the object turns. `lights: "world"` fixes the rig in your scene instead (its front toward +z), so colours also move when the camera orbits.
- Change the lighting with `studio.*` settings or a preset: `holo.setScene({ "studio.preset": "softbox" })` (`studio`, `spot`, `softbox`, `strip`, `dark`, `desk`, `office`, `raking`).
- The colour play needs motion. Give the object or the camera some: a slow rotation, a pointer tilt (see `recipes/card.html`), an orbit.

## Cards, stickers, holograms

- `holo.card({ material, widthMm, heightMm, size })` returns a `THREE.Mesh` for a holographic card with its back and edge. Add it to the scene and move it like any mesh. `size` is the length of its longer side in your scene's units.
- `material: "emboss"` is the paper card. Its elements (up to six foil logos and hologram stickers, each with a position in millimetres on the face) are a small JSON document in the setting `emboss.doc`. Format and a worked example: `docs/materials/emboss.md` and `recipes/paper-card-stickers.html`. Without settings you get the card holo.spot ships (a logo and one sticker). Setting single-element ids such as `emboss.x` or `emboss.logo` without `emboss.doc` replaces that with one element. One paper design per page: all paper cards of a page share it.
- The `volume` material shows a 3D subject inside the film on any object or card. To make a subject from a model or an SVG logo: `node tools/bake-hologram.mjs --in model.glb --out my.sdf`, then `settings: { "volume.subject": "./my.sdf" }`.

## Recipes: start from the closest one

Each file in `recipes/` is one complete page that runs as it is. Copy the closest and change it.

| Request | Start from |
|---|---|
| "Make this object holographic" | `recipes/apply-to-mesh.html` |
| "Make this object in my existing scene holographic" | `recipes/existing-scene.html` |
| "Wrap my GLB model in holographic foil" | `recipes/glb-model.html` |
| "A holographic trading card that tilts with the pointer" | `recipes/card.html` |
| "A card with a foil logo and hologram stickers" | `recipes/paper-card-stickers.html` |
| "A hologram with a 3D image inside" | `recipes/hologram.html` |
| "The object floating over my web page" | `recipes/transparent-canvas.html` |
| "Use the exact look I made on holo.spot" | `recipes/copy-settings.html` |
| "Render a video" | `recipes/video-turntable.html` and `tools/render-video.mjs` |

## Look at what you made

Do not guess whether it worked. Add `holo.expose()` to the page and take a screenshot:

```
npm install
node tools/shot.mjs --page recipes/card.html --out out          # writes out/card.png and out/report.json
node tools/shot.mjs --url http://localhost:5173/ --name my-page --gl native
```

The tool waits until every object has been drawn, fails on shader errors and console errors, and saves a PNG. It needs a Chrome or Chromium binary (`CHROME_PATH`). `--gl native` uses the GPU; the default software renderer needs none but takes a minute or two per picture. Then open the PNG and look at it.

## Video

Write the page so that `window.renderFrame(t)` draws the frame for time `t` in seconds from nothing but `t`, passing the time on: `holo.render(scene, camera, { time: t, dt: 1 / fps })`. Then:

```
node tools/render-video.mjs --page recipes/video-turntable.html --seconds 6 --fps 30 --size 1280x720 --gl native --out out/clip
```

It saves one PNG per frame and, with ffmpeg installed, `out/clip/video.mp4`. Use `quality: "high"` for video. Without a GPU expect minutes per frame.

## Rules that prevent the common mistakes

1. Call `holo.render(scene, camera)` for every frame, and do not also call `renderer.render(scene, camera)` for the same frame.
2. Do not put the object's result through your own post-processing chain (`EffectComposer`) or tone mapping: the kit already finishes the frame. In `over` mode your renderer's own settings still apply to everything else.
3. Do not try to reproduce the look with `MeshPhysicalMaterial` iridescence, CSS gradients or a texture. Use `holo.apply`.
4. Let the kit size the canvas: call `renderer.setSize` and `renderer.setPixelRatio` as usual, and expect the kit to lower the pixel ratio to what the quality level allows.
5. The object must have real geometry: at least one mesh with triangles. Skinned and morph-animated meshes are drawn in the pose they had when `apply` ran; rigid motion (position, rotation) is followed every frame. Use a uniform scale.
6. One `Holo` per renderer. Create it once, not per frame or per object.
7. These materials are heavy shaders. `quality: "low" | "medium" | "high"` trades speed for detail; the default is what holo.spot ships for the look (`low` for a 3D object, `medium` for a card). Keep the number of holographic objects small (each is drawn in its own pass).
8. Depth of field is on in the `object` look, as on holo.spot. Turn it off with `settings: { "dof.on": false }` when the picture should be sharp everywhere.

## Limits of this version

- The object is lit by the kit's rig, not by your scene's lights, and it does not reflect your scene.
- No shadows are cast between holographic objects and the rest of the scene.
- A standard depth buffer is assumed in `over` mode (no logarithmic or reversed depth).
- holo.spot's ready-made scenes (the cloth simulation, the flag, the sticker wall) are not in the kit; the materials they use are.

## Map of the repository

| Path | What it is |
|---|---|
| `dist/holo.js`, `dist/holo.d.ts` | The built kit and its types |
| `assets/` | Bump maps, hologram subjects, sample logos the kit loads on demand |
| `recipes/` | Complete pages to copy |
| `docs/materials/` | One page per material: parameters and starting points |
| `docs/scene-settings.md` | Lights, display, grain, bump map, depth of field, card finish |
| `docs/how-it-works.md` | Why the look is physical, and the frame pipeline |
| `docs/frameworks.md` | React Three Fiber and bundler setups |
| `presets/` | The looks holo.spot ships, as settings files |
| `schema/holo.schema.json` | Every setting as JSON Schema |
| `tools/shot.mjs`, `tools/render-video.mjs` | Screenshots and video in headless Chrome |
| `tools/bake-hologram.mjs` | A model or SVG logo into a hologram subject |
| `tools/compare.mjs` | Compares two screenshots pixel by pixel |
| `tools/parity.mjs` | Compares the kit's picture with holo.spot's own code |
| `src/` | The kit's code: `holo.ts` (the API), `geometry.ts`, `settings.ts`, `compose.ts`, `paper.ts` |
| `engine/` | holo.spot's rendering engine, copied unchanged. Do not edit; `tools/sync-engine.mjs` refreshes it |

To change the kit itself: edit `src/`, run `npm run typecheck`, `npm run build` and `npm test`, then `tools/shot.mjs` on a recipe. Never edit `engine/`. Keeping the kit in step with holo.spot is described in `docs/maintaining.md`.
