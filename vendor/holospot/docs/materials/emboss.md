# Foil Emboss (`emboss`)

Foil Emboss is a paper card: heavy uncoated cotton stock carrying a logo that a hot brass die has stamped with holographic foil and pressed into relief in one hit (sculpted foil embossing). The logo stands a fraction of a millimetre above the paper with rounded shoulders. The foil follows that relief, so its rainbow bends and flares along every edge as the card tilts, while the paper shows fibres, tooth and soft shading at the walls. An element can also be a hologram sticker, a die-cut patch with a 3D image floating inside it, and one card carries up to six elements.

**When to use it.** Use it for business cards, invitations, certificates and labels: a small foil mark or a hologram patch on matte paper. It is made for cards, so create it with `holo.card({ material: "emboss" })`.

## Minimal code

```js
import * as THREE from "three";
import { Holo } from "holospot";                   // dist/holo.js

const holo = new Holo(renderer);
const card = holo.card({
  material: "emboss",
  look: "plain",                                    // start from the parameter defaults (see "Where a card starts")
  settings: { "emboss.logo": "/logos/koru.svg", "emboss.foil": "gold", "emboss.width": 28 },
});
scene.add(card);                                    // a THREE.Mesh, 63 × 88 mm unless widthMm / heightMm say otherwise
renderer.setAnimationLoop(() => holo.render(scene, camera));   // instead of renderer.render(scene, camera)

holo.get(card).set({ "emboss.foil": "rainbow" });   // change a value later
```

## Where the values come from

Settings are a flat map of ids to values. A value you do not pass comes from the look you start from, and after that from the default in the tables below:

