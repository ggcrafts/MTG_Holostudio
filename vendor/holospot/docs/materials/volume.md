# Volume Hologram (`volume`)

Volume Hologram imitates the stickers that show a 3D object floating inside the film: reflection holograms (gallery stickers, security labels) and the embossed rainbow holograms on the processor and software labels of the 1990s. The surface works as a window. A recorded subject sits at depth behind it, parts of it may come forward, and it shows real parallax and hides its own far side as the object or the camera moves; what lies beyond the window's edge is cut off. A glossy film on top reflects the lights, and those reflections slide over the deep image.

**When to use it.** Use it for a security-hologram look, or for an image that seems to sit inside a surface, on a card or on any object. For a hologram patch on a paper card, use the Foil Emboss material instead (`docs/materials/emboss.md`).

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer, { background: "black" });
const card = holo.card({ material: "volume", settings: { "volume.subject": "wolf", "volume.depth": -12 } });
scene.add(card);
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

holo.get(card).set({ "volume.subject": "globe" });  // choose another subject later
```

## Where the values come from

Settings are a flat map of ids to values. A value you do not pass comes from the look you start from, and after that from the default in the tables below:

- `holo.apply(mesh, …)` starts from the look `object` (holo.spot's 3D object), `holo.card(…)` from the look `card` (its holographic card).
- A look ships its own lights, exposure and background, and for some materials its own material values. They are listed under "What holo.spot ships" below.
- Pass `look: "plain"` to start from the defaults in the tables exactly.
- An id that is not a setting of the scene or of this material is ignored, with a console warning.

Lengths are real. The object has a real-world size (`sizeMm`, its largest side in millimetres, default 90; a card has `widthMm` and `heightMm`, default 63 × 88), and every length below is measured on it. The same settings look coarser on a small object and finer on a large one.

Scene-level settings (lights `studio.*`, `display.*`, `grain.*`, bump map `bump.*`, depth of field `dof.*`, card finish `card.*`, background) are shared by all objects and are described in `docs/scene-settings.md`.

## The two types

`volume.type` chooses between two real kinds of hologram. They behave differently, so pick first.

| | `reflection` (default) | `rainbow` |
|---|---|---|
| Real example | Gallery and security stickers on a black backing | Silver stickers on processors and software boxes |
| Image colour | One colour (`volume.colour`, green by default). It shifts toward blue at steep angles | Runs through the spectrum with up-down tilt, about 28 nm per degree |
| Parallax | Left-right and up-down | Left-right only |
| Around the image | Dark film | Silver mirror |
| Needs | A light near `volume.reference`. Without one the image fades or goes dark | Any light whose diffracted light reaches the eye. Up-down tilt beyond a few degrees moves the image out of the visible colours |
| Under a soft, large light | Dim and blurred | Blurred, with the mirror dominating |

In both types the image is sharp at the surface and blurrier with depth, and a larger light blurs it more.

## Subjects

`volume.subject` names the recorded object. Seven are built in:

| Value | Subject |
|---|---|
| `eagle` | An eagle, the classic security-hologram motif (default) |
| `chip` | A 1990s microprocessor |
| `wolf` | A wolf, in three-quarter view |
| `globe` | A globe with latitude and longitude bands, a ring and a satellite |
| `skull` | A screaming skull, slightly turned |
| `falcon` | A falcon's head, slightly turned |
| `emblem` | A flat eagle-and-globe emblem, extruded from an SVG logo |

A subject is a baked signed-distance volume: a small 3D grid that stores, for every point, the distance to the object's surface. The built-in ones are the files `assets/holo3d/<name>.sdf`, loaded on demand from the kit's `assets/` folder.

`volume.subject` may also be a URL to a volume you baked yourself from a 3D model:

```
node tools/bake-hologram.mjs --in model.glb --out my.sdf
```

```js
holo.card({ material: "volume", settings: { "volume.subject": "./my.sdf" } });
```

See the header of `tools/bake-hologram.mjs` for its options (it can also turn an SVG logo into a subject). The value is taken as a URL when it starts with `http:`, `https:`, `data:`, `blob:`, `/`, `./` or `../`. A bare file name such as `my.sdf` is not a URL: it is read as an unknown subject name and the eagle is shown. Serve the file from where the page can fetch it.

The hologram is centred on the surface: on a card, the middle of the face; on a mesh, the middle of its mapped surface.

## Lights for a reflection hologram

A `reflection` hologram replays its image only for a light close to the direction it was made for, `volume.reference`. The default reference, x -0.25 and y -0.68 (below and slightly left of the view axis, about 46 degrees off it), is the default position of spot B of the light rig (`studio.spotB.dir`).

- The look `card` (the default of `holo.card`) keeps spot B near that direction, so a card shows the image as on holo.spot.
- The look `object` (the default of `holo.apply`) aims its three spots from grazing angles, as rim lights, and none is near the reference. On a mesh the image may then be dim. If it is, put a spot back at the reference, or start from the card's lights with `look: "card"`:

```js
holo.apply(mesh, { material: "volume", settings: { "studio.spotB.on": true, "studio.spotB.dir": { "x": -0.25, "y": -0.68 }, "studio.spotB.size": 2.5, "studio.spotB.distance": 1.2, "studio.spotB.radiance": 600 } });
```

You can also move the reference to a light you already have: set `volume.reference` to that light's `dir`. The reference is measured against the surface and the lights against the camera, so the two agree when the surface faces the camera. Other lights add displaced, differently coloured ghost images, as on a real hologram. The light directions are explained in `docs/scene-settings.md`.

## Parameters

Volume Hologram has 31 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Type and subject

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.type` | `reflection`, `rainbow` | `"reflection"` |  | The kind of hologram. `reflection`: a one-colour image on dark film, parallax in both directions, visible only with a light near `volume.reference`. `rainbow`: an image on a silver mirror, parallax left-right only, whose colour sweeps as the surface tilts up and down. |
| `volume.subject` | `eagle`, `chip`, `wolf`, `globe`, `skull`, `falcon`, `emblem`, or a URL | `"eagle"` |  | The recorded 3D object: one of the built-in names, or the URL of a volume you baked (see Subjects above). |

