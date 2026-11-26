# Gold Shatter (`shatter`)

Gold Shatter imitates "cracked ice" or "shattered glass" holofoil in its gold variant: a mosaic of angular shards, each embossed with its own grating at its own angle, on aluminium under a yellow-dyed lacquer. Under a small light roughly one shard in ten is lit at a time, in red, orange, amber and gold with a few muted teal ones. Tilting the object reshuffles which shards are lit, and near the mirror angle a whole patch of shards flashes gold. Fine crease lines run along part of the shard borders.

**When to use it.** Use it for a faceted, jewel-like foil: cracked ice, mosaic and crystal looks. Set `"shatter.tint": "clear"` for a silver version.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "shatter", sizeMm: 120, settings: { "shatter.size": 4 } });
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

obj.set({ "shatter.tint": "clear" });               // change a value later
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

Gold Shatter has 25 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Shards

The mosaic: how the surface is cut into pieces and how each piece is oriented.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.size` | 0.5 to 8 | `2.5` | mm | Mean size of a shard. Small values give a fine frost, large values big facets. |
| `shatter.jitter` | 0 to 1 | `0.9` |  | How irregular the mosaic is. 0 lays the cells out as a square grid; 1 is fully irregular. |
| `shatter.chords` | 0 to 3 | `1.8` |  | Mean number of straight cuts through each cell. More cuts give more slivers, T-shaped junctions and a wider mix of shard sizes; 0 leaves plain cells. |
| `shatter.orientK` | 0 to 24 | `0` |  | Number of groove directions the shards may take. 0 lets every shard have its own direction, so they light one by one. A small number makes shards that share a direction flash together in groups. |
| `shatter.tilt` | 0 to 6 | `1` | ° | Random tilt of each shard. Larger values spread the flashes, the gold mirror flash included, over a wider area and more poses. 0 makes all shards lie in one plane. |
| `shatter.fan` | 0 to 15 | `5` | ° | How far each shard's light spreads along its grooves. Larger values light more shards at once, each a little dimmer. |

### Grating

The relief inside each shard. Each shard takes one of the three pitches, in equal shares.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.pitchA` | 500 to 2000 | `1150` | nm | Groove spacing of the first third of the shards. A coarser pitch shows a redder colour at the same angle. |
| `shatter.pitchB` | 500 to 2000 | `1080` | nm | Groove spacing of the second third of the shards. |
| `shatter.pitchC` | 500 to 2000 | `870` | nm | Groove spacing of the last third of the shards. At the default it is the finest and gives the teal shards. |
| `shatter.depth` | 0 to 200 | `95` | nm | Depth of the grooves. Deeper grooves send more light into the colours and less into the mirror; the colours are strongest near 100 nm. 0 leaves plain mirror shards. |
| `shatter.coverage` | 0.2 to 1 | `0.7` |  | Mean share of a shard that carries the grating; the rest is flat dyed mirror. Lower values give weaker colours and a brighter gold mirror. |
| `shatter.chirp` | 0 to 5 | `0` | % | Change of pitch across a shard. Above 0 each shard shows a short colour gradient instead of one flat colour. |

### Creases

Raised or sunken lines along part of the borders between shards.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.ridgeH` | -0.4 to 0.4 | `0.3` | µm | Height of the creases along shard borders. They show as thin lines of shifted colour and small catch-lights. Negative values make grooves; 0 removes the creases. |
| `shatter.ridgeW` | 10 to 200 | `40` | µm | Half-width of a crease. Wider creases are softer and broader. |
| `shatter.creaseShare` | 0 to 100 | `50` | % | Share of the borders that carry a crease. |

### Metal and tint

The mirror under the gratings and the dye in the lacquer over them.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.nc` | 1.4 to 1.7 | `1.5` |  | Refractive index of the lacquer over the grooves. A fine adjustment: a higher index acts like slightly deeper grooves. |
| `shatter.roughness` | 0.05 to 3 | `0.45` | ° | Micro-roughness of the metal. Larger values soften each shard's flash and its mirror reflection. |
| `shatter.tint` | `clear`, `longpass`, `shortpass` | `"longpass"` |  | Dye in the lacquer. `clear`: silver foil that shows every colour. `longpass`: a yellow dye that dims blue and violet, which turns the metal gold. `shortpass`: a blue dye that dims yellow and red. |
| `shatter.tintEdge` | 400 to 700 | `500` | nm | Wavelength where the dye starts to block. `longpass` blocks the colours below it, `shortpass` the colours above it. No effect with `clear`. |
| `shatter.tintWidth` | 5 to 150 | `70` | nm | How gradual the dye's edge is. Small values cut the colours off sharply; large values fade them out gently across the spectrum. |
| `shatter.tintFloor` | 0 to 1 | `0.25` |  | How much of the blocked colours still gets through. 0 blocks them fully (the strongest tint); 1 removes the tint. |

### Surface

The clear coat on top and the flatness of the sheet.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the sheet over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `shatter.coatAlpha` | 0.01 to 0.5 | `0.05` | GGX α | Roughness of the clear top coat. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `shatter.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the clear top coat over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `shatter.seed` | 1 to 999 | `7` |  | Another mosaic: a different layout of shards with different directions, pitches and creases. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Silver cracked ice.** No dye: a silver mirror and shards in every colour of the spectrum.

```json
{
  "shatter.tint": "clear",
  "shatter.depth": 75
}
```

**Fine frost.** Small shards with more tilt and spread, so many tiny facets are lit at once.

```json
{
  "shatter.size": 0.8,
  "shatter.chords": 1,
  "shatter.tilt": 2.5,
  "shatter.fan": 8
}
```

**Large mirror facets.** Big shards that are mostly plain gold mirror, with a crease on every border.

```json
{
  "shatter.size": 6,
  "shatter.coverage": 0.3,
  "shatter.tilt": 3,
  "shatter.ridgeH": 0.4,
  "shatter.creaseShare": 100
}
```

**Stepped flashes.** Six groove directions only: shards light up in groups as the object turns.

```json
{
  "shatter.orientK": 6,
  "shatter.jitter": 0.6,
  "shatter.chords": 0.8
}
```

**Square tiles.** A regular grid of uncut cells: a tiled mosaic instead of broken glass.

```json
{
  "shatter.jitter": 0,
  "shatter.chords": 0,
  "shatter.size": 3,
  "shatter.creaseShare": 100
}
```

## What holo.spot ships

Every look of holo.spot uses this material at the defaults above. The looks differ only in their lights, exposure and camera.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-shatter.json`, `presets/object-shatter.json`, `presets/cloth-shatter.json`, `presets/stickers-shatter.json`, `presets/flag-shatter.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card`, `object`, `cloth`, `stickers`, `flag` | `card-shatter.json`, `object-shatter.json`, `cloth-shatter.json`, `stickers-shatter.json`, `flag-shatter.json` | none: the defaults of the tables above |
