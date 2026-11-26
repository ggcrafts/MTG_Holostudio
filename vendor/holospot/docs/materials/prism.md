# Prism Rainbow (`prism`)

Prism Rainbow imitates rainbow holographic laminate: an aluminium-coated film embossed with one fine diffraction grating under a clear gloss coat, as on traditional foil trading cards and rainbow laminating film. The whole surface is a single grating, so a small light paints one broad rainbow band across it. The band's colours run along the grooves and sweep through the whole spectrum as the object tilts, about 32 nm of wavelength per degree at the default pitch. Under a large soft light the foil turns to silvery satin with pastel fringes, and its plain mirror reflection is a champagne-tinted silver.

**When to use it.** Use it for a clean rainbow foil, a CD-like surface (`"prism.pattern": "concentric"`) or a sunburst (`"prism.pattern": "radial"`). It is also the material to learn the settings on: the other foils share its grating, tint and surface settings.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "prism", sizeMm: 120, settings: { "prism.pitch": 1200, "prism.fan": 10 } });
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

obj.set({ "prism.pattern": "radial" });             // change a value later
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

Prism Rainbow has 18 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Grating

The embossed relief that makes the colours.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `prism.pitch` | 500 to 2000 | `1000` | nm | Distance between two grooves (1000 nm is 1000 lines per mm). It sets which colour shows at a given angle. A larger pitch moves the rainbow closer to the mirror reflection of the light and makes the colours change faster with tilt; a smaller pitch needs steeper light and spreads the band wider. |
| `prism.grooveAngle` | 0 to 180 | `120` | ° | Direction of the grooves on the surface, counter-clockwise from the surface's x axis (the width of a card; the U direction of a mesh's mapping). The colour bands run along the grooves. Used by the `linear` pattern only. |
| `prism.pattern` | `linear`, `concentric`, `radial` | `"linear"` |  | Layout of the grooves. `linear`: straight parallel grooves, one straight rainbow band. `concentric`: circles around the centre of the surface, as on a CD: the rainbow becomes wedges through the centre that turn as the object tilts. `radial`: rays from the centre: the same wedges, a quarter turn round. |
| `prism.depth` | 0 to 200 | `50` | nm | Depth of the grooves. Deeper grooves send more light into the rainbow and less into the mirror reflection, which also turns warmer (silver at 50, brass above about 65). The rainbow is strongest near 100 nm. 0 leaves a plain mirror. |
| `prism.coverage` | 0 to 1 | `1` |  | Share of the surface that carries the grating; the rest is plain mirror. Lower values weaken the rainbow and strengthen the mirror. |
| `prism.fan` | 0 to 20 | `7` | ° | How far the rainbow light spreads along the grooves. Larger values make the band cover more of the surface and stay visible over more tilt, at lower brightness. 0 gives a thin, bright streak. |
| `prism.sigTheta` | 0 to 5 | `0.3` | ° | Small random error of the groove direction. Larger values soften the edges of the band. |
| `prism.sigPitch` | 0 to 3 | `0.5` | % | Small random error of the pitch. Larger values blend neighbouring colours, so the band is softer and less saturated. |

### Metal and tint

The mirror under the grating and the dye in the lacquer over it.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `prism.nc` | 1.4 to 1.7 | `1.5` |  | Refractive index of the lacquer over the grooves. A fine adjustment: a higher index acts like slightly deeper grooves. |
| `prism.roughness` | 0.05 to 3 | `0.2` | ° | Micro-roughness of the metal. Larger values widen and soften both the rainbow band and the mirror reflection of the lights. |
| `prism.tint` | `clear`, `longpass`, `shortpass` | `"clear"` |  | Dye in the lacquer. `clear`: silver foil that shows every colour. `longpass`: a yellow dye that dims blue and violet, which turns the metal gold. `shortpass`: a blue dye that dims yellow and red. |
| `prism.tintEdge` | 400 to 700 | `505` | nm | Wavelength where the dye starts to block. `longpass` blocks the colours below it, `shortpass` the colours above it. No effect with `clear`. |
| `prism.tintWidth` | 5 to 150 | `35` | nm | How gradual the dye's edge is. Small values cut the colours off sharply; large values fade them out gently across the spectrum. |
| `prism.tintFloor` | 0 to 1 | `0.06` |  | How much of the blocked colours still gets through. 0 blocks them fully (the strongest tint); 1 removes the tint. |

