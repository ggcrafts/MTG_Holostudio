# MTG HoloStudio

Holographic foil card studio. To render card animations, use the `holostudio` skill
(`.claude/skills/holostudio/SKILL.md`) or the `holostudio-animator` agent (`.claude/agents/`).
The entry point for automation is `node render.mjs` (see the header of that file).

- Zero dependencies: Node 20+, ffmpeg for clips, a Chromium browser for headless renders.
- `holofoil/app.js` is the Studio; `window.holostudio` and the URL parameters are its automation API.
- Interface strings are Portuguese in the code and translated by `holofoil/i18n.js`; add the English
  string there when you add a new one.
- Never edit `vendor/`.