### Image

The recorded picture: the subject's size, place and pose, and what is behind it. Lengths are millimetres on the object at its real size (`sizeMm`).

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.size` | 10 to 80 | `44` | mm | Size of the subject, measured along its longest side. |
| `volume.depth` | -40 to 15 | `-8` | mm | How deep the subject's centre lies. Negative is behind the surface, positive in front of it. A deeper image moves more against the surface as the view changes, and is blurrier. |
| `volume.yaw` | -180 to 180 | `0` | ° | Turns the recorded subject to the left or right. |
| `volume.pitch` | -90 to 90 | `-10` | ° | Tips the recorded subject up or down. Positive brings its top toward the viewer. |
| `volume.recLight` | `x`, `y`: -1 to 1 | `{ "x": -0.5, "y": 0.5 }` |  | Direction of the light the subject was recorded under. It sets which side of the subject is bright and where its shadows fall. `x` is right, `y` is up, (0, 0) is straight on. |
| `volume.speckle` | 0 to 1 | `0.5` |  | Strength of the fine laser grain on the image, which shimmers as the view changes. 0 gives a clean image. |
| `volume.backdrop` | `none`, `grid`, `stars`, `seal`, `rosette`, `spiral`, `lattice`, `sunburst`, `sparkle` | `"grid"` |  | What lies behind the subject. `none`: nothing. `grid`, `stars`: a plane recorded deep behind the subject, in the hologram's own colour. `seal`, `rosette`, `spiral`, `lattice`, `sunburst`, `sparkle`: a line pattern just behind the surface that flashes rainbow colours (see Line pattern). |
| `volume.backdropDepth` | -80 to -5 | `-30` | mm | Depth of the `grid` or `stars` plane behind the surface. |

### Line pattern

Used when `volume.backdrop` is one of `seal`, `rosette`, `spiral`, `lattice`, `sunburst`, `sparkle`. These are fine line patterns just behind the surface, as on security labels. Each set of lines is its own grating, so it flashes its own rainbow colour at its own tilt, whatever the hologram's type.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.patternSize` | 5 to 80 | `28` | mm | Radius of the `seal`, or the scale of the other line patterns. The pattern is centred on the hologram. |
| `volume.lineWidth` | 0.05 to 0.6 | `0.22` |  | Width of the lines as a share of the gap between them. Thicker lines are brighter and coarser. |
| `volume.gratingPitch` | 600 to 1600 | `1000` | nm | Groove spacing inside the lines. A finer pitch needs light from a steeper angle before the colours show. |
| `volume.patternStrength` | 0 to 3 | `1` |  | Brightness of the line pattern. 0 hides it. |
| `volume.patternRotation` | -180 to 180 | `0` | ° | Turns the line pattern about the hologram's centre. |
| `volume.patternDepth` | -20 to 0 | `-3` | mm | Depth of the pattern's plane behind the surface. 0 puts it on the surface; a deeper plane shifts against the surface as the view changes. |

### Replay

