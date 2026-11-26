# How it works

The holographic look is not a gradient or a texture. The kit computes what a real foil does to light, turns the result into colour through each light's spectrum, and finishes the frame like a photograph. You do not need this page to use the kit. It helps when you tune settings or wonder why something looks the way it does.

## A grating sorts light by wavelength

A holographic foil is a mirror embossed with grooves about a thousandth of a millimetre apart. Such a grating sends each wavelength in its own direction:

```
d · (sin θ_in + sin θ_out) = m · λ
```

`d` is the distance between grooves (the `pitch` settings). `θ_in` and `θ_out` are the angles of the light and of the eye from the surface normal, measured across the grooves; on opposite sides of the normal they cancel. `λ` is the wavelength that reaches the eye, which is the colour. `m` is the order: 0 is the plain mirror reflection, 1 the rainbow, 2 a fainter second rainbow further out.

So the colour at a point depends on where the light is, where the eye is and how the surface is turned. Tilt the object and every point changes colour. A larger pitch packs the colours closer to the mirror reflection. Only light that arrives roughly across the grooves reaches the eye in colour, so the direction of the grooves decides where colour appears.

The kit evaluates this for every pixel and every light. The depth of the grooves and the lacquer over them decide how the light is shared between rainbow and mirror. The materials differ only in how gratings are laid out: one grating over the whole surface (Prism Rainbow), a mosaic of shards (Gold Shatter), a great many tiny tilted flakes (Nebula Glitter), dots that share one grating (Sky Sparkle), one grating wound into a spiral (Gilded Vortex).

## Colour comes from each light's spectrum

A grating selects a narrow band of wavelengths out of whatever the light contains. The colour of a pixel is that band, weighted by the light's spectrum, the reflectance of the aluminium, the dye in the lacquer and the sensitivity of the eye. The kit builds tables of this sum in advance, for each material and each kind of light, and the shader looks the colour up. No wavelengths are sampled while rendering, so there is no colour noise.

This is why the kit's lights have a spectrum, and why the three.js lights of your scene cannot light these materials: an RGB light has no wavelengths to split. It is also why a fluorescent tube breaks a rainbow into separate lines, why a gold lacquer tints every reflection, and why a small light gives saturated colours while a large soft light gives pastels and a satin sheen.

## Glints are counted, not averaged

A glitter flake is often smaller than a pixel. It flashes only when its tilt lines up the light and the eye, so about one flake in a hundred is lit at a time, far brighter than its surroundings. When flakes are large on screen the kit evaluates each one. When many fall into one pixel it works out how many would be lit and adds the matching amount of light. The sparkle then neither crawls as noise nor averages out to grey, at any zoom. Scratches, the ripple of the clear coat and the tooth of paper are filtered in the same spirit: detail too small for a pixel widens a highlight instead of flickering.

## A volume hologram replays recorded light

A hologram stores how light left an object in every direction. For each light and each eye position, the hologram's own grating equation says which recorded direction is replayed. The kit follows that direction into a 3D model of the subject placed behind the surface and shades what it hits. That gives true parallax, lets the subject hide its own far side, and cuts the image off at the edge of the film like a view through a window. A reflection hologram must meet a second condition inside the film, which picks one colour and lets the image fade when no light is near the direction it was made for. A rainbow hologram ties colour to the up-down viewing angle instead.

## The frame, step by step

`holo.render(scene, camera)` finishes the frame as holo.spot does. Without these steps the materials look flat, because glints are far outside the range a screen can show.

1. **Object pass.** Each holographic object is drawn at its real size (which is why `sizeMm` matters), with the light rig centred on it, into a floating-point (HDR) target with multisample anti-aliasing. The mirror image of a small spot can be a thousand times brighter than white paper, and the target keeps that value.
2. **Depth of field**, when it is on. It blurs the HDR values, so a bright glint becomes a bright bokeh disc.
3. **Glare.** A small share of the light is spread into a soft glow around bright points. Nothing is thresholded and no energy is added.
4. **Tone curve and output.** Exposure, then a tone curve that keeps hues stable in bright colours, then the conversion to sRGB or Display P3. The background is composited after the curve, so a white page stays exactly white.
5. **Grain.** Film grain is added last, on the finished picture.

When your scene also holds ordinary objects, your renderer draws them as usual. The kit runs the same steps for the holographic objects only and lays the result over your picture, hidden where your objects are in front.

## What is simplified

The split of light between the orders uses a standard approximation for shallow gratings, good to roughly 20 percent. The dim studio environment is treated less exactly than the panel and the spots. Light is unpolarised. The object is lit by the kit's own lights: it does not reflect your scene and casts no shadows on it.
