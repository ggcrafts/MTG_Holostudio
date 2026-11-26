# Scene settings

Scene settings are shared by every holographic object that one `Holo` draws: the lights, exposure and tone curve, glare, grain, the bump map, depth of field, the card finish and the background. Their ids start with `studio.`, `display.`, `grain.`, `bump.`, `dof.`, `card.` or `scene.`. Material settings (`prism.*`, `nebula.*`, …) belong to one object and are described in `docs/materials/<material>.md`.

This page lists every scene setting the kit reads: 82 ids. Ids, ranges, options and defaults are taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`).

## How to set them

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const obj = holo.apply(mesh, { material: "prism", settings: { "studio.preset": "softbox", "display.ev": 0.3 } });
holo.setScene({ "grain.on": false, "bump.strength": 0.4 });   // at any time later
console.log(holo.scene["display.ev"]);                         // the current value of every scene id
renderer.setAnimationLoop(() => holo.render(scene, camera));
```

Scene ids may be passed in three places, always as a flat map of ids to values (or inside a Copy settings blob from holo.spot):

- in `new Holo(renderer, { settings })`;
- to `holo.setScene(settings)`, at any time;
- in the `settings` of `holo.apply` or `holo.card`, next to the material's own ids.

How they combine:

- **A look ships its own scene.** The first `holo.apply` or `holo.card` call brings the scene of the look it starts from: its lights, exposure, glare, grain, bump strength, background and depth of field. For example the look `object` (the default of `holo.apply`) turns depth of field on and raises the exposure to 0.8. The files in `presets/` show every look's values.
- **What you set on the `Holo` stays.** Values given to `new Holo` and to `holo.setScene` are remembered. They are kept whenever an object brings its look's scene.
- **A call's own settings win, for the ids it names.** Scene ids in the `settings` of an `apply` or `card` call go over the look and over what was remembered.
- **Later objects do not bring a scene.** A later `apply` or `card` call changes only the scene ids its `settings` name. Pass `scene: true` to make it bring its look's whole scene as the first object does, for example when it carries a preset or a Copy settings blob.
- `holo.setScene` changes only the ids you give. Everything else keeps its current value.

So for the first object the order is: the look's scene, then what you set on the `Holo`, then the call's own scene ids.

**The defaults in the tables below are the parameter defaults.** They are what `look: "plain"` gives.

An id that is not a setting is ignored, with a console warning.

## Two ways the frame is drawn

Some scene settings depend on how `holo.render` puts the frame together (the `compose` option of `new Holo`; chosen automatically by default):

- **`replace`**: the scene holds only holographic objects. The kit draws the whole frame, with its own background, glare, tone curve, grain and depth of field.
- **`over`**: the scene holds other things, has a background texture, or the canvas is transparent. Your renderer draws those, and the kit lays the holographic objects over them. In this mode the kit does not paint a background, and depth of field, Display P3 output and grain on the background are off.

## Lights

Each holographic object is lit by a studio rig centred on the object: one rectangular soft **panel**, up to three small round **spots** (A, B and C), and a dim **environment** (two rim strips, a top fill, a scrim above the camera, dark surroundings). Every light has a spectrum, which is where the colours come from. The three.js lights of your scene do not light holographic objects.

By default the rig travels with your camera (`new Holo(renderer, { lights: "camera" })`), so the object is lit the same way from wherever you look, and the colours move when the object turns. With `lights: "world"` the rig stands still in your scene, its front toward +z, so the colours also move when the camera orbits.

### Light directions