How the image comes back under the lights: its colour, where the light has to be, and whether it moves smoothly or in steps.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.colour` | 450 to 650 | `545` | nm | Colour of the image as a wavelength: 545 is green, lower is bluer, higher is yellow to red. `reflection`: the colour seen with the light at the reference. `rainbow`: the colour seen straight on. |
| `volume.bandwidth` | 4 to 60 | `30` | nm | `reflection` only. Width of the band of colours the image replays. Narrow gives a pure colour; wide gives a brighter, paler image whose deep parts blur more. |
| `volume.reference` | `x`, `y`: -1 to 1 | `{ "x": -0.25, "y": -0.68 }` |  | Where the light must be, seen from the surface, for a bright, undistorted image. `x` is right, `y` is up, as for the light directions of the scene. Match it to one of the lights. |
| `volume.selectivity` | 2 to 40 | `16` | ° | `reflection` only. How far the light or the eye may move from the ideal geometry before the image fades. Larger values keep the image visible over more tilt. |
| `volume.slit` | 1 to 20 | `6` | ° | `rainbow` only. Width of the recording slit. Narrow gives purer colours and a smaller up-down viewing zone; wide gives paler colours over more tilt. |
| `volume.efficiency` | 0.05 to 1 | `0.85` |  | Brightness of the replayed image. |
| `volume.recording` | `optical`, `stereogram` | `"optical"` |  | `optical`: the image moves smoothly as the view changes. `stereogram`: the image was made from a fixed number of views and steps from one to the next, with a brief double image in between, as on many commercial stickers. Line patterns always move smoothly. |
| `volume.views` | 6 to 64 | `20` |  | `stereogram` only. Number of views across the viewing zone. Fewer views give larger, more visible steps. |
| `volume.viewBlend` | 0 to 1 | `0.25` |  | `stereogram` only. Length of the cross-fade between two views, as a share of the gap between them. 0 gives hard cuts; higher values a longer double image. |
| `volume.viewZone` | 5 to 60 | `30` | ° | `stereogram` only. Half-angle the views are spread over. Beyond it the last view stays. |

### Surface

The glossy film on top.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.waviness` | 0 to 1 | `0.3` | ° | Gentle unevenness of the film over 8 to 40 mm. Larger values make the colours and reflections wobble across the surface; 0 is perfectly flat. |
| `volume.coatAlpha` | 0.01 to 0.5 | `0.04` | GGX α | Roughness of the glossy top film. Low values give sharp, glassy reflections of the lights; high values give a satin sheen. |
| `volume.glare` | 0 to 1 | `1` |  | How strongly the surface itself mirrors the lights. 1 is the true mirror, which on a `rainbow` hologram can white out under a light. Lower values make the surface reflection weaker and softer, so the image and the pattern stay visible under the highlight. |
| `volume.orangePeel` | 0 to 2 | `0.6` | µm | Fine ripple of the glossy top film over 0.5 to 5 mm. It breaks up the glossy reflections a little; 0 is glass-smooth. |

### Seed

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `volume.seed` | 1 to 999 | `7` |  | Reshuffles the speckle and the surface ripple. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

**Silver security sticker.** The rainbow type on a silver mirror, with a guilloche seal behind the chip, stepped views and a tamed surface reflection.

```json
{
  "volume.type": "rainbow",
  "volume.subject": "chip",
  "volume.backdrop": "seal",
  "volume.recording": "stereogram",
  "volume.glare": 0.2
}
```

**Deep gallery hologram.** A reflection hologram with the wolf set well behind the surface, nothing behind it, in a purer green.

```json
{
  "volume.type": "reflection",
  "volume.subject": "wolf",
  "volume.depth": -15,
  "volume.backdrop": "none",
  "volume.bandwidth": 20
}
```

**Amber hologram.** A warmer replay colour with a wider band, for a gold-toned image.

```json
{
  "volume.colour": 590,
  "volume.bandwidth": 40
}
```

**Floating in front.** A smaller subject whose centre lies in front of the surface, against a deep star field.

```json
{
  "volume.size": 30,
  "volume.depth": 6,
  "volume.backdrop": "stars",
  "volume.backdropDepth": -40
}
```

**Stop-motion steps.** Few recorded views with a short cross-fade: the image visibly jumps as the object turns.

```json
{
  "volume.recording": "stereogram",
  "volume.views": 10,
  "volume.viewBlend": 0.15
}
```

## What holo.spot ships

Every look of holo.spot uses this material at the defaults above: the eagle, as a reflection hologram, over a grid. The looks differ in their lights, exposure and camera, and for a reflection hologram the lights matter (see "Lights for a reflection hologram").

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/card-volume.json`, `presets/object-volume.json`, `presets/cloth-volume.json`, `presets/stickers-volume.json`, `presets/flag-volume.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `card`, `object`, `cloth`, `stickers`, `flag` | `card-volume.json`, `object-volume.json`, `cloth-volume.json`, `stickers-volume.json`, `flag-volume.json` | none: the defaults of the tables above |