- `holo.card({ material: "emboss" })` starts from the look `image` (holo.spot's paper card). That look ships two elements of its own; read "Where a card starts" below before passing element settings.
- A look ships its own lights, exposure and background, and for some materials its own material values. They are listed under "What holo.spot ships" below.
- Pass `look: "plain"` to start from the defaults in the tables exactly.
- An id that is not a setting of the scene or of this material is ignored, with a console warning.

Lengths are real. The card's face has a real size (`widthMm` and `heightMm`, default 63 × 88 mm), and every length below is measured on it.

Scene-level settings (lights `studio.*`, `display.*`, `grain.*`, bump map `bump.*`, depth of field `dof.*`, card finish `card.*`, background) are shared by all objects and are described in `docs/scene-settings.md`.

## The paper card

`holo.card({ material: "emboss" })` returns a card mesh: a paper front that carries the elements, a paper back that shows their impression in reverse, and a paper edge as thick as `emboss.thickness`. The face is 63 × 88 mm unless you pass `widthMm` and `heightMm`.

An element is one of two things:

- a **foil logo**: artwork (an SVG or PNG) stamped in holographic, silver or gold foil and embossed;
- a **hologram sticker**: a die-cut patch (square, rectangle, circle, oval or the outline of the artwork) with a 3D subject inside it, as in the Volume Hologram material.

Positions are millimetres on the face. `x` 31.5 and `y` 44 is always the centre of the face; `x` grows to the right and `y` upward. On the default 63 × 88 mm card that is the distance from the left edge and from the bottom edge.

There are two ways to say what is on the card:

1. **One element: the plain ids.** `emboss.element` chooses foil logo or hologram sticker, and `emboss.logo`, `emboss.x`, `emboss.width`, `emboss.height`, `emboss.foil`, `emboss.holo.*` and so on describe it. A flat settings map that gives any of these ids and no `emboss.doc` means "a card with this one element".
2. **Several elements: `emboss.doc`.** A JSON string that lists up to six elements, each with its own settings. A card drawn from a document takes its elements from the document only.

The paper itself (`emboss.paperColour`, `emboss.stock`, `emboss.tooth`, …), the printed picture, `emboss.exposure` and `emboss.seed` belong to the card and are always plain ids.

### Where a card starts

With no settings the card opens as holo.spot's own paper card, the look `image`:

- It carries two elements, described by an `emboss.doc` the look ships: a foil logo and a round hologram sticker (the emblem). In the kit the site's own logo artwork is replaced by the built-in rosette.
- Its paper is tuned for a printed picture: the paper texture is switched off (`emboss.textureStrength` 0) and the card is thin (`emboss.thickness` 0.3).

Pass `look: "plain"` to start from the parameter defaults instead: one rosette foil logo, 36 mm wide, in the middle of textured cotton paper, under the default lights. The code above and the starting points below do that.

### One element with the plain ids

Give the element's ids in a flat settings map. When the map names at least one single-element id and no `emboss.doc`, the kit empties `emboss.doc` itself, so the card shows exactly that one element, whatever document the look shipped. The same holds for `obj.set({ … })` on a card that is already there.

```js
// a gold foil logo, pressed into the paper instead of raised
holo.card({ material: "emboss", look: "plain", settings: { "emboss.logo": "/logos/leaf.svg", "emboss.foil": "gold", "emboss.profile": "deboss", "emboss.height": 300 } });

// a round hologram sticker with the globe inside
holo.card({ material: "emboss", look: "plain", settings: { "emboss.element": "hologram", "emboss.shape": "circle", "emboss.width": 30, "emboss.height": 250, "emboss.holo.subject": "globe" } });

// one logo on the default look: its smooth paper and its lights, your element in the middle
holo.card({ material: "emboss", settings: { "emboss.logo": "/logos/leaf.svg", "emboss.foil": "gold", "emboss.x": 31.5, "emboss.y": 44, "emboss.width": 30, "emboss.height": 300, "emboss.gloss": 0.8 } });
```

- The single-element ids are `emboss.element` and the ids of the tables "Element and placement" (except `emboss.edit`), "Relief", "Foil" and "Hologram sticker" below. The card's own ids (paper, print, `emboss.exposure`, `emboss.seed`) do not switch the card to one element.
- What the map leaves out comes from the look. With `look: "plain"` those are the defaults of the tables. The look `image` ships its own values for the single element: `emboss.logo` the rosette (in place of the site's own mark), `emboss.x` 25.6, `emboss.y` 54.8, `emboss.width` 40.8, `emboss.height` 15, `emboss.shoulder` 0.1, `emboss.profile` "bevel", `emboss.puff` 0.3, `emboss.foil` "concentric", `emboss.pitch` 1200, `emboss.grooveAngle` 149, `emboss.foilCoverage` 1, `emboss.edgeBreakup` 0.31, `emboss.showThrough` 0, `emboss.gloss` 0, `emboss.sparkleSize` 380, `emboss.foilBump` 0.29. Its logo is nearly flat and off-centre, so on that look give at least `emboss.x`, `emboss.y`, `emboss.width` and `emboss.height`, as the third example does.
- A Copy settings blob from holo.spot is taken as it is: its own `emboss.doc` decides.

`emboss.logo` takes one of the built-in marks (`/logos/rosette.svg`, `/logos/koru.svg`, `/logos/wordmark.svg`, `/logos/leaf.svg`, `/logos/facets.svg`, which the kit loads from its `assets/logos/` folder), or the URL or data URL of your own SVG or PNG. Transparent areas of the image carry no foil. An image without transparency is read by its contrast against its border.

### Several elements: the `emboss.doc` format

`emboss.doc` is a string that holds this JSON:

```json
{ "v": 1, "e": [ { "i": "e1", "t": "f", "n": "Logo", "p": { "x": 31.5, "width": 30 } } ] }
```

| Key | Value | Meaning |
|---|---|---|
| `v` | `1` | Version of the format. |
| `e` | array | The elements, from bottom to top: a later element is drawn over an earlier one. At most six; any beyond that are dropped. |
| `i` | string | The element's id: 1 to 12 letters or digits, different for every element (`e1`, `e2`, …). An invalid or repeated id is replaced by the next free `e<number>`. |
| `t` | `"f"` or `"h"` | `"f"`: a foil logo. `"h"`: a hologram sticker. Any other value counts as a foil logo. |
| `n` | string | A name for the element, up to 40 characters. It is a label only and does not change the picture. Optional. |
| `h` | `1` | Optional. `1` hides the element. Leave it out for a visible element. |
| `p` | object | The element's settings: ids from the tables below **without the `emboss.` prefix**, such as `x`, `width`, `foil` or `holo.subject`. Give only what should differ from the defaults. |

Rules:

- The ids allowed in `p` are the element's own: `logo`, `shape`, `aspect`, `cornerRadius`, `x`, `y`, `width`, `rotation`, `height`, `shoulder`, `profile`, `puff`, `foil`, `pitch`, `grooveAngle`, `foilCoverage`, `edgeBreakup`, `showThrough`, `gloss`, `sparkleSize`, `foilBump`, `filmUm`, `filmWall`, and every `holo.*` id (the `emboss.holo.*` ids of the tables). Not allowed there: `element` (the type is `t`), `edit`, and the card's ids (paper, print, exposure, seed, doc).
- What `p` leaves out takes the default of the tables below. A hologram sticker starts from the same defaults with two differences: `width` 30 and `height` 250.
- Unknown keys and values of the wrong type or outside a list of options are dropped, and the default stands. Numbers outside a range are clamped to it. Three ids have a wider range inside a document than in the tables: `x` 31.5 ± 375, `y` 44 ± 150 and `width` 3 to 750. An element that reaches beyond the face is cut off by the card's outline.
- Among the visible elements there can be at most four different logo images and four different hologram subjects.
- If the string is not JSON with an `e` array, the card falls back to the single element of the plain ids.
- An empty list, `{"v":1,"e":[]}`, is a card with no elements: plain paper.
- An element that names no `logo` gets the default mark, the rosette (`assets/logos/rosette.svg` in the kit). A foil logo is stamped in that shape; a sticker uses the artwork only for the shape `svg`. Name another built-in mark as `"logo": "/logos/koru.svg"`, or give the URL or data URL of your own image.
- A sticker's `holo.subject` is one of the seven built-in names: eagle, chip, wolf, globe, skull, falcon, emblem.

### Worked example: a foil logo and a hologram sticker

A gold koru logo in the upper half of the card, and a round sticker with the globe at the lower right.

```js
const doc = {
  v: 1,
  e: [
    { i: "e1", t: "f", n: "Logo", p: { logo: "/logos/koru.svg", x: 31.5, y: 58, width: 30, height: 350, foil: "gold" } },
    { i: "e2", t: "h", n: "Sticker", p: { shape: "circle", x: 44, y: 20, width: 22, "holo.subject": "globe" } },
  ],
};
const card = holo.card({ material: "emboss", settings: { "emboss.doc": JSON.stringify(doc) } });
scene.add(card);
```

The value of `emboss.doc` is then this string:

```json
{"v":1,"e":[{"i":"e1","t":"f","n":"Logo","p":{"logo":"/logos/koru.svg","x":31.5,"y":58,"width":30,"height":350,"foil":"gold"}},{"i":"e2","t":"h","n":"Sticker","p":{"shape":"circle","x":44,"y":20,"width":22,"holo.subject":"globe"}}]}
```

Read it as follows. `e1` is a foil logo (`t` is `"f"`): the koru mark, centred at x 31.5 mm and y 58 mm, 30 mm wide, raised 350 µm, in plain gold foil. `e2` is a hologram sticker (`t` is `"h"`): a circle 22 mm across, centred at x 44 mm and y 20 mm, with the globe inside; it keeps the sticker defaults for everything else (raised 250 µm, the seal pattern behind the subject, stepped views). `e2` comes later in the list, so it would be drawn over `e1` where they overlap.

This example starts from the look `image`, so the paper is smooth and thin. For textured heavy paper, add `"emboss.stock": "cotton"` (it writes the cotton paper's values, its texture included) and `"emboss.thickness": 0.8` to the settings, or pass `look: "plain"`.

### Limits

- **One paper design per page.** All paper cards drawn by the same page share one design (the same elements, paper and artwork). If you create two paper cards with different settings, the one applied last wins for both. Cards and objects in the other materials are not affected.
- Where two elements overlap, the upper one wins inside its outline. Elements do not cast shadows on each other.
- With several foil logos, brightness is balanced for the pitch of the first grating foil; logos with another `pitch` come out slightly brighter or darker, with correct colours.
- Gold foil has its exact colour when every element on the card is gold foil. Next to other elements it uses a close stand-in colour.
- `emboss.edit` belongs to holo.spot's on-card editor and does nothing in the kit.

## Parameters

Foil Emboss has 71 parameters. Every id, range, option and default below is taken from the kit's parameter data (`src/data/params.json`, also in `schema/holo.schema.json`). A range is the smallest and largest value; an option is written exactly as shown, as a string.

### Element and placement

What the element is, its artwork or shape, and where it sits. With `emboss.doc` these are the keys of an element's `p` (without the prefix).

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.element` | `foil`, `hologram` | `"foil"` |  | What the single element is: a hot-stamped foil logo, or a hologram sticker. It belongs to the plain single-element form; in a document each element's `t` sets its type. |
| `emboss.logo` | `/logos/rosette.svg`, `/logos/koru.svg`, `/logos/wordmark.svg`, `/logos/leaf.svg`, `/logos/facets.svg`, or a URL | `"/logos/rosette.svg"` |  | The artwork. For a foil logo it is the stamped shape. For a sticker of shape `svg` it is the outline of the patch. A built-in mark, or the URL or data URL of an SVG or PNG; transparent areas carry nothing. |
| `emboss.shape` | `square`, `rect`, `rounded`, `circle`, `oval`, `svg` | `"square"` |  | Hologram sticker only: the outline of the patch. `square` (with rounded corners), `rect` (sharp rectangle), `rounded` (rounded rectangle), `circle`, `oval`, or `svg` (the outline of the artwork). |
| `emboss.aspect` | 0.25 to 4 | `1` |  | Hologram sticker only: width divided by height, for `rect`, `rounded` and `oval`. Other shapes ignore it. |
| `emboss.cornerRadius` | 0 to 15 | `2.5` | mm | Hologram sticker only: corner radius of `square` and `rounded`. |
| `emboss.x` | -12.5 to 75.5 | `31.5` | mm | Horizontal position of the element's centre. 31.5 is the middle of the face; on the 63 mm wide card it is the distance from the left edge. |
| `emboss.y` | 0 to 88 | `44` | mm | Vertical position of the element's centre. 44 is the middle of the face; on the 88 mm high card it is the distance from the bottom edge. |
| `emboss.width` | 3 to 63 | `36` | mm | Width of the element. The height follows from the artwork's or the shape's proportions. |
| `emboss.rotation` | -180 to 180 | `0` | ° | Turns the element counter-clockwise. |
| `emboss.edit` | `true`, `false` | `false` |  | holo.spot's on-card editor. No effect in the kit. |

### Relief

The height field the die presses into the paper. It works the same for a foil logo and a hologram sticker.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.height` | 0 to 1000 | `450` | µm | How far the element stands above the paper, or how deep it is pressed in with the `deboss` profile. Higher relief gives stronger shading and shadows at the walls. 0 is flat. |
| `emboss.shoulder` | 0.05 to 2 | `0.6` | mm | Width of the sloping wall between the paper and the top. Small values give steep, crisp walls; large values soft, pillowy edges. |
| `emboss.profile` | `round`, `bevel`, `dome`, `deboss` | `"round"` |  | Shape of the die. `round`: rounded shoulders. `bevel`: a straight chamfer. `dome`: a pillowed top, higher in the middle of wide areas. `deboss`: pressed into the paper instead of raised. |
| `emboss.puff` | 0 to 1 | `0.4` |  | Swell of the stretched paper around the element. Higher values raise a soft halo around the walls; 0 leaves the paper flat right up to the wall. |

### Foil

The hot-stamped foil of a foil logo. `emboss.showThrough` and `emboss.foilBump` also act on a hologram sticker's cover film.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.foil` | `rainbow`, `concentric`, `sparkle`, `silver`, `gold` | `"rainbow"` |  | The foil. `rainbow`: one straight grating, a rainbow that bends over the shoulders. `concentric`: rings around the logo's centre. `sparkle`: small cells, each with its own groove direction, like glitter. `silver`, `gold`: plain mirror foil without a rainbow. |
| `emboss.pitch` | 500 to 2000 | `1000` | nm | Groove spacing of the foil's grating. A larger pitch moves the colours closer to the mirror reflection of the light. No effect on `silver` and `gold`. |
| `emboss.grooveAngle` | 0 to 180 | `120` | ° | Direction of the grooves of the `rainbow` foil, counter-clockwise from the card's x axis. The colour bands run along it. |
| `emboss.foilCoverage` | 0 to 1 | `0.85` |  | How far the foil runs down the walls. 1 covers them to the foot; 0 leaves foil only on the top. |
| `emboss.edgeBreakup` | 0 to 1 | `0.35` |  | How ragged the foil's edge is, with tiny pinholes where the paper is roughest. 0 gives a perfectly clean edge. |
| `emboss.showThrough` | 0 to 1 | `0.25` |  | How much of the paper's texture shows through the foil, or through a sticker's film, as fine relief and haze. |
| `emboss.gloss` | 0 to 1 | `0.8` |  | Gloss of the foil's top coat. 1 is mirror-smooth; 0 is satin. |
| `emboss.sparkleSize` | 40 to 600 | `160` | µm | Cell size of the `sparkle` foil. Small cells give a fine glitter, large cells visible facets. |
| `emboss.foilBump` | 0 to 1 | `0.25` |  | Share of the scene's bump map (`bump.*`) that also acts on the foil and on a sticker's cover film. 0 keeps them smooth; 1 applies the full map. |

### Hologram sticker

Used when the element is a hologram sticker. These are the Volume Hologram's settings (`docs/materials/volume.md`) for the patch. Sizes and depths are percent of the sticker's shorter side, so the image scales with the sticker.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.holo.type` | `reflection`, `rainbow` | `"reflection"` |  | `reflection`: a one-colour image on dark film, parallax in both directions, visible with a light near `emboss.holo.reference`. `rainbow`: an image on a silver mirror, parallax left-right only, whose colour sweeps with up-down tilt. |
| `emboss.holo.subject` | `eagle`, `chip`, `wolf`, `globe`, `skull`, `falcon`, `emblem` | `"eagle"` |  | The recorded 3D object inside the sticker. One of the built-in names. |
| `emboss.holo.size` | 20 to 200 | `80` | % | Size of the subject, as a percentage of the sticker's shorter side. At 100 it spans the patch. |
| `emboss.holo.depth` | -150 to 50 | `-25` | % | How deep the subject's centre lies, as a percentage of the sticker's shorter side. Negative is behind the film, positive in front. A deeper image moves more with parallax and is blurrier. |
| `emboss.holo.yaw` | -180 to 180 | `0` | ° | Turns the recorded subject to the left or right. |
| `emboss.holo.pitch` | -90 to 90 | `-10` | ° | Tips the recorded subject up or down. Positive brings its top toward the viewer. |
| `emboss.holo.recLight` | `x`, `y`: -1 to 1 | `{ "x": -0.5, "y": 0.5 }` |  | Direction of the light the subject was recorded under: which side of it is bright. `x` is right, `y` is up, relative to the sticker. |
| `emboss.holo.speckle` | 0 to 1 | `0.5` |  | Strength of the fine laser grain on the image, which shimmers as the view changes. 0 gives a clean image. |
| `emboss.holo.backdrop` | `none`, `grid`, `stars`, `seal`, `rosette`, `spiral`, `lattice`, `sunburst`, `sparkle` | `"seal"` |  | What lies behind the subject. `none`: nothing. `grid`, `stars`: a plane recorded deep behind it, in the hologram's colour. `seal`, `rosette`, `spiral`, `lattice`, `sunburst`, `sparkle`: a fine line pattern just behind the film that flashes rainbow colours as the card tilts. |
| `emboss.holo.backdropDepth` | -300 to -15 | `-100` | % | Depth of the `grid` or `stars` plane, as a percentage of the sticker's shorter side. |
| `emboss.holo.patternSize` | 10 to 300 | `50` | % | Radius of the `seal`, or scale of the other line patterns, as a percentage of the sticker's shorter side. At 50 the seal spans the patch. |
| `emboss.holo.lineWidth` | 0.05 to 0.6 | `0.22` |  | Width of the pattern's lines as a share of the gap between them. Thicker lines are brighter and coarser. |
| `emboss.holo.gratingPitch` | 600 to 1600 | `1000` | nm | Groove spacing inside the pattern's lines. A finer pitch needs light from a steeper angle before the colours show. |
| `emboss.holo.patternStrength` | 0 to 3 | `1` |  | Brightness of the line pattern. 0 hides it. |
| `emboss.holo.patternRotation` | -180 to 180 | `0` | ° | Turns the line pattern about the sticker's centre. |
| `emboss.holo.patternDepth` | -60 to 0 | `-8` | % | Depth of the pattern's plane behind the film, as a percentage of the sticker's shorter side. 0 puts it on the film. |
| `emboss.holo.colour` | 450 to 650 | `545` | nm | Colour of the image as a wavelength: 545 is green, lower is bluer, higher is yellow to red. |
| `emboss.holo.bandwidth` | 4 to 60 | `30` | nm | `reflection` only. Width of the band of colours the image replays. Narrow gives a pure colour; wide a brighter, paler image. |
| `emboss.holo.reference` | `x`, `y`: -1 to 1 | `{ "x": -0.25, "y": -0.68 }` |  | Where the light must be, relative to the sticker, for a bright, undistorted image. `x` is right, `y` is up. It turns with the sticker when the sticker is rotated. |
| `emboss.holo.selectivity` | 2 to 40 | `16` | ° | `reflection` only. How far the light or the eye may move from the ideal geometry before the image fades. |
| `emboss.holo.slit` | 1 to 20 | `9` | ° | `rainbow` only. Width of the recording slit. Narrow gives purer colours and a smaller up-down viewing zone. |
| `emboss.holo.efficiency` | 0.05 to 1 | `0.85` |  | Brightness of the replayed image. |
| `emboss.holo.recording` | `optical`, `stereogram` | `"stereogram"` |  | `stereogram`: the image steps from one recorded view to the next as the card moves, with a brief double image in between, as on most commercial stickers. `optical`: it moves smoothly. |
| `emboss.holo.views` | 6 to 64 | `20` |  | `stereogram` only. Number of recorded views. Fewer views give larger, more visible steps. |
| `emboss.holo.viewBlend` | 0 to 1 | `0.5` |  | `stereogram` only. Length of the cross-fade between two views. 0 gives hard cuts; higher values a longer double image. |
| `emboss.holo.viewZone` | 5 to 60 | `30` | ° | `stereogram` only. Half-angle the views are spread over. Beyond it the last view stays. |
| `emboss.holo.coatAlpha` | 0.01 to 0.5 | `0.04` | GGX α | Roughness of the sticker's glossy cover film. Low values give sharp reflections of the lights; high values a satin film. |
| `emboss.holo.glare` | 0 to 1 | `0.15` |  | How strongly the sticker's surface mirrors the lights. Low values keep the image and the pattern visible under a highlight; 1 is the full mirror, which can white the patch out. |
| `emboss.filmUm` | 10 to 100 | `40` | µm | Thickness of the sticker's film. It is the small step at the die-cut edge that catches a thin bright line and casts a hairline shadow on the paper. |
| `emboss.filmWall` | 0 to 1 | `0` |  | How far the sticker's film runs down the walls of the relief. 0: the patch lies on the raised top and a paper shoulder frames it. 1: the film covers the walls to their foot. |

### Printed picture

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.print` | a URL, or `""` | `""` |  | A picture printed on the paper under the elements: the URL or data URL of an image. Empty for plain paper. See "A printed picture". |
| `emboss.printInk` | 0 to 1 | `1` |  | Strength of the printed ink. 1 shows the picture as it is; lower values fade it toward the paper's colour. |

### Paper

The card's stock. These belong to the card, not to an element.

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.paperColour` | `#rrggbb` | `"#f3f1ea"` |  | Colour of the paper. |
| `emboss.stock` | `cotton`, `felt`, `smooth`, `laid`, `linen`, `kraft` | `"cotton"` |  | The paper stock. It selects the stock's surface pattern and, given in `settings`, also writes that stock's nine paper values (see "Paper stocks"). |
| `emboss.textureStrength` | 0 to 2 | `1` |  | Overall strength of the paper's fine structure, in relief and in colour. 0 gives smooth, even paper. |
| `emboss.fibreAmount` | 0 to 1 | `0.55` |  | How many surface fibres the paper shows. |
| `emboss.fibreScale` | 0.5 to 2 | `1` |  | Length and thickness of the fibres. Above 1 they are longer and coarser. |
| `emboss.tooth` | 0 to 30 | `7` | µm | Roughness height of the paper surface. Higher values give a rougher, more open surface, most visible under low-angle light. |
| `emboss.formation` | 0 to 1 | `0.45` |  | Cloudy unevenness of the sheet, a few millimetres across, in brightness and translucency. |
| `emboss.roughness` | 0.2 to 1 | `0.75` |  | How matt the paper is. Higher values flatten the shading and widen the soft sheen. |
| `emboss.sheen` | 0 to 1 | `0.35` |  | Strength of the broad, soft highlight on the uncoated paper. |
| `emboss.translucency` | 0 to 1 | `0.35` |  | How much light spreads inside the paper. Higher values soften the shading and the small shadows of the texture. |
| `emboss.thickness` | 0.3 to 1.2 | `0.8` | mm | Thickness of the card. It shows at the edge. |
| `emboss.waviness` | 0 to 1 | `0.12` | ° | Gentle cockle of the sheet over 8 to 40 mm. 0 is perfectly flat paper. |
| `emboss.paperBump` | `true`, `false` | `false` |  | Applies the scene's bump map (`bump.*`) to the paper as well. The foil takes its share through `emboss.foilBump` either way. |

### Card

| Id | Range or options | Default | Unit | What it changes |
|---|---|---|---|---|
| `emboss.exposure` | -2 to 2 | `0.6` | stops | Extra exposure for this material only, on top of `display.ev`. The default brightens the card so that white paper reads as white; 0 exposes it like the foil materials. |
| `emboss.seed` | 1 to 999 | `7` |  | Another sheet of paper: different fibres, foil edge and sparkle cells, and another speckle in a sticker. |
| `emboss.doc` | text | `""` |  | The card's elements as a JSON string (see "Several elements"). Empty: the single element of the plain ids. The kit empties it for you when a flat settings map names a single-element id and no `emboss.doc`. |

## Starting points

These are starting points to tune, not verified renders: nobody has checked a picture of them. Every id and value is valid and in range. Pass a map as `settings` (or to `obj.set(…)` on an object that already has this material), look at the result, then adjust.

Each map describes one element with the plain ids, so the card shows that one element. The maps are written against the parameter defaults: use them as `holo.card({ material: "emboss", look: "plain", settings: … })`. On the default look `image` they also give one element, but what a map leaves out then comes from that look (see "Where a card starts"). For a card with several elements, start from the worked example above.

**Gold mark on cotton.** A small gold foil logo above the centre of a white cotton card, with crisp walls.

```json
{
  "emboss.logo": "/logos/koru.svg",
  "emboss.foil": "gold",
  "emboss.width": 24,
  "emboss.y": 58,
  "emboss.height": 350,
  "emboss.shoulder": 0.3
}
```

**Silver deboss.** The mark pressed into the paper in satin silver foil.

```json
{
  "emboss.logo": "/logos/wordmark.svg",
  "emboss.foil": "silver",
  "emboss.profile": "deboss",
  "emboss.height": 300,
  "emboss.gloss": 0.4
}
```

**Rainbow seal on kraft.** Brown kraft paper (the stock writes its own paper values) with the rosette in rainbow foil.

```json
{
  "emboss.stock": "kraft",
  "emboss.logo": "/logos/rosette.svg",
  "emboss.foil": "rainbow",
  "emboss.width": 30
}
```

**Sparkle foil pillow.** A domed logo in fine sparkle foil with a pronounced swell of the paper around it.

```json
{
  "emboss.logo": "/logos/facets.svg",
  "emboss.foil": "sparkle",
  "emboss.sparkleSize": 120,
  "emboss.profile": "dome",
  "emboss.height": 600,
  "emboss.puff": 0.7
}
```

**Hologram patch only.** A rounded rectangular sticker in the middle of the card, with the wolf inside and no pattern behind it.

```json
{
  "emboss.element": "hologram",
  "emboss.shape": "rounded",
  "emboss.aspect": 1.4,
  "emboss.cornerRadius": 3,
  "emboss.width": 36,
  "emboss.height": 250,
  "emboss.holo.subject": "wolf",
  "emboss.holo.backdrop": "none"
}
```

## What holo.spot ships

holo.spot ships this material on three looks. `image` is its paper card, and the default of `holo.card({ material: "emboss" })`. `cloth` and `flag` are scenes the kit does not have; their presets carry the paper, element and light values only. The site's own logo artwork is not in the kit: the presets use the built-in rosette in its place.

All three ship an `emboss.doc`, so their elements come from that document. The table lists the card's own values. The files also hold plain element values (`emboss.x`, `emboss.foil`, …); those are not drawn while the document is set, and they are what a single element starts from when your settings name one.

The files in `presets/` hold each shipped look in full: the material's values, the lights, exposure, grain, background and camera. For this material they are `presets/image-emboss.json`, `presets/cloth-emboss.json`, `presets/flag-emboss.json`. Pass one as `settings`, unchanged (see `presets/README.md`).

| Looks | Preset files | The material's values that differ from the defaults |
|---|---|---|
| `image` | `image-emboss.json` | `emboss.textureStrength` 0, `emboss.fibreScale` 1.32, `emboss.thickness` 0.3, `emboss.doc`: 2 elements (a foil logo, a hologram sticker) |
| `cloth` | `cloth-emboss.json` | `emboss.textureStrength` 0, `emboss.fibreScale` 1.32, `emboss.doc`: 2 elements (a foil logo, a hologram sticker) |
| `flag` | `flag-emboss.json` | `emboss.textureStrength` 0, `emboss.fibreAmount` 0.53, `emboss.fibreScale` 1.32, `emboss.waviness` 0.4, `emboss.doc`: 1 element (a foil logo) |

The document of `presets/image-emboss.json`, laid out for reading (in the file it is one string):

```json
{
  "v": 1,
  "e": [
    { "i": "e1", "t": "f", "n": "Logo 1", "p": {"logo": "/logos/rosette.svg", "x": 25.6, "y": 54.8, "width": 40.8, "height": 15, "shoulder": 0.1, "profile": "bevel", "puff": 0.3, "foil": "concentric", "pitch": 860, "grooveAngle": 110, "foilCoverage": 1, "edgeBreakup": 0.23, "showThrough": 0, "gloss": 0.69, "sparkleSize": 225, "foilBump": 0.29} },
    { "i": "e2", "t": "h", "n": "Sticker 1", "p": {"shape": "circle", "x": 46.4, "y": 18.1, "width": 24, "foilBump": 0.57, "holo.subject": "emblem", "holo.size": 78, "holo.depth": -0.5, "holo.yaw": -5, "holo.recLight": {"x": -0.23, "y": 0.69}, "holo.speckle": 0.3, "holo.backdropDepth": -155, "holo.colour": 547, "holo.views": 16} }
  ]
}
```

## Paper stocks

`emboss.stock` chooses the paper. Given in the `settings` of `holo.card` (or `holo.apply`), it does two things, as choosing a stock on holo.spot does: it selects the stock's surface pattern (plain fibres, felt marks, laid lines, a linen weave, kraft specks), and it writes the nine paper values of the table below. The order is: the look's values, then the stock's values, then the ids you give explicitly. So a paper id next to the stock wins over the stock.

| Stock | Paper | `paperColour` | `textureStrength` | `fibreAmount` | `fibreScale` | `tooth` | `formation` | `roughness` | `sheen` | `translucency` |
|---|---|---|---|---|---|---|---|---|---|---|
| `cotton` | Soft, bulky, fibrous white cotton, as used for letterpress (default) | `"#f3f1ea"` | `1` | `0.55` | `1` | `7` | `0.45` | `0.75` | `0.35` | `0.35` |
| `felt` | Felt-marked: soft elongated dimples | `"#f2efe7"` | `1.15` | `0.45` | `1` | `10` | `0.4` | `0.8` | `0.3` | `0.3` |
| `smooth` | Smooth uncoated paper | `"#f5f4f0"` | `0.7` | `0.3` | `0.8` | `3` | `0.3` | `0.55` | `0.5` | `0.25` |
| `laid` | Laid paper: fine parallel lines with wider chain lines | `"#efe9dc"` | `1` | `0.45` | `1.1` | `6` | `0.55` | `0.7` | `0.35` | `0.4` |
| `linen` | Linen-embossed: a woven thread pattern | `"#f5f3ee"` | `1` | `0.35` | `0.9` | `4.5` | `0.3` | `0.65` | `0.4` | `0.3` |
| `kraft` | Brown kraft with many fibres and specks | `"#b48c63"` | `1.2` | `0.85` | `1.4` | `8` | `0.6` | `0.8` | `0.25` | `0.15` |

The column names are ids without the `emboss.` prefix.

```js
holo.card({ material: "emboss", look: "plain", settings: { "emboss.stock": "kraft" } });                                   // kraft, with all its values
holo.card({ material: "emboss", look: "plain", settings: { "emboss.stock": "kraft", "emboss.paperColour": "#c9a67c" } });   // kraft in a lighter brown
```

`obj.set({ "emboss.stock": … })` on an existing card does the same: the stock's values first, then any other ids given in the same call.

## A printed picture

`emboss.print` prints a picture on the paper, under the elements: pass the URL or data URL of an image the page may load. The picture is stretched over the whole face, so give the card the picture's proportions (`widthMm`, `heightMm`). `emboss.printInk` fades the print toward the bare paper. `""` is no print.

```js
// a 3:2 picture on a card of the same proportions, with no elements on it
holo.card({ material: "emboss", widthMm: 88, heightMm: 59, settings: { "emboss.print": "./photo.jpg", "emboss.doc": '{"v":1,"e":[]}' } });
```

The look `image`, which this call starts from, is made for a printed picture: smooth, thin paper. Its own two elements are placed for a 63 × 88 mm face, so replace them (as here, with an empty list) or give your own document.
