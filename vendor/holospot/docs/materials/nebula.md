# Nebula Glitter (`nebula`)

Nebula Glitter imitates holographic glitter, as on "galaxy" and "cosmos" foils and glitter card stock: tiny metallised flakes (0.2 mm across by default), each a tilted mirror with its own grating, in a blue-dyed clear binder over a deep indigo ink, with sparse larger "star" dots on top. Under a small light about one flake in a hundred glints at a time, as pinpoints of cyan, azure, blue and green. The field reshuffles all the time as the object moves: a glint runs through its colours over roughly ten degrees of tilt one way, and blinks off within a degree or two the other way. Under a large soft light the glints merge into a pastel satin sheen.

**When to use it.** Use it for sparkle: glitter, galaxy and starfield looks. It is the material holo.spot's 3D object opens with.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "nebula", sizeMm: 120, settings: { "nebula.size": 260, "nebula.starDensity": 8 } });
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

obj.set({ "nebula.baseColor": "#101030" });         // change a value later
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

Nebula Glitter has 21 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Flakes

The glitter itself: size, shape, density and how the flakes lie.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.size` | 50 to 400 | `200` | µm | Size of a flake, measured across its flat sides. Small values give a fine shimmer, large values distinct chunky flakes. |
| `nebula.shape` | `hex`, `square`, `round` | `"hex"` |  | Outline of the flakes: hexagons, squares or discs. It shows when the flakes are large enough on screen to be seen one by one. |
| `nebula.layers` | 1 to 3 | `2` |  | Number of stacked flake layers. More layers cover more of the base ink (about 55, 81 and 91 percent for hexagons) and give a denser sparkle. |
| `nebula.tilt` | 0 to 20 | `4.6` | ° | How unevenly the flakes lie. Larger values scatter the glints over more of the surface and more poses, each flake flashing more rarely. Small values make the flakes flash together near the mirror angle, more like a foil. |
| `nebula.curv` | 0.05 to 3 | `0.4` | ° | Slight curvature of each flake. Larger values make a glint softer and keep it lit over more tilt; small values give sharp pinpoints that blink quickly. |
| `nebula.coverage` | 0 to 1 | `0.65` |  | Share of a flake that carries the grating; the rest is flat dyed mirror. Lower values give fewer coloured glints and more plain mirror glints. |

### Grating

The relief on each flake. Every flake takes its own pitch between the two limits.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.pitchMin` | 400 to 2000 | `665` | nm | Finest groove spacing among the flakes. Finer pitches show bluer colours at the same angle. If it is larger than `nebula.pitchMax` the two are swapped. |
| `nebula.pitchMax` | 400 to 2000 | `740` | nm | Coarsest groove spacing among the flakes. Coarser pitches show warmer colours. A wider gap between the two limits gives more colour variety from flake to flake. |
| `nebula.depth` | 0 to 200 | `100` | nm | Depth of the grooves on a flake. Deeper grooves send more light into the coloured glints and less into the mirror glints; the colours are strongest near 100 nm. |

### Stars

Larger round dots with circular grooves, scattered above the flakes. Each shows a short rainbow bar through its centre at almost any pose.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.starSize` | 150 to 1500 | `600` | µm | Mean diameter of a star dot. Each star is 0.6 to 1.4 times this size. |
| `nebula.starDensity` | 0 to 30 | `3` | % | How many stars there are, as the share of the star grid's cells that hold one. 0 removes the stars. |

### Base

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.baseColor` | `#rrggbb` | `"#0c0a24"` | colour | Colour of the ink under the flakes. It shows between the flakes and sets the overall body colour of the material. |

### Binder and tint

