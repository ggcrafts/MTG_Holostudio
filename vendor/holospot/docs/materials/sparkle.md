# Sky Sparkle (`sparkle`)

Sky Sparkle imitates embossed holographic sparkle film: the "glitter pattern" vinyl of stickers, labels and heat-transfer film, and the speckle finishes of trading cards. A pale sky-blue matte foil is covered with small irregular dots (0.47 mm by default). The dots share one grating, so together they form a broad rainbow band, but each dot lights and colours slightly on its own. In motion the band slides across the surface and shimmers dot by dot, while the matte base stays evenly bright with a fine sand grain, and a few dark blue specks sit among the dots.

**When to use it.** Use it for a bright, soft sparkle on a light metallic base: sticker vinyl, gift wrap, pastel packaging. Unlike Nebula Glitter it stays bright from every angle, and its colours form one ordered band instead of random pinpoints.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "sparkle", sizeMm: 120, settings: { "sparkle.size": 600, "sparkle.coverage": 0.5 } });
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

obj.set({ "sparkle.tint": "clear" });               // change a value later
```

## Where the values come from

Settings are a flat map of ids to values. A value you do not pass comes from the look you start from, and after that from the default in the tables below:

- `holo.apply(mesh, …)` starts from the look `object` (holo.spot's 3D object), `holo.card(…)` from the look `card` (its holographic card).
- A look ships its own lights, exposure and background, and for some materials its own material values. They are listed under "What holo.spot ships" below.
- Pass `look: "plain"` to start from the defaults in the tables exactly.
- An id that is not a setting of the scene or of this material is ignored, with a console warning.

Lengths are real. The object has a real-world size (`sizeMm`, its largest side in millimetres, default 90; a card has `widthMm` and `heightMm`, default 63 × 88), and every length below is measured on it. The same settings look coarser on a small object and finer on a large one.

Scene-level settings (lights `studio.*`, `display.*`, `grain.*`, bump map `bump.*`, depth of field `dof.*`, card finish `card.*`, background) are shared by all objects and are described in `docs/scene-settings.md`.

## Parameters

Sky Sparkle has 34 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Dots

The rainbow dots: their size, density and how much each differs from its neighbours.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.size` | 100 to 1500 | `470` | µm | Mean diameter of a dot. Small values give a fine glitter texture, large values confetti-like dots. |
| `sparkle.coverage` | 0.1 to 0.8 | `0.4` |  | Share of the surface covered by dots. More coverage gives a denser rainbow band and less matte base between the dots. |
| `sparkle.irregularity` | 0 to 1 | `0.8` |  | How uneven the dots are in outline and size. 0 gives equal round dots; 1 gives blobs of mixed sizes that merge into clusters. |
| `sparkle.tilt` | 0 to 5 | `0.3` | ° | Random tilt of each dot. Larger values make neighbouring dots differ more in colour and brightness, and make the edge of the band shimmer more. |
| `sparkle.dome` | 0.05 to 2 | `0.3` | ° | Slight curvature of each dot. Larger values give each dot a softer highlight that stays lit over more tilt. |
| `sparkle.orientJitter` | 0 to 15 | `2` | ° | Random error of each dot's groove direction. Larger values make dots enter and leave the band at different poses, so its edge looks more ragged. |

### Grating

The relief shared by the dots. It works as in Prism Rainbow.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.pitch` | 500 to 2000 | `1000` | nm | Groove spacing of the dots (and of the haze). A larger pitch moves the rainbow closer to the mirror reflection of the light and makes the colours change faster with tilt. |
| `sparkle.grooveAngle` | 0 to 180 | `120` | ° | Direction of the grooves on the surface, counter-clockwise from the surface's x axis (the width of a card; the U direction of a mesh's mapping). The colour bands run along it. |
| `sparkle.depth` | 0 to 200 | `55` | nm | Depth of the grooves in the dots. Deeper grooves give brighter colours; the colours are strongest near 100 nm. 0 turns the dots into plain mirrors. |
| `sparkle.fan` | 0 to 30 | `12` | ° | How far the dots' light spreads along the grooves. Larger values make the band broader, so more of the surface is lit, at lower brightness. |
| `sparkle.pitchJitter` | 0 to 5 | `1.5` | % | Random error of each dot's pitch. Larger values give more colour variation between neighbouring dots. |

### Specks

A minority of the dots are specks: by default dark blue satin points that do not diffract.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.speckShare` | 0 to 30 | `9` | % | Share of the dots that are specks. 0 removes them. |
| `sparkle.speckType` | `dyed`, `grating` | `"dyed"` |  | `dyed`: blue-dyed satin dots that do not diffract; they are lit whenever the base is, in one constant hue. `grating`: dots with a fine grating in a random direction; they blink on and off as the object moves. |
| `sparkle.speckDyePeak` | 420 to 520 | `460` | nm | Colour of the `dyed` specks, as the wavelength their dye passes best. 460 is blue; higher values move toward cyan and green. |
| `sparkle.speckDyeWidth` | 10 to 60 | `25` | nm | Width of the band of colours the speck dye passes. Narrow gives a pure, dark speck; wide a paler one. |
| `sparkle.speckDyeFloor` | 0 to 1 | `0.3` |  | How much of the other colours the speck dye lets through. Higher values make the specks paler and closer to the base. |
| `sparkle.speckPitch` | 400 to 2000 | `700` | nm | Groove spacing of the `grating` specks. Finer pitches flash bluer. No effect on `dyed` specks. |
| `sparkle.speckSize` | 0.3 to 1 | `0.9` |  | Diameter of a speck as a share of the dot diameter. |

