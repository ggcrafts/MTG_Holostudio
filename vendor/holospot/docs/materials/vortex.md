# Gilded Vortex (`vortex`)

Gilded Vortex imitates spiral "kinetic" foil, as on gold-swirl one-of-one trading cards and vortex films: one grating written as a many-armed spiral, under a pale gold lacquer. Each light draws a pair of curved rainbow arms through the centre, an S shape, graded from violet near the middle to red toward the rim. Tilting the object makes the arms rotate around a calm pale-gold "eye" in the centre, about three degrees of rotation per degree of tilt at the defaults, which reads as movement inside the foil. Fine spiral stripes show in the mirror reflection and make the arms look dashed.

**When to use it.** Use it when the foil itself should seem to move: a centrepiece with one clear focal point. The spiral has a single centre (`vortex.centre`), so it works best on a face where that centre is in view.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "vortex", sizeMm: 120, settings: { "vortex.swirl": 25, "vortex.bands": 36 } });
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

obj.set({ "vortex.handedness": "cw" });             // change a value later
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

Gilded Vortex has 18 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Spiral

The grating. Far from the centre its grooves are circles around it; toward the centre they turn into rays, and their spacing gets finer.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `vortex.pitch` | 600 to 2000 | `1250` | nm | Groove spacing far from the centre. It sets the colours of the outer arms: a larger pitch shows redder colours at the same angle and brings a second, repeated rainbow onto the outer arms. |
| `vortex.swirl` | 0 to 60 | `15` | mm | Radius at which the grooves run at 45 degrees. Inside it the grooves turn toward rays and the arms curl; the colourless eye in the middle grows with it. 0 gives plain circles, like a CD, with straight wedges and no eye. |
| `vortex.handedness` | `ccw`, `cw` | `"ccw"` |  | Direction the spiral winds: counter-clockwise or clockwise. It mirrors the curl of the arms. |
| `vortex.centre` | `x`, `y`: -1 to 1 | `{ "x": 0, "y": 0 }` |  | Position of the spiral's centre on the surface. (0, 0) is the middle; 1 and -1 are the edges of the surface (x to the right, y up). |
| `vortex.depth` | 0 to 200 | `45` | nm | Depth of the grooves. Deeper grooves give brighter arms and a darker, warmer mirror; the colours are strongest near 100 nm. 0 leaves a plain gold mirror. |
| `vortex.fan` | 0 to 10 | `1.5` | ° | How far the light spreads along the grooves, which is the width of the arms. Small values give thin, crisp arms; large values broad, soft ones. |

### Bands

Spiral stripes in which the grating covers less of the surface.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `vortex.bands` | 0 to 96 | `24` |  | Number of spiral stripes. They show as fine spiral lines in the mirror reflection and cut the arms into dashes. 0 removes them. |
| `vortex.contrast` | 0 to 1 | `0.45` |  | Strength of the stripes: how much less grating the weaker stripes carry. 0 hides them; 1 leaves them as plain mirror. |

### Metal and tint

The mirror under the grating and the dye in the lacquer over it.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `vortex.nc` | 1.4 to 1.7 | `1.5` |  | Refractive index of the lacquer over the grooves. A fine adjustment: a higher index acts like slightly deeper grooves. |
| `vortex.roughness` | 0.05 to 3 | `0.25` | ° | Micro-roughness of the metal. Larger values soften the arms and the mirror reflection of the lights. |
| `vortex.tint` | `clear`, `longpass`, `shortpass` | `"longpass"` |  | Dye in the lacquer. `clear`: silver foil that shows every colour. `longpass`: a yellow dye that dims blue and violet, which turns the metal gold. `shortpass`: a blue dye that dims yellow and red. |
| `vortex.tintEdge` | 400 to 700 | `500` | nm | Wavelength where the dye starts to block. `longpass` blocks the colours below it, `shortpass` the colours above it. No effect with `clear`. |
| `vortex.tintWidth` | 5 to 150 | `50` | nm | How gradual the dye's edge is. Small values cut the colours off sharply; large values fade them out gently across the spectrum. |
| `vortex.tintFloor` | 0 to 1 | `0.3` |  | How much of the blocked colours still gets through. 0 blocks them fully (the strongest tint); 1 removes the tint. |

### Surface

The clear coat on top and the flatness of the sheet.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `vortex.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the sheet over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `vortex.coatAlpha` | 0.01 to 0.5 | `0.045` | GGX α | Roughness of the clear top coat. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `vortex.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the clear top coat over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `vortex.seed` | 1 to 999 | `9` |  | Reshuffles the random waviness and coat ripple. The spiral itself does not change. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Silver vortex.** The same spiral without the dye: a silver mirror and arms in every colour.

```json
{
  "vortex.tint": "clear"
}
```

**Disc rings.** No swirl and no stripes: circular grooves at a CD's pitch, with straight wedges of colour.

```json
{
  "vortex.swirl": 0,
  "vortex.bands": 0,
  "vortex.pitch": 1600,
  "vortex.tint": "clear"
}
```

**Tight whirlpool.** A large swirl radius with thin arms and many strong stripes.

```json
{
  "vortex.swirl": 40,
  "vortex.fan": 0.8,
  "vortex.bands": 48,
  "vortex.contrast": 0.7
}
```

**Soft glow arms.** Broad, soft arms on a satin metal, without stripes.

```json
{
  "vortex.fan": 6,
  "vortex.roughness": 0.8,
  "vortex.bands": 0
}
```

**Off-centre copper.** The centre moved toward the lower right, wound clockwise, under a deeper orange dye.

```json
{
  "vortex.centre": { "x": 0.5, "y": -0.4 },
  "vortex.handedness": "cw",
  "vortex.tintEdge": 570,
  "vortex.tintWidth": 80,
  "vortex.tintFloor": 0.2
}
```

## What holo.spot ships

Every look of holo.spot uses this material at the defaults above. The looks differ only in their lights, exposure and camera.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-vortex.json`, `presets/object-vortex.json`, `presets/cloth-vortex.json`, `presets/stickers-vortex.json`, `presets/flag-vortex.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card`, `object`, `cloth`, `stickers`, `flag` | `card-vortex.json`, `object-vortex.json`, `cloth-vortex.json`, `stickers-vortex.json`, `flag-vortex.json` | none: the defaults of the tables above |