### Surface

The clear coat on top and the flatness of the sheet.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `prism.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the sheet over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `prism.coatAlpha` | 0.01 to 0.5 | `0.04` | GGX α | Roughness of the clear top coat. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `prism.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the clear top coat over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `prism.seed` | 1 to 999 | `1` |  | Reshuffles the random waviness and coat ripple. It does not change the grating. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Compact disc.** Circular grooves at a CD's track pitch, a thin sharp wedge of colour and a glassy coat.

```json
{
  "prism.pattern": "concentric",
  "prism.pitch": 1600,
  "prism.fan": 1.5,
  "prism.coatAlpha": 0.02,
  "prism.orangePeel": 0
}
```

**Gold rainbow foil.** The same rainbow under a yellow lacquer: gold mirror, warm colours, muted blues.

```json
{
  "prism.tint": "longpass",
  "prism.tintEdge": 500,
  "prism.tintWidth": 70,
  "prism.tintFloor": 0.25,
  "prism.depth": 80
}
```

**Soft pastel satin.** A wide, low-contrast band on a satin surface, for a quiet background foil.

```json
{
  "prism.fan": 16,
  "prism.roughness": 1.2,
  "prism.sigPitch": 2,
  "prism.coatAlpha": 0.15
}
```

**Sunburst.** Grooves like rays from the centre, a deep grating and no spread: crisp colour wedges that turn with the object.

```json
{
  "prism.pattern": "radial",
  "prism.pitch": 1200,
  "prism.depth": 110,
  "prism.fan": 0,
  "prism.sigTheta": 3
}
```

**Ice blue.** A blue dye in the lacquer: a cool mirror, with reds and yellows dimmed.

```json
{
  "prism.tint": "shortpass",
  "prism.tintEdge": 560,
  "prism.tintWidth": 60,
  "prism.tintFloor": 0.3
}
```

## What holo.spot ships

holo.spot does not ship the defaults above for this material. Its card, 3D object and cloth use a coarse concentric grating (a CD-like look), and its stickers and flag a radial one. Because `holo.apply` starts from the look `object` and `holo.card` from the look `card`, that concentric look is what you get when you pass no settings.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-prism.json`, `presets/object-prism.json`, `presets/cloth-prism.json`, `presets/stickers-prism.json`, `presets/flag-prism.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card`, `object` | `card-prism.json`, `object-prism.json` | `prism.pitch` 1765, `prism.pattern` "concentric", `prism.nc` 1.56, `prism.waviness` 0, `prism.coatAlpha` 0.01, `prism.orangePeel` 0, `prism.seed` 291 |
| `cloth` | `cloth-prism.json` | `prism.pitch` 1350, `prism.grooveAngle` 86, `prism.pattern` "concentric", `prism.depth` 177, `prism.fan` 15.7, `prism.sigTheta` 2.35, `prism.sigPitch` 2, `prism.nc` 1.56, `prism.waviness` 0, `prism.coatAlpha` 0.01, `prism.orangePeel` 0, `prism.seed` 291 |
| `stickers`, `flag` | `stickers-prism.json`, `flag-prism.json` | `prism.pitch` 1230, `prism.grooveAngle` 99, `prism.pattern` "radial", `prism.depth` 118, `prism.fan` 0, `prism.sigTheta` 3.4, `prism.sigPitch` 1.05, `prism.nc` 1.56, `prism.waviness` 0.14, `prism.coatAlpha` 0.13, `prism.orangePeel` 0, `prism.seed` 353 |