A direction (`studio.panel.dir`, `studio.spotA.dir`, …) is a pair `{ "x": …, "y": … }`: the sideways and upward parts of the unit vector that points from the object to the light. `x` is to the right and `y` is up, as the camera sees it (with `lights: "world"`, along your scene's x and y axes).

- `{ "x": 0, "y": 0 }` is a light at the camera, straight in front of the object.
- The length of (x, y) is the sine of the light's angle off the view axis: 0.5 is 30 degrees, 0.71 is 45 degrees, 0.87 is 60 degrees.
- A length of 1 or more is a light at a grazing angle (it is held at about 85 degrees), a rim light.

So `{ "x": -0.48, "y": 0.66 }`, the panel's default, is up and to the left, about 55 degrees off the axis.

### Panel

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `studio.panel.on` | `true`, `false` | `true` |  | Switches the panel on or off. |
| `studio.panel.dir` | `x`, `y`: -1 to 1 | `{ "x": -0.48, "y": 0.66 }` |  | Where the panel is (see "Light directions"). |
| `studio.panel.width` | 1 to 80 | `14` | ° | Size of the panel measured along the line that runs from the view axis out through the panel. |
| `studio.panel.length` | 1 to 90 | `50` | ° | Size of the panel at right angles to that line. A large panel gives soft, pastel colours and a satin sheen; a long narrow one gives a band that is saturated in one direction. |
| `studio.panel.radiance` | 0 to 50 | `4` |  | Brightness of the panel's surface. A panel is large, so it needs far less than a spot for the same light on the object. |
| `studio.panel.distance` | 0.3 to 3 | `0.9` | m | Distance of the panel from the object's centre. A nearer light strikes the two ends of the object from more different directions, so the colours vary more across the surface; a far light colours it more evenly. |
| `studio.panel.spd` | `equal`, `daylight`, `tungsten`, `led`, `triphosphor` | `"equal"` |  | The panel's spectrum (see "Light spectra"). |

### Spots

Three round lights with the same six settings each. Spot C is off by default.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `studio.spotA.on` | `true`, `false` | `true` |  | Switches spot A on or off. |
| `studio.spotA.dir` | `x`, `y`: -1 to 1 | `{ "x": -0.04, "y": -0.1 }` |  | Where spot A is (see "Light directions"). |
| `studio.spotA.size` | 0.2 to 10 | `1.5` | ° | Angular diameter of the spot as seen from the object. Small spots give saturated colours and sharp glints; larger ones softer, paler colours. |
| `studio.spotA.radiance` | 0 to 5000 | `1200` |  | Brightness of the spot's surface. The light on the object grows with the radiance and with the square of the size. |
| `studio.spotA.distance` | 0.3 to 3 | `1` | m | Distance of the spot from the object's centre. As for the panel, a nearer light makes the colours vary more across the surface. |
| `studio.spotA.spd` | `equal`, `daylight`, `tungsten`, `led`, `triphosphor` | `"equal"` |  | Spot A's spectrum (see "Light spectra"). |
| `studio.spotB.on` | `true`, `false` | `true` |  | Switches spot B on or off. |
| `studio.spotB.dir` | `x`, `y`: -1 to 1 | `{ "x": -0.25, "y": -0.68 }` |  | Where spot B is (see "Light directions"). |
| `studio.spotB.size` | 0.2 to 10 | `2.5` | ° | As `studio.spotA.size`. |
| `studio.spotB.radiance` | 0 to 5000 | `600` |  | As `studio.spotA.radiance`. |
| `studio.spotB.distance` | 0.3 to 3 | `1.2` | m | As `studio.spotA.distance`. |
| `studio.spotB.spd` | `equal`, `daylight`, `tungsten`, `led`, `triphosphor` | `"equal"` |  | Spot B's spectrum (see "Light spectra"). |
| `studio.spotC.on` | `true`, `false` | `false` |  | Switches spot C on or off. |
| `studio.spotC.dir` | `x`, `y`: -1 to 1 | `{ "x": 0.21, "y": -0.37 }` |  | Where spot C is (see "Light directions"). |
| `studio.spotC.size` | 0.2 to 10 | `1` | ° | As `studio.spotA.size`. |
| `studio.spotC.radiance` | 0 to 5000 | `1200` |  | As `studio.spotA.radiance`. |
| `studio.spotC.distance` | 0.3 to 3 | `1` | m | As `studio.spotA.distance`. |
| `studio.spotC.spd` | `equal`, `daylight`, `tungsten`, `led`, `triphosphor` | `"equal"` |  | Spot C's spectrum (see "Light spectra"). |

### Light spectra

`studio.panel.spd`, `studio.spotA.spd`, `studio.spotB.spd` and `studio.spotC.spd` choose each light's spectrum. The spectrum decides which colours a rainbow can contain, not just the tint of the light.

| Value | Spectrum | Effect on the foil |
|---|---|---|
| `equal` | Equal energy at every wavelength: neutral white | A full, even rainbow (default) |
| `daylight` | Daylight, 5600 K | A full rainbow, close to neutral |
| `tungsten` | Incandescent lamp, 3200 K | Warm; violet and blue are weak |
| `led` | White LED: a blue peak plus a broad yellow band | A dip between blue and green |
| `triphosphor` | Fluorescent tube: a few narrow lines | The rainbow splits into separate blue, green and orange-red lines with dark gaps |

### Environment

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `studio.ambient.rims` | 0 to 10 | `3` |  | Brightness of two long strips at grazing angles, one on each side. They draw rim highlights on tilted and curved surfaces. |
| `studio.ambient.fill` | 0 to 3 | `0.4` |  | Brightness of a large soft light from above. |
| `studio.ambient.scrim` | 0 to 2 | `0.4` |  | Brightness of a dim, graded reflector just above the camera. It gives unlit metal something to mirror, so foil reads as grey metal instead of black. |
| `studio.ambient.cameraSide` | 0 to 0.1 | `0.004` |  | Brightness of the rest of the surroundings on the camera's side. Low values keep the room dark, which is what gives the foil its contrast. |
| `studio.ambient.cameraTexture` | 0 to 1 | `1` |  | How blotchy those surroundings are. At 1 neighbouring shards and flakes mirror different greys; at 0 the surround is even. |
| `studio.ambient.backdrop` | 0 to 1 | `1` |  | Brightness of what lies behind the object when the background is light. It is seen only in reflections at grazing angles, and is scaled by the background's lightness. |
| `studio.ambient.rotation` | -180 to 180 | `0` | ° | Turns the environment (rims, fill, scrim, surroundings) about the view axis. |

### Lighting presets

`studio.preset` writes a whole setup in one value.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `studio.preset` | `studio`, `spot`, `softbox`, `strip`, `dark`, `desk`, `office`, `raking` | `"studio"` |  | Writes one of the ready-made lighting setups (see "Lighting presets"). |

| Preset | What it is | Panel | Spot A | Spot B | Spot C | rims / fill / scrim / cameraSide / cameraTexture |
|---|---|---|---|---|---|---|
| `studio` | The default rig: the soft panel and two small spots in a dark studio, with rims, fill and scrim. | on, dir (-0.48, 0.66), 14° × 50°, radiance 4, 0.9 m | on, dir (-0.04, -0.1), size 1.5°, radiance 1200, 1 m | on, dir (-0.25, -0.68), size 2.5°, radiance 600, 1.2 m | off | 3 / 0.4 / 0.4 / 0.004 / 1 |
| `spot` | One small hard spot in a black room. The most saturated colours and the strongest contrast. | off | on, dir (0.48, 0.28), size 1.5°, radiance 1200, 1 m | off | off | 0 / 0 / 0 / 0.002 / 0 |
| `softbox` | One large square soft light. Colours turn pastel and the foil shows a satin sheen. | on, dir (0.48, 0.28), 40° × 40°, radiance 3, 0.8 m | off | off | off | 0 / 0.1 / 0 / 0.004 / 1 |
| `strip` | One long, narrow strip light. Colours are saturated where the strip runs along the grooves and pale where it runs across them. | on, dir (0.48, 0.28), 6° × 60°, radiance 12, 0.9 m | off | off | off | 0 / 0.1 / 0 / 0.004 / 1 |
| `dark` | No panel and no spots: only the rims and the fill. A dark foil with faint colour. | off | off | off | off | 3 / 0.4 / 0 / 0.004 / 1 |
| `desk` | A daylight window as the panel and a warm desk lamp as spot A. | on, dir (-0.55, 0.35), 30° × 45°, radiance 3, 1.5 m, `daylight` | on, dir (0.45, 0.3), size 4°, radiance 300, 0.5 m, `tungsten` | off | off | 0 / 0.2 / 0 / 0.006 / 1 |
| `office` | A ceiling tube with a fluorescent spectrum. Rainbows split into separate blue, green and orange-red lines. | on, dir (0, 0.55), 4° × 70°, radiance 20, 1.6 m, `triphosphor` | off | off | off | 0 / 0.3 / 0 / 0.01 / 1 |
| `raking` | One spot from a low angle. It rakes across the surface and brings out relief, which suits the paper card. | off | on, dir (-0.83, 0.52), size 3°, radiance 1500, 1 m | off | off | 0 / 0.15 / 0.3 / 0.003 / 1 |

In the table, `dir` is the light's direction, sizes are in degrees, distances in metres, and a spectrum is named only when it is not `equal`.

How a preset is applied:

- It writes exactly the ids of its row, plus the `studio.preset` value itself. Every other scene value keeps its current value, for example `studio.ambient.rotation`, `studio.ambient.backdrop` and the size of a spot the preset turns off.
- Other ids given in the same map win over the preset, whatever their order in the map:

```js
holo.setScene({ "studio.preset": "softbox", "studio.panel.radiance": 5 });
```

- It works the same in `new Holo`, in `holo.setScene` and in the `settings` of `holo.apply` and `holo.card`. In the first `apply` call the preset goes over the look's lights.

## Display

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `display.ev` | -3 to 3 | `0.5` | stops | Exposure in stops: each +1 doubles the brightness. A light background lowers it a little by itself (0.2 stops on white). |
| `display.tone` | `neutral`, `agx`, `clamp` | `"neutral"` |  | Tone curve. `neutral` keeps hue and saturation in bright colours. `agx` is softer and desaturates highlights. `clamp` applies no curve; bright values clip. |
| `display.glare` | 0 to 0.1 | `0.03` |  | Amount of soft glow around very bright glints. 0 turns it off. |
| `display.glareRadius` | 2 to 32 | `8` | px | How far the glow reaches, in CSS pixels. |
| `display.wideGamut` | `true`, `false` | `true` |  | Uses the Display P3 colour space where the screen and the browser support it, for more saturated colours. Applies in `replace` mode only. |

Rendering quality is not a scene setting in the kit. Use the `quality` option: `new Holo(renderer, { quality: "low" | "medium" | "high" | "auto" })`. Without it the kit takes the quality holo.spot ships for the first look applied (`low` for the look `object`, `medium` for the others). `display.quality` is ignored.

## Grain

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `grain.on` | `true`, `false` | `true` |  | Film grain over the picture. Off removes it completely. |
| `grain.amount` | 0 to 0.6 | `0.18` |  | Strength of the grain. |
| `grain.size` | 1 to 4 | `1` | px | Size of a grain cell in CSS pixels. Above 1 the grain is coarser and softer. |
| `grain.animated` | `true`, `false` | `true` |  | A new grain pattern every frame, or one fixed pattern. |
| `grain.colour` | `mono`, `rgb` | `"mono"` |  | `mono`: grey grain. `rgb`: separate noise in each colour channel. |
| `grain.onBackground` | `true`, `false` | `false` |  | Also puts grain on the background. Off keeps the background an exact flat colour. Applies in `replace` mode only. |

## Bump map

A bump map is a grey-scale image whose brightness is height. It gives every material a fine surface texture: scratches, brushed metal, a weave. The default is the scratch map, inverted, at strength 0.78, so a surface has fine scratches unless you change it.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `bump.map` | `/bumps/scratches.jpg`, `/bumps/brushed.png`, `/bumps/hammered.png`, `/bumps/crinkle.png`, `/bumps/linen.png`, `/bumps/fingerprint.png`, `/bumps/sandblast.png`, or a URL | `"/bumps/scratches.jpg"` |  | A grey-scale height image pressed into the surface. A built-in map, the URL of your own image, or `""` (or `"none"`) for no map. |
| `bump.strength` | 0 to 3 | `0.78` |  | Height of the relief. 0 switches the map off. |
| `bump.tiling` | 1 to 12 | `3.5` |  | How many times the image repeats across a card's width, or across 100 mm of surface on any other object (at `structureScale` 1; a larger `structureScale` makes the tiles smaller). |
| `bump.layer` | `foil`, `varnish` | `"foil"` |  | `foil`: the foil itself is embossed, so the colours and mirror reflections bend with the texture. `varnish`: only the clear coat is textured, and the colours underneath stay smooth. |
| `bump.invert` | `true`, `false` | `true` |  | Reads dark as high instead of bright as high: ridges become grooves. |

The built-in maps are files in the kit's `assets/bumps/` folder. Name one by its short name or its path:

| Short name | Path | Texture |
|---|---|---|
| `scratches` | `/bumps/scratches.jpg` | Fine random scratches (default) |
| `brushed` | `/bumps/brushed.png` | Brushed metal |
| `hammered` | `/bumps/hammered.png` | Hammered dimples |
| `crinkle` | `/bumps/crinkle.png` | Crinkled foil |
| `linen` | `/bumps/linen.png` | Linen weave |
| `fingerprint` | `/bumps/fingerprint.png` | A fingerprint-like whorl of ridges |
| `sandblast` | `/bumps/sandblast.png` | Sandblasted grain |

```js
holo.setScene({ "bump.map": "brushed", "bump.strength": 1.2, "bump.tiling": 6, "bump.invert": false });
holo.setScene({ "bump.map": "" });            // no bump map
```

Any other value is used as the URL of your own image. On the paper card the map acts on the foil and on a sticker's film through `emboss.foilBump`, and on the paper only with `emboss.paperBump`.

## Depth of field

A thin-lens camera blur on the finished picture: what is off the focus plane blurs, and glints become bokeh discs in the shape of the aperture.

- It works in `replace` mode with a `THREE.PerspectiveCamera`. In `over` mode and with an orthographic camera it is off.
- The lens is your camera: its field of view sets the focal length of the blur, as on a 36 × 24 mm sensor (a vertical field of view of 22 degrees is a 62 mm lens).
- `dof.lens` is the focal length holo.spot's own camera has for the look. The kit does not move or change your camera, so by itself `dof.lens` changes nothing. `shotCamera(camera, obj, { aspect })` applies it: it sets your camera's field of view from the scene's `dof.lens` (or from the `lensMm` you pass) and places the camera for holo.spot's framing.
- "The object" is the first holographic object that was applied.
- The look `object` ships depth of field on. Pass `{ "dof.on": false }` for a picture that is sharp everywhere.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `dof.on` | `true`, `false` | `false` |  | Turns depth of field on. Parts of the object away from the focus blur, and bright glints become bokeh discs. |
| `dof.fstop` | `0.95`, `1`, `1.1`, `1.2`, `1.4`, `1.6`, `1.8`, `2`, `2.2`, `2.5`, `2.8`, `3.2`, `3.5`, `4`, `4.5`, `5`, `5.6`, `6.3`, `7.1`, `8`, `9`, `10`, `11`, `13`, `14`, `16`, `18`, `20`, `22` | `"2.8"` |  | Aperture as an f-number, written as a string. Lower numbers blur more. |
| `dof.focus` | `object`, `point`, `manual` | `"object"` |  | What the camera focuses on. `object`: the centre of the object. `point`: the point `dof.point` and `dof.pointZ` on the object. `manual`: the distance `dof.distance`. |
| `dof.point` | `x`, `y`: -1.5 to 1.5 | `{ "x": 0, "y": 0 }` |  | The focus point for `point`, across the object: `x` and `y` in half-sizes of the object, so 0 is its centre and -1 and 1 are its edges. |
| `dof.pointZ` | -1.5 to 1.5 | `0` |  | The focus point's depth, in units of the object's bounding radius. 0 is about the front face of a card. |
| `dof.distance` | 5 to 200 | `32` | cm | Focus distance from the camera for `manual`, at the object's real-world scale. |
| `dof.offset` | -50 to 50 | `0` | mm | Moves the focus plane behind (positive) or in front of (negative) the object or point. |
| `dof.lens` | 24 to 200 | `62` | mm | Focal length of holo.spot's camera for this look, on a 36 × 24 mm sensor (62 mm is a vertical field of view of 22 degrees). `shotCamera` reads it to set your camera's field of view, unless you pass `lensMm`. It does not change the camera by itself, and the blur always follows the field of view of the camera you render with. |
| `dof.blades` | `0`, `5`, `6`, `7`, `8`, `9`, `10`, `11` | `"9"` |  | Number of aperture blades, written as a string: the shape of the bokeh. `"0"` is a perfect circle. |
| `dof.bladeCurve` | 0 to 1 | `0.6` |  | Roundness of the blades. 0 is a straight-edged polygon, 1 a circle. |
| `dof.bladeAngle` | -90 to 90 | `0` | ° | Turns the bokeh polygon. |
| `dof.catsEye` | 0 to 1 | `0.3` |  | Squeezes the bokeh toward the frame edges into lemon shapes, as fast lenses do. |
| `dof.rim` | -1 to 1 | `0.15` |  | Edge of the bokeh discs. Positive: bright rims behind the focus and soft discs in front of it. Negative: the reverse. 0: even discs. |
| `dof.loca` | 0 to 1 | `0.2` |  | Colour fringes on the bokeh: magenta in front of the focus, green behind it. What is in focus stays neutral. |

## Card finish

These describe a card made with `holo.card`. `card.emboss`, `card.embossPitch`, `card.embossHeight`, `card.embossLayer` and `card.wear` also act on objects made with `holo.apply`.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `card.bow` | 0 to 2 | `1.6` | mm | Slight curl of a card, as its sag in millimetres. It bends the reflections and colour bands; the outline stays flat. Cards only. |
| `card.bowAxis` | `across`, `along` | `"across"` |  | Whether the card curls across its width or along its length. Cards only. |
| `card.corner` | 2.5 to 3.2 | `3.2` | mm | Corner radius of a card. Cards only. |
| `card.thickness` | 0.28 to 0.33 | `0.33` | mm | Thickness of a card, seen at its edge. Cards only; the paper card uses `emboss.thickness` instead. |
| `card.emboss` | `none`, `lines`, `crosshatch` | `"crosshatch"` |  | A fine pressed line texture over the foil: `none`, parallel `lines` or a `crosshatch`. |
| `card.embossPitch` | 0.15 to 2 | `1.17` | mm | Spacing of those lines. |
| `card.embossHeight` | 0 to 15 | `0.5` | µm | Height of the line texture. 0 removes it. |
| `card.embossLayer` | `foil`, `varnish` | `"varnish"` |  | `foil`: the foil carries the texture, so the colours follow it. `varnish`: only the clear coat does. |
| `card.border` | `ink`, `foil` | `"ink"` |  | With a print layout: the border of the card is opaque `ink`, or bare `foil`. |
| `card.borderColor` | `#rrggbb` | `"#ece9e2"` |  | Colour of the ink border. |
| `card.backColor` | `#rrggbb` | `"#22304a"` |  | Colour of a card's back. The paper card's back is paper. |
| `card.edgeSilver` | `true`, `false` | `true` |  | With a print layout: leaves a hairline of bare foil along the card's outline. |
| `card.wear` | 0 to 1 | `0.16` |  | Signs of handling: smudges that dull the gloss, fine scratches that arc around highlights, dust specks, slight unevenness of the foil and, with a print layout, whitened corners. 0 is a mint surface. |
| `scene.print` | `art`, `window`, `frame`, `none` | `"none"` |  | Cards in the six foil materials only. A printed layer over the foil. `none`: foil edge to edge. `frame`: a border, a title band and a text panel around bare foil. `window`: an opaque printed face with a foil picture window. `art`: a full printed card design with the foil showing through. |

The print layouts are drawn for the 63 × 88 mm card. Their text is the material's name, its line density and a caption.

## Background

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `scene.background` | `black`, `white`, `colour` | `"white"` |  | `black`, `white`, or `colour` (then `scene.bgColor`). The colour the kit paints behind the object in `replace` mode, and the lightness the lighting adapts to. |
| `scene.bgColor` | `#rrggbb` | `"#3a4458"` |  | The background colour used with `colour`. |

The kit decides the background in this order:

1. the `background` option, `new Holo(renderer, { background: "black" | "white" | "#rrggbb" })`;
2. the `background` of your three.js scene, when it is a `THREE.Color`;
3. `scene.background` and `scene.bgColor`.

The background does two things. In `replace` mode it is the colour painted behind the object. In both modes its lightness tells the lighting how bright the surroundings are, as a value from 0 (black) to 1 (white):

- the exposure drops by 0.2 stops times that value;
- the top fill (`studio.ambient.fill`) grows by up to half;
- the dark surroundings (`studio.ambient.cameraSide`) are raised to at least 0.03 times that value;
- what lies behind the object gets a brightness of 0.6 times that value times `studio.ambient.backdrop`.

So set the background to match the page the canvas sits on: `"black"` for a dark page, even in `over` mode.

## Size and mapping defaults

A Copy settings blob from holo.spot may carry three more ids. The kit reads them as the defaults of options of `holo.apply`; an option you pass wins. `structureScale` is the density of the foil's structure on a mesh: above 1 the shards, flakes and bump tiles are smaller on the object, below 1 they are larger.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `object.modelSize` | 20 to 400 | `90` | mm | The default of the `sizeMm` option of `holo.apply`: the real-world size of the object's largest side. |
| `object.modelMapping` | `auto`, `uv`, `box`, `sphere` | `"auto"` |  | The default of the `mapping` option: how the foil's pattern is laid on a mesh. `auto` uses the mesh's UVs when they are usable, else a box projection. |
| `object.structureScale` | 0.25 to 4 | `1` |  | The default of the `structureScale` option. Above 1 gives smaller shards, flakes and bump tiles on the object; below 1 gives larger ones. The object's own size does not change. |

## Settings the kit accepts and ignores

holo.spot's scene panel has 83 more ids. They may appear in a Copy settings blob or a preset. The kit accepts them without a warning and they change nothing:

- `scene.material`: the material comes from the `material` option, or from the blob.
- `scene.object`, `scene.orbit`, `scene.orbitGlide`, `scene.autoMotion`: which of holo.spot's objects is shown and how its view moves. In the kit you build the scene and move the camera.
- `scene.wall`, `scene.wallArt1` to `scene.wallArt4`, `scene.wallFill1` to `scene.wallFill4`, `scene.flagImage`, and every `object.*` id except the three above: holo.spot's own shapes, cloth, sticker wall and flag.
- `motion.*`: holo.spot's pointer tilt and idle wobble. In the kit you rotate the object yourself.
- `studio.flash.*`: holo.spot's pointer-held flashlight.
- `display.quality`: use the `quality` option of `new Holo`.