The clear layer the flakes sit in, and its dye.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.nc` | 1.4 to 1.7 | `1.5` |  | Refractive index of the binder around the flakes. A fine adjustment: a higher index acts like slightly deeper grooves and makes the flakes' tilt count for more. |
| `nebula.tint` | `clear`, `longpass`, `shortpass` | `"shortpass"` |  | Dye in the binder. `clear`: silver flakes that glint in every colour. `longpass`: a yellow dye that dims blue and violet, which turns the metal gold. `shortpass`: a blue dye that dims yellow and red. |
| `nebula.tintEdge` | 400 to 700 | `525` | nm | Wavelength where the dye starts to block. `longpass` blocks the colours below it, `shortpass` the colours above it. No effect with `clear`. |
| `nebula.tintWidth` | 5 to 150 | `30` | nm | How gradual the dye's edge is. Small values cut the colours off sharply; large values fade them out gently across the spectrum. |
| `nebula.tintFloor` | 0 to 1 | `0.15` |  | How much of the blocked colours still gets through. 0 blocks them fully (the strongest tint); 1 removes the tint. |

### Surface

The clear coat on top and the flatness of the sheet.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the sheet over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `nebula.coatAlpha` | 0.01 to 0.5 | `0.06` | GGX α | Roughness of the clear top coat. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `nebula.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the clear top coat over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `nebula.seed` | 1 to 999 | `3` |  | Another field of flakes and stars. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Silver holographic glitter.** No dye and coarser gratings: glints in every colour on a near-black base.

```json
{
  "nebula.tint": "clear",
  "nebula.baseColor": "#101014",
  "nebula.pitchMin": 800,
  "nebula.pitchMax": 1200
}
```

**Gold glitter.** A yellow dye over warm-pitched flakes on a dark brown base.

```json
{
  "nebula.tint": "longpass",
  "nebula.tintEdge": 500,
  "nebula.tintWidth": 70,
  "nebula.tintFloor": 0.25,
  "nebula.baseColor": "#2a1a05",
  "nebula.pitchMin": 900,
  "nebula.pitchMax": 1200
}
```

**Fine shimmer dust.** Very small flakes in three layers with a wide tilt spread and no stars: an even, fine sparkle.

```json
{
  "nebula.size": 60,
  "nebula.layers": 3,
  "nebula.tilt": 8,
  "nebula.starDensity": 0
}
```

**Chunky flakes.** Large square flakes in one layer, flat and nearly aligned, so they flash as distinct pieces.

```json
{
  "nebula.size": 400,
  "nebula.shape": "square",
  "nebula.layers": 1,
  "nebula.curv": 0.2,
  "nebula.tilt": 3
}
```

**Starfield.** Fewer coloured flakes on a darker base, and many large stars.

```json
{
  "nebula.starDensity": 12,
  "nebula.starSize": 900,
  "nebula.coverage": 0.4,
  "nebula.baseColor": "#05040f"
}
```

## What holo.spot ships

holo.spot's card uses this material at the defaults above. Its 3D object, cloth, stickers and flag use a retuned glitter: smaller round flakes, warmer and coarser gratings, the densest star setting, a violet base and a glassy coat. Because `holo.apply` starts from the look `object`, that retuned glitter is what you get on a mesh when you pass no settings; pass `look: "plain"` or `look: "card"` for the defaults.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-nebula.json`, `presets/object-nebula.json`, `presets/cloth-nebula.json`, `presets/stickers-nebula.json`, `presets/flag-nebula.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card` | `card-nebula.json` | none: the defaults of the tables above |
| `object`, `cloth`, `stickers`, `flag` | `object-nebula.json`, `cloth-nebula.json`, `stickers-nebula.json`, `flag-nebula.json` | `nebula.size` 140, `nebula.shape` "round", `nebula.tilt` 2.7, `nebula.curv` 0.05, `nebula.coverage` 0.57, `nebula.pitchMin` 1180, `nebula.pitchMax` 870, `nebula.depth` 146, `nebula.starDensity` 30, `nebula.baseColor` "#22155f", `nebula.nc` 1.65, `nebula.tintEdge` 516, `nebula.tintWidth` 150, `nebula.tintFloor` 0.07, `nebula.waviness` 0.57, `nebula.coatAlpha` 0.01, `nebula.orangePeel` 1.2 |