### Base

The matte metal between the dots: a sand-textured satin surface, optionally with a faint rainbow haze.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.matte` | 1 to 20 | `8` | ° | Roughness of the matte base. Higher values give a broader, more even satin sheen; lower values a shinier base with a more defined highlight. |
| `sparkle.sandSize` | 0.15 to 1 | `0.5` |  | Size of the base's sand grains as a share of the dot diameter. It sets how coarse the grainy mottle of the base is. |
| `sparkle.sandTilt` | 0 to 8 | `5` | ° | Tilt of each sand grain. Larger values make the grain more visible. It cannot exceed `sparkle.matte`. |
| `sparkle.hazeShare` | 0 to 1 | `0` |  | Share of the base that carries a shallow copy of the dots' grating. Above 0 the base itself takes a faint pastel tint of the band. |
| `sparkle.hazeDepth` | 0 to 200 | `60` | nm | Groove depth of the haze. Deeper gives a stronger tint. |
| `sparkle.hazeRoughness` | 0.05 to 6 | `1.5` | ° | Micro-roughness of the haze patches. Larger values blur the haze colours. |
| `sparkle.hazeFan` | 0 to 20 | `10` | ° | How far the haze's light spreads along the grooves. |

### Lacquer and tint

The dyed lacquer over the whole foil.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.nc` | 1.4 to 1.7 | `1.5` |  | Refractive index of the lacquer over the relief. A fine adjustment: a higher index acts like slightly deeper grooves. |
| `sparkle.tint` | `clear`, `longpass`, `shortpass` | `"shortpass"` |  | Dye in the lacquer. `clear`: silver film that shows every colour. `longpass`: a yellow dye that dims blue and violet, which turns the metal gold. `shortpass`: a blue dye that dims yellow and red. |
| `sparkle.tintEdge` | 400 to 700 | `600` | nm | Wavelength where the dye starts to block. `longpass` blocks the colours below it, `shortpass` the colours above it. No effect with `clear`. |
| `sparkle.tintWidth` | 5 to 150 | `90` | nm | How gradual the dye's edge is. Small values cut the colours off sharply; large values fade them out gently across the spectrum. |
| `sparkle.tintFloor` | 0 to 1 | `0.5` |  | How much of the blocked colours still gets through. 0 blocks them fully (the strongest tint); 1 removes the tint. |

### Surface

The clear coat on top and the flatness of the sheet.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the sheet over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `sparkle.coatAlpha` | 0.01 to 0.5 | `0.05` | GGX α | Roughness of the clear top coat. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `sparkle.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the clear top coat over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `sparkle.seed` | 1 to 999 | `5` |  | Another field of dots, specks and sand grains. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Silver sparkle film.** No dye and no specks: a silver matte base with a full rainbow of dots.

```json
{
  "sparkle.tint": "clear",
  "sparkle.speckShare": 0
}
```

**Champagne sparkle.** A soft yellow dye turns the base warm and mutes the blue end of the band.

```json
{
  "sparkle.tint": "longpass",
  "sparkle.tintEdge": 540,
  "sparkle.tintWidth": 90,
  "sparkle.tintFloor": 0.5,
  "sparkle.speckShare": 0
}
```

**Fine dense glitter.** Small, irregular dots that cover most of the surface.

```json
{
  "sparkle.size": 200,
  "sparkle.coverage": 0.7,
  "sparkle.irregularity": 1
}
```

**Confetti dots.** Large, rounder dots that each go their own way a little more.

```json
{
  "sparkle.size": 1200,
  "sparkle.coverage": 0.5,
  "sparkle.irregularity": 0.3,
  "sparkle.tilt": 1.5,
  "sparkle.orientJitter": 8
}
```

**Twinkling specks.** A quarter of the dots become fine gratings in random directions that blink as the object moves.

```json
{
  "sparkle.speckType": "grating",
  "sparkle.speckShare": 25,
  "sparkle.speckPitch": 700
}
```

## What holo.spot ships

holo.spot's card uses this material at the defaults above. Its 3D object, cloth, stickers and flag use smaller dots at the highest coverage. Because `holo.apply` starts from the look `object`, that denser version is what you get on a mesh when you pass no settings.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-sparkle.json`, `presets/object-sparkle.json`, `presets/cloth-sparkle.json`, `presets/stickers-sparkle.json`, `presets/flag-sparkle.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card` | `card-sparkle.json` | none: the defaults of the tables above |
| `object`, `cloth`, `stickers`, `flag` | `object-sparkle.json`, `cloth-sparkle.json`, `stickers-sparkle.json`, `flag-sparkle.json` | `sparkle.size` 215, `sparkle.coverage` 0.8 |
