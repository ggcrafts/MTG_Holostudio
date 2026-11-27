// ============================================================
//  MTG HOLOSTUDIO — gerador de cartas holofoil
//
//  Duas camadas, um quadro:
//   A) o holospot (motor do holo.spot, vendor/holospot) desenha a FOLHA holográfica da carta em 3D,
//      com difração espectral de verdade, girando diante das luzes;
//   B) este arquivo imprime a arte da carta por cima, como numa carta foil real: a tinta é um filtro
//      sobre o metal (folha × tinta), a base branca bloqueia a folha onde a máscara manda, e o verniz
//      devolve os reflexos fortes por cima da tinta.
//  Todo parâmetro do holospot (material, luzes, relevo, desgaste…) vira controle na direita.
// ============================================================
import * as THREE from "three";
import { Holo, MATERIAL_PARAMS, SCENE_PARAMS, resolveSettings } from "holospot";
import { toEnglish } from "./i18n.js";

const $ = (s) => document.querySelector(s);
const W_MM = 63, H_MM = 88;
const MATERIALS = { galaxy: "Galaxy (holográfico pela tonalidade)", surge: "Surge (holográfico em linhas)", prism: "Prism Rainbow (foil clássico)", shatter: "Gold Shatter (gelo rachado)", nebula: "Nebula Glitter (galáxia)", sparkle: "Sky Sparkle (pontilhado)", vortex: "Gilded Vortex (espirais)", volume: "Volume Hologram (imagem 3D)" };
const SIZES = { "1920x1080": "1920 × 1080" };              // exportação: só o padrão 1920 × 1080
/** Endereço (do mesmo servidor) para onde as tomadas voltam quando o Studio foi aberto por outra ferramenta */
const RETORNO = (() => { const r = new URLSearchParams(location.search).get("retorno"); return r && /^\/api\/[\w/-]+(\?[\w=&%.-]*)?$/.test(r) ? r : null; })();
// tamanhos que só a automação pede (o vídeo vertical dos shorts, por exemplo): não aparecem no menu
const AUTO_SIZES = { "1080x1920": "1080 × 1920", "1080x1080": "1080 × 1080", "1920x1080": "1920 × 1080" };
// o que o Studio sempre impõe à cena do holospot (a arte e o fundo são camada do Studio)
const STUDIO_SCENE = { "card.emboss": "none" };       // padrões do Studio para a cena (o look pode mudar)
const BASE_SCENE = { "scene.print": "none", "dof.on": false, "card.edgeSilver": false, "card.border": "foil", "scene.background": "black", "display.wideGamut": false };

// controles próprios do Studio (o resto vem do holospot)
const COMP = [
  { id: "comp.foil", name: "Intensidade do foil", min: 0, max: 2, step: 0.01, def: 1.15, why: "Quanto da luz da folha chega ao olho." },
  { id: "comp.ink", name: "Densidade da tinta", min: 0, max: 2, step: 0.01, def: 0.4, why: "0: folha pura, sem arte. 0,5: tinta fina de carta foil. 1 ou mais: tinta carregada, foil mais escuro e saturado." },
  { id: "comp.diffuse", name: "Luz difusa na arte", min: 0, max: 1, step: 0.01, def: 0.3, why: "Quanto a arte aparece onde a folha não está pegando luz." },
  { id: "comp.varnish", name: "Verniz (reflexo por cima)", min: 0, max: 1, step: 0.01, def: 0, why: "Os reflexos mais fortes passam por cima da tinta, como no verniz da carta." },
  { id: "comp.printLight", name: "Brilho da área sem foil", min: 0.4, max: 1.3, step: 0.01, def: 0.92, why: "Luz da parte impressa sobre base branca (sem folha)." },
  { id: "comp.under", name: "Base branca geral", min: 0, max: 1, step: 0.01, def: 0, why: "Tira o foil da carta inteira aos poucos (1 = carta comum)." },
];
const MASK = [
  { id: "mask.mode", name: "Onde vai o foil", options: { all: "Carta inteira", art: "Só a arte", frame: "Só a moldura", custom: "Máscara própria (PNG)" }, def: "all" },
  { id: "mask.invert", name: "Inverter máscara", toggle: true, def: false },
  { id: "mask.text", name: "Caixa de texto opaca", min: 0, max: 1, step: 0.01, def: 0.4, why: "Base branca sob o texto de regras, para ele continuar legível." },
  { id: "mask.soft", name: "Suavidade da borda", min: 0, max: 0.05, step: 0.001, def: 0.008 },
  { id: "mask.patSrc", name: "Padrão do foil", options: { "": "Nenhum (folha contínua)", "/holofoil/maps/galaxy.png": "Galaxy (confete)" }, def: "", why: "Um mapa em preto e branco do próprio foil: só há folha onde o mapa é branco (confete do Galaxy Foil, por exemplo)." },
  { id: "mask.pat", name: "Padrão: intensidade", min: 0, max: 1, step: 0.01, def: 1, why: "0 ignora o padrão; 1 deixa o foil só onde o padrão é branco." },
  { id: "mask.patBlack", name: "Padrão: ponto preto", min: 0, max: 1, step: 0.005, def: 0.08 },
  { id: "mask.patWhite", name: "Padrão: ponto branco", min: 0, max: 1, step: 0.005, def: 0.6 },
  { id: "mask.patInv", name: "Inverter o padrão", toggle: true, def: false },
  { id: "mask.patChannels", name: "Canais do padrão", options: { lum: "Luminosidade: máscara e tonalidade", rg: "R = máscara, G = tonalidade" }, def: "lum" },
  { id: "mask.luma", name: "Mapa de contraste da arte", min: 0, max: 1, step: 0.01, def: 1, why: "Quanto o preto e branco da arte decide o foil: branco deixa a folha aparecer, preto quase nada. 0 desliga o mapa." },
  { id: "mask.black", name: "Levels: ponto preto", min: 0, max: 1, step: 0.005, def: 0.12, why: "Tudo que for mais escuro que isto na arte fica sem foil." },
  { id: "mask.white", name: "Levels: ponto branco", min: 0, max: 1, step: 0.005, def: 0.8, why: "Tudo que for mais claro que isto na arte recebe foil cheio." },
  { id: "mask.gamma", name: "Levels: meios-tons (gama)", min: 0.2, max: 3, step: 0.01, def: 1, why: "Acima de 1 abre os meios-tons (mais foil); abaixo fecha (menos foil)." },
  { id: "mask.blur", name: "Suavizar o mapa", min: 0, max: 6, step: 0.1, def: 0.6, why: "Desfoca o mapa para o foil não seguir cada detalhe fino da arte." },
  { id: "mask.lumaInv", name: "Inverter o mapa", toggle: true, def: false },
  { id: "mask.show", name: "Ver o mapa (preto e branco)", toggle: true, def: false, why: "Mostra a máscara final: branco é onde o foil aparece." },
  { id: "mask.artL", name: "Arte: esquerda", min: 0, max: 1, step: 0.002, def: 0.078 },
  { id: "mask.artT", name: "Arte: topo", min: 0, max: 1, step: 0.002, def: 0.112 },
  { id: "mask.artR", name: "Arte: direita", min: 0, max: 1, step: 0.002, def: 0.922 },
  { id: "mask.artB", name: "Arte: base", min: 0, max: 1, step: 0.002, def: 0.556 },
  { id: "mask.boxL", name: "Texto: esquerda", min: 0, max: 1, step: 0.002, def: 0.078 },
  { id: "mask.boxT", name: "Texto: topo", min: 0, max: 1, step: 0.002, def: 0.628 },
  { id: "mask.boxR", name: "Texto: direita", min: 0, max: 1, step: 0.002, def: 0.922 },
  { id: "mask.boxB", name: "Texto: base", min: 0, max: 1, step: 0.002, def: 0.895 },
];
const VIEW = [
  { id: "view.zoom", name: "Zoom", min: 0.2, max: 5, step: 0.01, def: 1, why: "Roda do mouse sobre a carta. Arrastar move; duplo clique volta a 100%." },
  { id: "view.panX", name: "Deslocamento X", min: -2, max: 2, step: 0.001, def: 0 },
  { id: "view.panY", name: "Deslocamento Y", min: -2, max: 2, step: 0.001, def: 0 },
  { id: "view.fov", name: "Lente (campo de visão)", min: 8, max: 50, step: 1, def: 20 },
  { id: "view.bg", name: "Cor do fundo", color: true, def: "#0b0d12" },
  { id: "view.quality", name: "Qualidade do holospot", options: { low: "Baixa", medium: "Média", high: "Alta" }, def: "high", reinit: true },
  { id: "view.lights", name: "Luzes", options: { camera: "Acompanham a câmera", world: "Paradas no mundo" }, def: "camera", reinit: true },
];
// Material próprio do Studio: foil tradicional de Magic (a arte é a máscara, folha do holospot) + fundo de galáxia.
// Na galáxia a TONALIDADE do padrão faz duas coisas: (1) é a máscara, onde há folha; (2) é a própria rede de difração
// daquele ponto: do preto ao branco a ranhura gira e muda de passo, então um degradê de cinza vira um degradê de
// espectro (a luz se divide em R, G, B dentro de cada bolinha, como numa espiral holográfica). A difração é
// calculada no shader do Studio, por pixel, numa passada só.
const GALAXY = [
  { id: "galaxy.gain", name: "Holográfico: intensidade", min: 0, max: 6, step: 0.01, def: 3, why: "Força da luz difratada da galáxia." },
  { id: "galaxy.turns", name: "Giro pela tonalidade", min: 0, max: 6, step: 0.05, def: 1.5, why: "Quantas meias-voltas a ranhura gira do preto ao branco do padrão. Mais giro: mais faixas de cor dentro de cada degradê." },
  { id: "galaxy.pitchRange", name: "Divisão de cor pela tonalidade", min: 0, max: 1200, step: 10, def: 500, unit: "nm", why: "Quanto o passo da ranhura muda do preto ao branco. É o que separa vermelho, verde e azul ao longo de um degradê de cinza." },
  { id: "galaxy.pitch", name: "Passo médio da ranhura", min: 600, max: 2000, step: 10, def: 1200, unit: "nm", why: "Mais fino puxa para o azul, mais grosso para o vermelho, no mesmo ângulo." },
  { id: "galaxy.angle", name: "Ângulo base da ranhura", min: 0, max: 180, step: 1, def: 20, unit: "°", why: "Direção da ranhura no preto do padrão." },
  { id: "galaxy.fan", name: "Abertura do brilho", min: 0.03, max: 0.8, step: 0.01, def: 0.4, why: "Menor: cada ponto pisca num ângulo estreito. Maior: fica aceso por mais tempo, mais suave." },
  { id: "galaxy.mirror", name: "Reflexo prateado", min: 0, max: 1.5, step: 0.01, def: 0.25, why: "O clarão branco quando a folha reflete a luz direto." },
  { id: "galaxy.base", name: "Foil tradicional (pela arte)", min: 0, max: 1.5, step: 0.01, def: 0.8, why: "O foil comum de Magic por baixo da galáxia: um arco-íris contínuo que aparece onde a arte é clara (usa o mapa de contraste da aba Máscara)." },
  { id: "galaxy.baseAngle", name: "Foil tradicional: ângulo", min: 0, max: 180, step: 1, def: 115, unit: "°", why: "Direção das ranhuras do foil tradicional." },
  { id: "galaxy.stars", name: "Ruído estelar", min: 0, max: 1, step: 0.01, def: 0.6, why: "Estrelas procedurais somadas ao padrão, cada uma com a sua tonalidade (e portanto a sua cor e o seu ângulo)." },
  { id: "galaxy.starSize", name: "Ruído estelar: tamanho", min: 0.3, max: 3, step: 0.01, def: 1, why: "Escala das estrelas (1 = estrelas de até uns 0,9 mm)." },
  { id: "galaxy.starDensity", name: "Ruído estelar: densidade", min: 0, max: 1, step: 0.01, def: 0.35, why: "Quantas estrelas por área." },
  { id: "galaxy.grain", name: "Ruído na tonalidade", min: 0, max: 1, step: 0.01, def: 0.1, why: "Granula a tonalidade do padrão: a cor cintila dentro de cada bolinha." },
  { id: "galaxy.toneBlur", name: "Suavizar a tonalidade", min: 0, max: 5, step: 0.05, def: 1.5, why: "" },
  { id: "galaxy.view", name: "Ver a tonalidade como cor", toggle: true, def: false, why: "Mostra em que cor do espectro cada tom do padrão cai, sem a luz." },
];
const LAYERS = 1;                                       // o Galaxy usa uma folha só do holospot (o foil tradicional)
// materiais holográficos do Studio (difração definida por um mapa): Galaxy e Surge. A folha do holospot por baixo é o Prism.
const isHolo = () => state.material === "galaxy" || state.material === "surge";
const kitMaterial = () => (isHolo() ? "prism" : state.material);
const MOTIONS = { manual: "Manual (mouse)", sway: "Balanço", sweep: "Varredura", orbit: "Órbita", flip: "Giro 360°", tomadas: "Tomadas (câmera)" };

// ------------------------------------------------------------------ tomadas: a carta apresentada como produto
// Cada tomada é um movimento de câmera de poucos segundos sobre um ponto da carta (u, v de 0 a 1, a partir do
// canto de cima à esquerda), com aproximação (zoom) e giro. Em sequência, com corte seco entre elas, viram a
// apresentação de produto: macro no nome, na arte e no texto, passada no foil, afastar e girar. A câmera chega
// perto de verdade (com perspectiva); a nitidez vai até onde a imagem da carta aguenta (as do Scryfall: ~2×).
const lerp = (a, b, p) => a + (b - a) * p;
const easeIO = (p) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, p)));
const easeOut = (p) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
const SHOTS = {
  "macro-nome":    { name: "Macro no nome",        linear: true, dur: 1.4, zoom: 2.4, f: (p, k) => ({ u: lerp(0.24, 0.62, p), v: 0.075, z: k, rx: 3, ry: lerp(-7, 7, p), rz: 0 }) },
  "macro-arte":    { name: "Macro na arte",        linear: true, dur: 1.8, zoom: 2.2, f: (p, k) => ({ u: lerp(0.36, 0.64, p), v: 0.33, z: k * lerp(0.94, 1.08, p), rx: -4, ry: lerp(-10, 8, p), rz: 0 }) },
  "macro-texto":   { name: "Macro no texto",       linear: true, dur: 1.6, zoom: 2.0, f: (p, k) => ({ u: 0.5, v: lerp(0.68, 0.84, p), z: k, rx: lerp(6, -2, p), ry: lerp(4, -4, p), rz: 0 }) },
  "rodape":        { name: "Macro no artista",     linear: true, dur: 1.4, zoom: 2.6, f: (p, k) => ({ u: lerp(0.2, 0.4, p), v: 0.95, z: k, rx: -6, ry: lerp(-6, 4, p), rz: 0 }) },
  "foil":          { name: "Passada no foil",      dur: 1.6, zoom: 1.15, f: (p, k) => ({ u: 0.5, v: 0.5, z: k, rx: lerp(-8, 8, p), ry: lerp(-26, 26, p), rz: 0 }) },
  "afastar-girar": { name: "Afastar e girar",      dur: 2.0, zoom: 2.2, f: (p, k) => { const q = easeOut(p * 1.4); return { u: lerp(0.5, 0.5, q), v: lerp(0.33, 0.5, q), z: lerp(k, 1, q), rx: lerp(-4, 4, p), ry: 360 * easeIO(p), rz: 0 }; } },
  "passeio":       { name: "Passeio dramático",    dur: 2.4, zoom: 1.8, f: (p, k) => ({ u: lerp(0.3, 0.7, p), v: lerp(0.46, 0.26, p), z: k * lerp(0.9, 1.15, p), rx: lerp(14, 4, p), ry: lerp(-18, -4, p), rz: lerp(-6, 2, p) }) },
  "inteira":       { name: "Carta inteira",        dur: 1.6, zoom: 1, f: (p, k) => ({ u: 0.5, v: 0.5, z: k, rx: 4 * Math.sin(p * Math.PI * 2 + 0.6), ry: 12 * Math.sin(p * Math.PI * 2), rz: 0 }) },
  "giro":          { name: "Giro 360°",            dur: 1.6, zoom: 1, f: (p, k) => ({ u: 0.5, v: 0.5, z: k, rx: 4, ry: 360 * easeIO(p), rz: 0 }) },
};
const DEFAULT_SHOTS = ["macro-nome", "macro-arte", "macro-texto", "foil", "afastar-girar"].map((tipo) => ({ tipo, dur: SHOTS[tipo].dur, zoom: SHOTS[tipo].zoom }));
/** Lista de tomadas válida: tipos conhecidos, duração de 0,3 a 12 s, zoom de 0,5 a 4 */
const cleanShots = (list) => (Array.isArray(list) ? list : []).filter((x) => x && SHOTS[x.tipo]).slice(0, 24).map((x) => ({ tipo: x.tipo, dur: Math.min(12, Math.max(0.3, Number(x.dur) || SHOTS[x.tipo].dur)), zoom: Math.min(4, Math.max(0.5, Number(x.zoom) || SHOTS[x.tipo].zoom)) }));
const shotsTotal = (list = state.shots) => list.reduce((a, x) => a + x.dur, 0);
/** Câmera e giro da carta no instante t (repete a sequência em laço; no fim do clipe, para na última pose) */
function shotPose(t, hold = false) {
  const list = state.shots, total = shotsTotal(list);
  if (!list.length || total <= 0) return null;
  let at = hold ? Math.min(t, total - 1e-4) : ((t % total) + total) % total;
  for (const x of list) {
    // as macro andam em velocidade constante do primeiro ao último quadro (sem ease): entram e saem em corte seco
    if (at <= x.dur) { const p = at / x.dur; return SHOTS[x.tipo].f(SHOTS[x.tipo].linear ? p : easeIO(p), x.zoom); }
    at -= x.dur;
  }
  const x = list[list.length - 1];
  return SHOTS[x.tipo].f(1, x.zoom);
}
const MOTION = [
  { id: "motion.amp", name: "Amplitude", min: 0, max: 35, step: 0.5, def: 16, unit: "°" },
  { id: "motion.period", name: "Período", min: 1, max: 12, step: 0.1, def: 4, unit: "s" },
  { id: "motion.rx", name: "Inclinação base X", min: -35, max: 35, step: 0.5, def: -4, unit: "°" },
  { id: "motion.ry", name: "Inclinação base Y", min: -35, max: 35, step: 0.5, def: 8, unit: "°" },
];
const OWN = [...COMP, ...MASK, ...VIEW, ...MOTION, ...GALAXY];
const OWN_DEF = Object.fromEntries(OWN.map((c) => [c.id, c.def]));
// máquina fraca: abrir com ?quality=low (ou medium) muda a qualidade padrão do holospot
{ const q = new URLSearchParams(location.search).get("quality"); if (["low", "medium", "high"].includes(q)) { OWN_DEF["view.quality"] = q; VIEW.find((c) => c.id === "view.quality").def = q; } }

// ------------------------------------------------------------------ estado
const state = { material: "prism", mat: {}, scene: {}, own: {}, motion: "sway", shots: structuredClone(DEFAULT_SHOTS) };
const own = (id) => (id in state.own ? state.own[id] : OWN_DEF[id]);
const status = (t, err = false) => { const s = $("#status"); s.textContent = t; s.classList.toggle("err", err); };

// ------------------------------------------------------------------ render
const out = $("#out");
const canvasA = document.createElement("canvas");
let rendererA, rendererB, holo, card, obj, engineKey = "";
let galaxyKey = "", sceneBase = null;
const plain = (v) => typeof v === "number" || typeof v === "boolean" || typeof v === "string" || (!!v && typeof v === "object" && Object.keys(v).every((k) => typeof v[k] === "number"));
let cards = [], objs = [];                              // uma carta por camada (só o Galaxy usa mais de uma)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, 1, 0.05, 50);
const sceneB = new THREE.Scene();
const foilTex = new THREE.CanvasTexture(canvasA);
foilTex.colorSpace = THREE.NoColorSpace; foilTex.generateMipmaps = false; foilTex.minFilter = THREE.LinearFilter;
// camadas 2, 3 e a do foil tradicional do Galaxy: o mesmo canvas do holospot, copiado para a textura logo depois de cada passada
const layerTex = [foilTex, new THREE.CanvasTexture(canvasA), new THREE.CanvasTexture(canvasA), new THREE.CanvasTexture(canvasA)];
for (const t of layerTex) { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;

const U = {
  tFoil: { value: foilTex }, tFoil2: { value: layerTex[1] }, tFoil3: { value: layerTex[2] }, tFoil4: { value: layerTex[3] }, uGN: { value: new THREE.Vector4(0.6, 1, 0.35, 0.25) }, uGBase: { value: 0.8 }, uGTB: { value: 1.5 }, uGalaxy: { value: false }, uGView: { value: false },
  uGA: { value: new THREE.Vector4(20, 1.5, 1200, 500) }, uGB: { value: new THREE.Vector3(0.4, 3, 0.25) },
  // luzes da galáxia, presas à câmera (direção para a luz, intensidade), espalhadas em volta para sempre haver pontos acesos
  uGL: { value: [new THREE.Vector4(0.45, 0.5, 0.74, 1), new THREE.Vector4(-0.7, 0.25, 0.67, 0.7), new THREE.Vector4(0.15, -0.65, 0.74, 0.6), new THREE.Vector4(-0.2, 0.75, 0.63, 0.5), new THREE.Vector4(-0.55, -0.5, 0.67, 0.5), new THREE.Vector4(0.78, -0.1, 0.62, 0.6)] },
  tArt: { value: blank }, tBack: { value: blank }, tMask: { value: blank },
  uRes: { value: new THREE.Vector2(1, 1) }, uSizeMm: { value: new THREE.Vector2(W_MM, H_MM) }, uCorner: { value: 3.0 },
  uHasArt: { value: false }, uHasBack: { value: false }, uHasMask: { value: false }, uInvert: { value: false }, uMode: { value: 0 },
  uFoil: { value: 1 }, uInk: { value: 1 }, uDiffuse: { value: 0.42 }, uVarnish: { value: 0 }, uPrintLight: { value: 0.92 }, uUnder: { value: 0 },
  tPat: { value: blank }, uHasPat: { value: false }, uPat: { value: 1 }, uPatBlack: { value: 0.08 }, uPatWhite: { value: 0.6 }, uPatInv: { value: false }, uPatRG: { value: false },
  uLuma: { value: 1 }, uBlack: { value: 0.12 }, uWhite: { value: 0.8 }, uGamma: { value: 1 }, uMapBlur: { value: 0.6 }, uLumaInv: { value: false }, uShow: { value: false },
  uText: { value: 0.55 }, uSoft: { value: 0.008 }, uArtRect: { value: new THREE.Vector4() }, uBoxRect: { value: new THREE.Vector4() },
};
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(W_MM / H_MM, 1),
  new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, transparent: true, depthTest: false,
    vertexShader: `varying vec2 vUv; varying vec3 vT, vB, vVP;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vVP = mv.xyz;
        vT = normalize(mat3(modelViewMatrix) * vec3(1.0, 0.0, 0.0)); vB = normalize(mat3(modelViewMatrix) * vec3(0.0, 1.0, 0.0));
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vT, vB, vVP;
      uniform sampler2D tFoil, tArt, tBack, tMask;
      uniform vec2 uRes, uSizeMm; uniform float uCorner;
      uniform bool uHasArt, uHasBack, uHasMask, uInvert; uniform int uMode;
      uniform float uFoil, uInk, uDiffuse, uVarnish, uPrintLight, uUnder, uText, uSoft;
      uniform vec4 uArtRect, uBoxRect;
      uniform float uLuma, uBlack, uWhite, uGamma, uMapBlur; uniform bool uLumaInv, uShow;
      uniform sampler2D tPat; uniform bool uHasPat, uPatInv, uPatRG; uniform float uPat, uPatBlack, uPatWhite;
      uniform bool uGalaxy, uGView; uniform vec4 uGN, uGA, uGL[6]; uniform vec3 uGB; uniform float uGBase, uGTB;
      // cor de um comprimento de onda (nm), aproximação espectral de Zucconi, com queda fora do visível
      vec3 bump3(vec3 x, vec3 y){ return clamp(1.0 - x * x - y, 0.0, 1.0); }
      vec3 spectral(float w){
        float x = clamp((w - 400.0) / 300.0, 0.0, 1.0);
        vec3 c = bump3(vec3(3.54585104, 2.93225262, 2.41593945) * (x - vec3(0.69549072, 0.49228336, 0.27699880)), vec3(0.02312639, 0.15225084, 0.52607955))
               + bump3(vec3(3.90307140, 3.21182957, 3.96587128) * (x - vec3(0.11748627, 0.86755042, 0.66077860)), vec3(0.84897130, 0.88445281, 0.73949448));
        return c * smoothstep(380.0, 425.0, w) * smoothstep(735.0, 680.0, w);
      }
      // Difração de primeira e segunda ordem de uma rede cuja direção e passo saem da tonalidade (0..1) do padrão.
      // Para cada luz: h = L + V projetado no plano da carta; a componente de h através das ranhuras, vezes o passo,
      // é o comprimento de onda que chega ao olho; a componente ao longo delas tem de ser ~0 (abertura do brilho).
      vec3 galaxyLight(float tone){
        vec3 V = normalize(-vVP), acc = vec3(0.0);
        float phi = radians(uGA.x) + tone * uGA.y * 3.14159265;
        vec2 g = vec2(cos(phi), sin(phi));
        float d = max(300.0, uGA.z + (tone - 0.5) * uGA.w);
        for (int i = 0; i < 6; i++) {
          vec3 h = normalize(uGL[i].xyz) + V;
          vec2 hp = vec2(dot(h, vT), dot(h, vB));
          float u = abs(dot(hp, g)), w = dot(hp, vec2(-g.y, g.x));
          float cone = exp(-(w * w) / (uGB.x * uGB.x));
          acc += uGL[i].w * cone * (spectral(d * u) + 0.45 * spectral(d * u * 0.5));
          acc += uGL[i].w * uGB.z * exp(-dot(hp, hp) / 0.012);
        }
        return acc * uGB.y;
      }
      vec3 hash3(vec2 p){ return fract(sin(vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash3(i).x, hash3(i + vec2(1.0, 0.0)).x, f.x), mix(hash3(i + vec2(0.0, 1.0)).x, hash3(i + vec2(1.0, 1.0)).x, f.x), f.y); }
      // uma estrela por célula: (brilho 0..1, sorteio 0..1 que escolhe a camada). density = fração das células com estrela
      vec2 star(vec2 p, float density, float seed){
        vec2 id = floor(p), f = fract(p); vec3 h = hash3(id + seed);
        float r = mix(0.05, 0.3, h.x * h.x * h.x);
        float v = step(1.0 - density, fract(h.x * 13.7 + h.y)) * smoothstep(r, r * 0.55, length(f - (0.3 + 0.4 * h.yz)));
        return vec2(v, fract(h.z * 7.31 + h.x));
      }
      vec3 toLin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }
      vec3 toSrgb(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
      // retângulo (esq, topo, dir, base) em coordenadas da carta com origem no canto de cima
      float rect(vec2 uv, vec4 r, float s){
        vec2 p = vec2(uv.x, 1.0 - uv.y); float e = max(s, 1e-4);
        return smoothstep(r.x - e, r.x + e, p.x) * smoothstep(r.z + e, r.z - e, p.x) * smoothstep(r.y - e, r.y + e, p.y) * smoothstep(r.w + e, r.w - e, p.y);
      }
      void main(){
        // contorno da carta: cantos arredondados em milímetros
        vec2 q = abs((vUv - 0.5) * uSizeMm) - uSizeMm * 0.5 + uCorner;
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCorner;
        float fw = max(fwidth(d), 1e-4);
        float a = 1.0 - smoothstep(-fw, fw, d);
        if (a <= 0.002) discard;
        vec3 foil = toLin(texture2D(tFoil, gl_FragCoord.xy / uRes).rgb);   // a folha do holospot neste pixel
        vec3 col;
        if (!gl_FrontFacing) {
          // verso: a imagem do verso, com o brilho que o holospot deu ao cartão
          vec3 b = uHasBack ? toLin(texture2D(tBack, vec2(1.0 - vUv.x, vUv.y)).rgb) : foil;
          col = uHasBack ? b * 0.92 + foil * 0.06 : foil;
        } else {
          vec3 art = uHasArt ? toLin(texture2D(tArt, vUv).rgb) : vec3(1.0);
          // região: onde a folha pode existir (carta inteira, arte, moldura, PNG), menos a base branca da caixa de texto
          float region = 1.0;
          if (uMode == 1) region = rect(vUv, uArtRect, uSoft);
          else if (uMode == 2) region = 1.0 - rect(vUv, uArtRect, uSoft);
          else if (uMode == 3) region = uHasMask ? dot(texture2D(tMask, vUv).rgb, vec3(1.0 / 3.0)) : 1.0;
          if (uInvert) region = 1.0 - region;
          region *= (1.0 - uText * rect(vUv, uBoxRect, uSoft)) * (1.0 - uUnder);
          // padrão do foil: a folha só existe onde o mapa é branco (confete do Galaxy Foil)
          float pv = 1.0, pat = 1.0;
          if (uHasPat && uPat > 0.0) {
            vec3 pt = texture2D(tPat, vUv).rgb;
            pv = uPatRG ? pt.r : dot(pt, vec3(1.0 / 3.0));               // perfil em dois canais: R é a máscara
            pv = clamp((pv - uPatBlack) / max(uPatWhite - uPatBlack, 1e-3), 0.0, 1.0);
            if (uPatInv) pv = 1.0 - pv;
            pat = mix(1.0, pv, uPat);
          }
          // mapa de contraste: o preto e branco da arte (desfocado) passa por levels, como na separação da base branca
          float lum = 1.0;
          if (uHasArt && uLuma > 0.0) {
            float l = dot(texture2D(tArt, vUv, uMapBlur).rgb, vec3(0.2126, 0.7152, 0.0722));
            float lv = pow(clamp((l - uBlack) / max(uWhite - uBlack, 1e-3), 0.0, 1.0), 1.0 / uGamma);
            if (uLumaInv) lv = 1.0 - lv;
            lum = mix(1.0, lv, uLuma);
          }
          vec3 ink = pow(art, vec3(uInk));                         // tinta como filtro sobre o metal
          vec3 print = art * uPrintLight;                          // impresso sobre base branca: sem folha
          vec3 gw = vec3(1.0, 0.0, 0.0);
          vec3 light;                                              // luz da folha que chega ao olho, já mascarada
          float m, mGal = 0.0, mTrad = 0.0;
          if (uGalaxy) {
            // GALAXY = foil tradicional (a arte é a máscara) + fundo de galáxia (padrão + ruído estelar)
            // a tonalidade que vira rede de difração é lida desfocada (5 amostras num nível mais baixo da textura):
            // tira o degrau dos 256 tons e a grade de pixels do mapa, que apareciam como mosaico com muito giro
            float band = pv;
            if (uHasPat) {
              vec2 px = vec2(uGTB) / vec2(1024.0, 1448.0);
              float tb = 0.0;
              vec3 cw = uPatRG ? vec3(0.0, 1.0, 0.0) : vec3(1.0 / 3.0);   // perfil em dois canais: G é a tonalidade, sem levels
              tb += dot(texture2D(tPat, vUv, uGTB).rgb, cw) * 0.4;
              tb += dot(texture2D(tPat, vUv + vec2(px.x, 0.0), uGTB).rgb, cw) * 0.15;
              tb += dot(texture2D(tPat, vUv - vec2(px.x, 0.0), uGTB).rgb, cw) * 0.15;
              tb += dot(texture2D(tPat, vUv + vec2(0.0, px.y), uGTB).rgb, cw) * 0.15;
              tb += dot(texture2D(tPat, vUv - vec2(0.0, px.y), uGTB).rgb, cw) * 0.15;
              if (!uPatRG) tb = clamp((tb - uPatBlack) / max(uPatWhite - uPatBlack, 1e-3), 0.0, 1.0);
              band = (uPatInv && !uPatRG) ? 1.0 - tb : tb;
            }
            float gal = (uHasPat && uPat > 0.0) ? pv * uPat : 0.0;
            // ruído estelar: duas oitavas de estrelas procedurais, cada uma com a sua tonalidade
            vec2 mm = vUv * uSizeMm / max(uGN.y, 0.05);
            vec2 s1 = star(mm / 1.5, uGN.z, 11.0), s2 = star(mm / 0.55, uGN.z * 0.8, 47.0);
            vec2 st = s1.x > s2.x * 0.8 ? s1 : vec2(s2.x * 0.8, s2.y);
            float sv = st.x * uGN.x;
            if (sv > gal) { gal = sv; band = clamp(st.y * 0.75 + st.x * 0.25, 0.0, 1.0); }   // cada estrela tem o seu tom, com um degradê do centro para a borda
            // ruído na tonalidade: a cor cintila dentro de cada bolinha
            band = clamp(band + (vnoise(mm / 0.4) * 0.65 + vnoise(mm / 0.15) * 0.35 - 0.5) * uGN.w, 0.0, 1.0);   // ruído suave: sem células quadradas
            vec3 foilGal = galaxyLight(band);                      // a tonalidade é a rede de difração deste ponto
            gw = spectral(400.0 + 300.0 * fract(band * max(uGA.y, 0.25)));
            mGal = gal * region;
            mTrad = uGBase > 0.0 ? clamp(lum * uGBase, 0.0, 1.0) * region : 0.0;
            light = foilGal * mGal + foil * lum * uGBase * region;   // galáxia + foil tradicional (folha do holospot)
            m = clamp(mTrad + mGal - mTrad * mGal, 0.0, 1.0);
          } else {
            m = clamp(region * pat * lum, 0.0, 1.0);
            light = foil * m;
          }
          col = mix(print, art * uDiffuse, m) + light * uFoil * ink;   // folha × tinta + a arte sob luz difusa
          float hi = smoothstep(0.75, 1.0, max(light.r, max(light.g, light.b)));
          col = mix(col, max(col, light), hi * uVarnish);          // verniz: o reflexo forte fica por cima da tinta (só onde há folha)
          if (uShow) col = toLin(vec3(m));
          if (uGalaxy && uGView) col = toLin(gw * mGal + vec3(mTrad) * 0.35);
        }
        gl_FragColor = vec4(toSrgb(col), a);
      }`,
  }),
);
plane.geometry.translate(0, 0, 0.002);
plane.matrixAutoUpdate = false; plane.matrixWorldAutoUpdate = false; plane.frustumCulled = false;
sceneB.add(plane);
// fundo: o quadro do holospot (com o brilho em volta da carta) ou uma cor
const bgQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: { tFoil: U.tFoil, uBg: { value: new THREE.Color("#0b0d12") } }, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    // o holospot desenha sobre preto: a cor do fundo entra por baixo e a luz dele soma
    fragmentShader: `varying vec2 vUv; uniform sampler2D tFoil; uniform vec3 uBg; void main(){ vec3 f = texture2D(tFoil, vUv).rgb; gl_FragColor = vec4(1.0 - (1.0 - uBg) * (1.0 - f), 1.0); }`,
  }),
);
bgQuad.frustumCulled = false; bgQuad.renderOrder = -1; sceneB.add(bgQuad);

function size() { const [w, h] = $("#expSize").value.split("x").map(Number); return { w, h }; }
let texW = 0, texH = 0;
function resize() {
  const { w, h } = size();
  for (const r of [rendererA, rendererB]) { r.setPixelRatio(1); r.setSize(w, h, false); }
  // A textura do foil é a cópia do canvas do holospot, e o three.js reserva a memória dela uma vez só (texStorage2D):
  // quando o quadro mudava de tamanho (o vertical dos shorts), a cópia nova não cabia e o foil congelava numa faixa
  // branca, sem responder aos parâmetros. Liberar a textura faz o three.js reservar de novo no tamanho certo.
  if (texW && (texW !== w || texH !== h)) for (const t of layerTex) t.dispose();
  texW = w; texH = h;
  const label = $("#expSizeLabel"); if (label) label.textContent = `${w} × ${h}`;
  out.style.aspectRatio = `${w} / ${h}`;
  U.uRes.value.set(w, h);
  frameCamera();
}
function frameCamera() {
  const { w, h } = size();
  camera.aspect = w / h; camera.fov = own("view.fov");
  const fit = 0.74;
  const vh = Math.max(1 / fit, W_MM / H_MM / (fit * camera.aspect));     // altura visível no plano da carta
  camera.position.set(0, 0, vh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  camera.lookAt(0, 0, 0);
  // zoom e deslocamento são um recorte da mesma projeção: a carta e a luz não mudam, só o enquadramento
  const z = own("view.zoom"), px = own("view.panX"), py = own("view.panY");
  if (z === 1 && !px && !py) camera.clearViewOffset(); else camera.setViewOffset(w, h, (0.5 - 0.5 / z + px) * w, (0.5 - 0.5 / z + py) * h, w / z, h / z);
  camera.updateProjectionMatrix();
  const zl = document.querySelector("#zoomLabel"); if (zl) zl.textContent = `${Math.round(z * 100)}%`;
}

function init() {
  for (const c of cards) { try { holo.remove(c); } catch {} scene.remove(c); }
  if (holo) { try { holo.dispose(); } catch {} }
  cards = []; objs = []; card = null; obj = null;
  if (!rendererA) rendererA = new THREE.WebGLRenderer({ canvas: canvasA, antialias: false, preserveDrawingBuffer: true });
  if (!rendererB) rendererB = new THREE.WebGLRenderer({ canvas: out, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  rendererB.setClearColor(0x000000, 0);
  holo = new Holo(rendererA, { background: "black", compose: "replace", quality: own("view.quality"), lights: own("view.lights") });
  engineKey = `${own("view.quality")}|${own("view.lights")}`;
  holo.expose();
  resize();
  build(true);
}

let building = 0;
async function build(first = false) {
  const token = ++building;
  for (const c of cards) { holo.remove(c); scene.remove(c); }
  const galaxy = isHolo(), n = galaxy ? LAYERS : 1;
  cards = []; objs = [];
  for (let i = 0; i < n; i++) {
    const c = holo.card({ material: kitMaterial(), look: "card", widthMm: W_MM, heightMm: H_MM, size: 1, scene: first && i === 0, settings: { ...(state.mat[state.material] ?? {}), ...(galaxy ? galaxyLayer(i) : {}) } });
    scene.add(c); cards.push(c); objs.push(holo.get(c));
  }
  card = cards[0]; obj = objs[0]; galaxyKey = JSON.stringify(galaxyLayer());
  U.uGalaxy.value = galaxy;
  // A base de todo look: a cena de fábrica da carta no holo.spot, com os padrões do Studio por cima. applyScene parte
  // dela, para nada do look anterior sobrar. O motor liga por padrão um relevo em linhas finas na carta (card.emboss),
  // que aparecia como ondas no foil: no Studio a carta parte lisa (dá para ligar na aba Superfície, modo avançado).
  if (!sceneBase) {
    sceneBase = {};
    try { for (const [k, v] of Object.entries(resolveSettings({ material: kitMaterial(), look: "card" }).scene)) if (plain(v)) sceneBase[k] = v; } catch {}
    Object.assign(sceneBase, STUDIO_SCENE);
  }
  applyScene();
  status(`compilando ${MATERIALS[state.material]}…`);
  try { await Promise.all(objs.map((o) => o.ready)); } catch (e) { status(`erro no holospot: ${e.message ?? e}`, true); return; }
  if (token !== building) return;
  U.uCorner.value = Number(holo.scene["card.corner"] ?? 3.0);
  status(`${MATERIALS[state.material]} · qualidade ${holo.info.quality ?? "?"}`);
  renderPanel();
}
/** valores do Prism para a folha do Galaxy: o foil tradicional de Magic, um arco-íris contínuo e largo */
function galaxyLayer() {
  return { "prism.pattern": "linear", "prism.fan": 10, "prism.grooveAngle": own("galaxy.baseAngle"), "prism.pitch": 1400 };
}
function applyScene() {
  if (sceneBase) { if (sceneBase["studio.preset"]) holo.setScene({ "studio.preset": sceneBase["studio.preset"] }); holo.setScene(sceneBase); }
  const s = { ...state.scene };
  // mapas de relevo do próprio Studio (holofoil/bumps): o holospot precisa do endereço completo
  for (const [k, v] of Object.entries(s)) if (typeof v === "string" && /^\/(data\/)?holofoil\//.test(v)) s[k] = location.origin + v;
  if (s["studio.preset"]) { holo.setScene({ "studio.preset": s["studio.preset"] }); delete s["studio.preset"]; }
  holo.setScene({ ...s, ...BASE_SCENE });
}
function applyOwn() {
  U.uFoil.value = own("comp.foil"); U.uInk.value = own("comp.ink"); U.uDiffuse.value = own("comp.diffuse"); U.uVarnish.value = own("comp.varnish");
  U.uPrintLight.value = own("comp.printLight"); U.uUnder.value = own("comp.under");
  U.uMode.value = { all: 0, art: 1, frame: 2, custom: 3 }[own("mask.mode")] ?? 0;
  U.uLuma.value = own("mask.luma"); U.uBlack.value = own("mask.black"); U.uWhite.value = own("mask.white"); U.uGamma.value = own("mask.gamma"); U.uMapBlur.value = own("mask.blur"); U.uLumaInv.value = !!own("mask.lumaInv"); U.uShow.value = !!own("mask.show");
  U.uPat.value = own("mask.pat"); U.uPatBlack.value = own("mask.patBlack"); U.uPatWhite.value = own("mask.patWhite"); U.uPatInv.value = !!own("mask.patInv"); U.uPatRG.value = own("mask.patChannels") === "rg";
  loadPattern(own("mask.patSrc"));
  U.uInvert.value = !!own("mask.invert"); U.uText.value = own("mask.text"); U.uSoft.value = own("mask.soft");
  U.uArtRect.value.set(own("mask.artL"), own("mask.artT"), own("mask.artR"), own("mask.artB"));
  U.uBoxRect.value.set(own("mask.boxL"), own("mask.boxT"), own("mask.boxR"), own("mask.boxB"));
  U.uGN.value.set(own("galaxy.stars"), own("galaxy.starSize"), own("galaxy.starDensity"), own("galaxy.grain")); U.uGBase.value = own("galaxy.base"); U.uGTB.value = own("galaxy.toneBlur");
  U.uGA.value.set(own("galaxy.angle"), own("galaxy.turns"), own("galaxy.pitch"), own("galaxy.pitchRange")); U.uGB.value.set(own("galaxy.fan"), own("galaxy.gain"), own("galaxy.mirror")); U.uGView.value = !!own("galaxy.view");
  const gk = JSON.stringify(galaxyLayer());                 // só reenvia ao holospot quando uma camada mudou
  if (isHolo() && objs.length === LAYERS && gk !== galaxyKey) { galaxyKey = gk; objs.forEach((o, i) => o.set(galaxyLayer(i))); }
  bgQuad.material.uniforms.uBg.value.set(own("view.bg"));
  frameCamera();
}

let patLoaded = "";
async function loadPattern(src) {
  if (src === patLoaded) return;
  patLoaded = src;
  if (!src) { U.uHasPat.value = false; return; }
  try { const t = await tex(src); if (patLoaded !== src) return; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; U.tPat.value = t; U.uHasPat.value = true; }
  catch (e) { U.uHasPat.value = false; status(`padrão do foil: ${e.message}`, true); }
}

// ------------------------------------------------------------------ movimento
const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
function pose(t) {
  const A = own("motion.amp"), P = own("motion.period"), bx = own("motion.rx"), by = own("motion.ry"), w = (t / P) * Math.PI * 2;
  switch (state.motion) {
    case "manual": return { rx: bx + pointer.cy * 28, ry: by + pointer.cx * 28 };
    case "sweep": return { rx: bx, ry: by - A * Math.cos(w) };
    case "orbit": return { rx: bx + A * 0.6 * Math.sin(w), ry: by + A * Math.cos(w) };
    case "flip": return { rx: bx + A * 0.25 * Math.sin(w), ry: by + 360 * (t / P) };      // velocidade constante: com duração = período o clipe emenda sem tranco
    default: return { rx: bx + A * 0.35 * Math.sin(w * 2 + 0.6), ry: by + A * Math.sin(w) };
  }
}
let rigged = false;
const aimAt = new THREE.Vector3();
/** Tomadas: a câmera vai até o ponto da carta (perspectiva real) em vez do recorte do zoom da tela */
function aimCamera(r) {
  const { w, h } = size();
  camera.aspect = w / h; camera.fov = own("view.fov"); camera.clearViewOffset();
  const fit = 0.74;
  const vh = Math.max(1 / fit, W_MM / H_MM / (fit * camera.aspect));
  const d0 = vh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  card.updateMatrixWorld(true);
  card.localToWorld(aimAt.set((r.u - 0.5) * (W_MM / H_MM), 0.5 - r.v, 0));
  camera.position.set(aimAt.x, aimAt.y, d0 / Math.max(0.3, r.z));
  camera.up.set(Math.sin(THREE.MathUtils.degToRad(-r.rz * 0.4)), Math.cos(THREE.MathUtils.degToRad(-r.rz * 0.4)), 0);
  camera.lookAt(aimAt);
  camera.updateProjectionMatrix();
  rigged = true;
}
function draw(t, offline) {
  if (!card) return;
  const shot = state.motion === "tomadas" ? shotPose(t, !!offline) : null;
  const p = shot ?? pose(t);
  if ($("#backShow").checked) p.ry += 180;                              // "mostrar o verso": meia volta a mais
  for (const c of cards) c.rotation.set(THREE.MathUtils.degToRad(p.rx), THREE.MathUtils.degToRad(p.ry), THREE.MathUtils.degToRad(shot ? shot.rz : 0), "XYZ");
  if (shot) aimCamera(shot);
  else if (rigged) { rigged = false; camera.up.set(0, 1, 0); frameCamera(); }
  if (cards.length === 1) {
    card.visible = true;
    scene.updateMatrixWorld(true);
    holo.render(scene, camera, offline ? { time: t, dt: offline.dt } : undefined);
    foilTex.needsUpdate = true;
  } else {
    // uma passada do holospot por camada: só a carta da vez fica visível, e o quadro vai direto para a textura dela
    for (let i = 0; i < cards.length; i++) {
      cards.forEach((c, k) => (c.visible = k === i));
      scene.updateMatrixWorld(true);
      holo.render(scene, camera, { time: t, dt: offline ? offline.dt : 1 / 60, still: true });
      layerTex[i].needsUpdate = true; rendererB.initTexture(layerTex[i]);
    }
  }
  plane.matrixWorld.copy(card.matrixWorld);
  bgQuad.visible = $("#expBg").value !== "transparent";
  rendererB.render(sceneB, camera);
}
let clock = 0, last = performance.now(), busy = false;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (busy) return;
  pointer.cx += (pointer.x - pointer.cx) * 0.12; pointer.cy += (pointer.y - pointer.cy) * 0.12;
  if ($("#play").checked || state.motion === "manual") clock += dt;
  draw(clock);
}
const setView = (z, px, py) => { state.own["view.zoom"] = Math.min(5, Math.max(0.2, z)); state.own["view.panX"] = px; state.own["view.panY"] = py; frameCamera(); if (tab === "view" && advanced) renderPanel(); };
let drag = null;
out.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, px: own("view.panX"), py: own("view.panY") }; out.setPointerCapture(e.pointerId); out.style.cursor = "grabbing"; });
out.addEventListener("pointerup", () => { drag = null; out.style.cursor = "grab"; });
out.addEventListener("pointermove", (e) => {
  const r = out.getBoundingClientRect();
  if (drag) { const z = own("view.zoom"); setView(z, drag.px - (e.clientX - drag.x) / r.width / z, drag.py - (e.clientY - drag.y) / r.height / z); return; }   // arrastar move a carta
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
});
out.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = out.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
  const z0 = own("view.zoom"), z1 = Math.min(5, Math.max(0.2, z0 * Math.exp(-e.deltaY * 0.0015)));
  // o ponto sob o cursor fica parado
  const at = (z, p, f) => 0.5 - 0.5 / z + p + f / z, back = (z, v, f) => v - f / z - 0.5 + 0.5 / z;
  setView(z1, back(z1, at(z0, own("view.panX"), fx), fx), back(z1, at(z0, own("view.panY"), fy), fy));
}, { passive: false });
out.addEventListener("dblclick", () => setView(1, 0, 0));
const zoomBy = (k) => setView(own("view.zoom") * k, own("view.panX"), own("view.panY"));
document.querySelector("#zoomIn").onclick = () => zoomBy(1.25);
document.querySelector("#zoomOut").onclick = () => zoomBy(0.8);
document.querySelector("#zoomReset").onclick = () => setView(1, 0, 0);

// ------------------------------------------------------------------ carta
const loader = new THREE.TextureLoader(); loader.setCrossOrigin("anonymous");
function tex(url) {
  return new Promise((ok, no) => loader.load(url, (t) => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; ok(t); }, undefined, () => no(new Error(`não abriu ${url}`))));
}
async function setArt(url, label) {
  state.cardSource = null;                       // imagem avulsa; uma versão do Scryfall marca de onde veio (usePrint)
  try {
    const t = await tex(url);
    if (U.tArt.value !== blank) U.tArt.value.dispose();
    U.tArt.value = t; U.uHasArt.value = true;
    state.cardLabel = label;
    $("#cardInfo").textContent = `${label} · ${t.image.width} × ${t.image.height}`;
    return true;
  } catch (e) { status(e.message, true); return false; }
}
// ---- busca no Scryfall: sugestões por semelhança do nome e menu de versões ----
const API = "https://api.scryfall.com";
const norm = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const grams = (t) => { const s = ` ${norm(t)} `, g = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); g.set(k, (g.get(k) ?? 0) + 1); } return g; };
/** semelhança 0..1 entre o que foi digitado e um nome (pares de letras, sem acento; começo igual e nome contido contam mais) */
function similar(q, name) {
  const a = grams(q), b = grams(name); let hit = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v; hit += Math.min(v, b.get(k) ?? 0); }
  for (const v of b.values()) nb += v;
  const dice = na + nb ? (2 * hit) / (na + nb) : 0, nq = norm(q), nn = norm(name);
  return Math.min(1, dice + (nn.startsWith(nq) ? 0.35 : nn.includes(nq) ? 0.2 : 0));
}
const cache = new Map();
async function api(path) {
  if (cache.has(path)) return cache.get(path);
  const r = await fetch(API + path, { headers: { accept: "application/json" } });
  const j = r.status === 404 ? { object: "error", data: [] } : await r.json();
  cache.set(path, j);
  return j;
}
const imgOf = (c, face = 0) => (c.card_faces?.[face]?.image_uris ?? c.image_uris ?? c.card_faces?.[0]?.image_uris)?.png;
const ptName = (c) => c.printed_name ?? c.card_faces?.map((f) => f.printed_name).filter(Boolean).join(" // ");

/** Nomes parecidos com o texto digitado: inglês (autocomplete), português (nome impresso) e, se nada bater, a busca tolerante a erro */
async function suggest(q) {
  const out = new Map();                                             // nome em inglês (a chave do Scryfall) → {name, shown, score}
  const add = (name, shown) => { const score = Math.max(similar(q, shown), similar(q, name) * 0.98); const cur = out.get(name); if (!cur || score > cur.score) out.set(name, { name, shown, score }); };
  // português: busca pelos começos das palavras (4 letras), para um erro de digitação no fim da palavra não zerar
  // a lista; a ordem final é por semelhança com o que foi digitado. Se nada tiver todas as palavras, vale qualquer uma.
  const stems = norm(q).split(" ").filter((w) => w.length >= 2).map((w) => `name:${w.slice(0, 4)}`);
  const ptSearch = (expr) => api(`/cards/search?q=${encodeURIComponent(`lang:pt ${expr}`)}&unique=cards&include_multilingual=true&order=name`).catch(() => ({ data: [] }));
  // o "fuzzy" do Scryfall acha a carta mesmo com palavras faltando ou fora de ordem ("sothera supervoid")
  let [en, pt, fz] = await Promise.all([
    api(`/cards/autocomplete?q=${encodeURIComponent(q)}`).catch(() => ({ data: [] })),
    stems.length ? ptSearch(stems.join(" ")) : { data: [] },
    q.includes(" ") ? api(`/cards/named?fuzzy=${encodeURIComponent(q)}`).catch(() => null) : null,
  ]);
  if (fz?.name) out.set(fz.name, { name: fz.name, shown: fz.name, score: Math.max(similar(q, fz.name), 0.9) });
  if (!(pt.data ?? []).length && stems.length > 1) pt = await ptSearch(`(${stems.join(" or ")})`);
  for (const n of en.data ?? []) add(n, n);
  for (const c of pt.data ?? []) add(c.name, ptName(c) || c.name);
  if (!out.size) { const c = await api(`/cards/named?fuzzy=${encodeURIComponent(q)}`).catch(() => null); if (c?.name) add(c.name, c.name); }
  return [...out.values()].sort((x, y) => y.score - x.score).slice(0, 14);
}

let prints = [], sugList = [], sugAt = -1, sugToken = 0, sugTimer = 0;
const sugBox = $("#cardSug");
function showSug(list, empty) {
  sugList = list; sugAt = list.length ? 0 : -1; sugBox.innerHTML = "";
  if (!list.length) { const d = document.createElement("div"); d.className = "none"; d.textContent = empty; sugBox.append(d); }
  list.forEach((s, i) => {
    const d = document.createElement("div"); d.className = i === 0 ? "on" : "";
    const b = document.createElement("span"); b.textContent = s.shown; d.append(b);
    if (s.shown !== s.name) { const sm = document.createElement("small"); sm.textContent = s.name; d.append(sm); }
    d.onmousedown = (e) => { e.preventDefault(); pick(s); };
    sugBox.append(d);
  });
  sugBox.hidden = false;
}
const markSug = () => [...sugBox.children].forEach((d, i) => { d.classList.toggle("on", i === sugAt); if (i === sugAt) d.scrollIntoView({ block: "nearest" }); });
$("#cardName").addEventListener("input", (e) => {
  const q = e.target.value.trim(); clearTimeout(sugTimer);
  if (q.length < 2) { sugBox.hidden = true; return; }
  sugTimer = setTimeout(async () => {
    const token = ++sugToken;
    try { const list = await suggest(q); if (token === sugToken) showSug(list, "Nenhuma carta parecida."); }
    catch (err) { if (token === sugToken) showSug([], `Scryfall não respondeu (${err.message}).`); }
  }, 220);
});
$("#cardName").addEventListener("keydown", (e) => {
  if (sugBox.hidden) return;
  if (e.key === "ArrowDown") { sugAt = Math.min(sugList.length - 1, sugAt + 1); markSug(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { sugAt = Math.max(0, sugAt - 1); markSug(); e.preventDefault(); }
  else if (e.key === "Enter" && sugList[sugAt]) { pick(sugList[sugAt]); e.preventDefault(); }
  else if (e.key === "Escape") sugBox.hidden = true;
});
$("#cardName").addEventListener("blur", () => setTimeout(() => (sugBox.hidden = true), 120));

/** rótulo de uma versão: coleção, número, ano, idioma e o que ela tem de especial */
function printLabel(c) {
  const fx = [];
  if (c.border_color === "borderless") fx.push("sem borda");
  if (c.full_art) fx.push("full art");
  for (const f of c.frame_effects ?? []) { const n = { showcase: "showcase", extendedart: "arte estendida", etched: "etched", inverted: "invertida", textless: "sem texto" }[f]; if (n && !fx.includes(n)) fx.push(n); }
  if (c.frame === "1993" || c.frame === "1997") fx.push("moldura antiga"); else if (c.frame === "future") fx.push("futurista");
  if (c.promo) fx.push("promo");
  if ((c.finishes ?? []).includes("etched") && !fx.includes("etched")) fx.push("etched");
  if ((c.finishes ?? []).length && !(c.finishes ?? []).includes("nonfoil")) fx.push("só foil");
  return `${String(c.set).toUpperCase()} #${c.collector_number} · ${c.set_name} · ${String(c.released_at ?? "").slice(0, 4)} · ${String(c.lang).toUpperCase()}${fx.length ? ` · ${fx.join(", ")}` : ""}`;
}
let picked = null;
async function pick(s) {
  picked = s; sugBox.hidden = true; $("#cardName").value = s.shown;
  await loadPrints();
}
async function loadPrints() {
  if (!picked) return;
  const sel = $("#cardPrint"), lang = $("#cardLang").value;
  sel.disabled = true; sel.innerHTML = "<option>buscando versões…</option>";
  status(`buscando as versões de "${picked.name}"…`);
  try {
    const lq = lang === "pt-en" ? "(lang:pt or lang:en)" : lang === "any" ? "lang:any" : `lang:${lang}`;
    let path = `/cards/search?q=${encodeURIComponent(`!"${picked.name}" ${lq} game:paper`)}&unique=prints&include_multilingual=true&order=released&dir=desc`;
    let all = [];
    for (let page = 0; page < 4 && path; page++) { const r = await api(path); all = all.concat(r.data ?? []); path = r.has_more && r.next_page ? r.next_page.replace(API, "") : null; }
    // sem versão no idioma pedido: cai para o inglês
    if (!all.length && lang !== "en") { const r = await api(`/cards/search?q=${encodeURIComponent(`!"${picked.name}" game:paper`)}&unique=prints&order=released&dir=desc`); all = r.data ?? []; }
    prints = all.filter((c) => imgOf(c));
    if (lang === "pt-en") prints.sort((a, b) => (a.lang === "pt" ? 0 : 1) - (b.lang === "pt" ? 0 : 1));   // português primeiro, cada idioma da mais nova para a mais antiga
    sel.innerHTML = "";
    if (!prints.length) { sel.innerHTML = "<option>Nenhuma versão com imagem</option>"; return status(`"${picked.name}": nenhuma versão com imagem`, true); }
    prints.forEach((c, i) => { const o = document.createElement("option"); o.value = i; o.textContent = printLabel(c); sel.append(o); });
    sel.disabled = false; sel.value = "0";
    await usePrint();
    status(`${prints.length} versões de ${picked.name}`);
  } catch (e) { sel.innerHTML = "<option>Versões: falhou a busca</option>"; status(`Scryfall: ${e.message}`, true); }
}
async function usePrint() {
  const c = prints[Number($("#cardPrint").value)];
  if (!c) return;
  const faces = (c.card_faces ?? []).filter((f) => f.image_uris).length;
  const face = $("#cardFace"); face.hidden = faces < 2; if (faces < 2) face.value = "0";
  const f = Number(face.value) || 0;
  const ok = await setArt(imgOf(c, f), `${(f ? c.card_faces?.[f]?.printed_name ?? c.card_faces?.[f]?.name : ptName(c)?.split(" // ")[0]) || c.name.split(" // ")[f] || c.name} (${String(c.set).toUpperCase()} ${c.collector_number})`);
  if (ok) state.cardSource = { print: c, face: f };
}
/** A versão do Scryfall que está na tela (para quem abriu o Studio saber qual arte foi escolhida aqui); null = imagem avulsa */
function cardSource() {
  const src = state.cardSource;
  if (!src) return null;
  const c = src.print, uris = c.card_faces?.[src.face]?.image_uris ?? c.image_uris ?? c.card_faces?.[0]?.image_uris ?? {};
  return {
    id: c.id, name: c.name, set: c.set, setName: c.set_name, number: c.collector_number, released: c.released_at, lang: c.lang,
    imageUrl: uris.large ?? uris.png, artCropUrl: uris.art_crop, artist: c.card_faces?.[src.face]?.artist ?? c.artist,
    finishes: c.finishes ?? [], prices: c.prices ?? {}, borderColor: c.border_color, fullArt: !!c.full_art,
    effects: [...(c.frame_effects ?? []), ...(c.promo_types ?? [])], label: printLabel(c),
  };
}
$("#cardPrint").onchange = usePrint;
$("#cardFace").onchange = usePrint;
$("#cardLang").onchange = loadPrints;
$("#cardFile").onclick = () => $("#cardInput").click();
$("#cardInput").onchange = (e) => { const f = e.target.files[0]; if (f) setArt(URL.createObjectURL(f), f.name); };
$("#cardLocal").onclick = async () => {
  const box = $("#localList");
  if (!box.hidden) { box.hidden = true; return; }
  const list = await (await fetch("/api/local")).json();
  box.innerHTML = "";
  for (const u of list) { const i = new Image(); i.loading = "lazy"; i.src = u; i.title = u; i.onclick = () => setArt(u, decodeURIComponent(u.split("/").pop())); box.append(i); }
  if (!list.length) box.textContent = "Nenhuma imagem na pasta cards/ ainda.";
  box.hidden = false;
};
const vp = $("#viewport");
vp.addEventListener("dragover", (e) => { e.preventDefault(); vp.classList.add("drop"); });
vp.addEventListener("dragleave", () => vp.classList.remove("drop"));
vp.addEventListener("drop", (e) => { e.preventDefault(); vp.classList.remove("drop"); const f = e.dataTransfer.files[0]; if (f) setArt(URL.createObjectURL(f), f.name); });

// ------------------------------------------------------------------ painel de controles
const TABS = [
  { id: "material", name: "Material" }, { id: "comp", name: "Tinta e foil" }, { id: "mask", name: "Máscara" },
  { id: "studio", name: "Luzes" }, { id: "surface", name: "Superfície" }, { id: "display", name: "Imagem" }, { id: "view", name: "Câmera" },
];
let tab = "material";
let advanced = localStorage.getItem("holofoil.advanced") === "1";
const usable = (p) => !/^Not used by the kit/.test(p.meaning ?? "") && !(p.id in BASE_SCENE) && p.id !== "scene.bgColor";
const sceneOf = (re) => SCENE_PARAMS.filter((p) => re.test(p.id) && usable(p));
const fmt = (v) => (typeof v === "number" ? String(Math.round(v * 1000) / 1000) : typeof v === "object" ? `${v.x?.toFixed?.(2)}, ${v.y?.toFixed?.(2)}` : String(v));

function ctl({ id, name, why, kind, min, max, step, options, value, modified, unit, onChange }) {
  const el = document.createElement("div"); el.className = `ctl${modified ? " mod" : ""}`;
  const top = document.createElement("div"); top.className = "top";
  const lab = document.createElement("label"); lab.textContent = name;
  const o = document.createElement("output"); o.textContent = kind === "slider" ? `${fmt(value)}${unit ? ` ${unit}` : ""}` : "";
  top.append(lab, o); el.append(top);
  const fire = (v) => { el.classList.add("mod"); if (kind === "slider") o.textContent = `${fmt(v)}${unit ? ` ${unit}` : ""}`; onChange(v); };
  if (kind === "slider") {
    const i = document.createElement("input"); i.type = "range"; i.min = min; i.max = max; i.step = step || (max - min) / 200; i.value = value;
    i.oninput = () => fire(Number(i.value)); el.append(i);
  } else if (kind === "select") {
    const s = document.createElement("select");
    for (const [v, l] of Array.isArray(options) ? options.map((x) => [x, x]) : Object.entries(options)) { const op = document.createElement("option"); op.value = v; op.textContent = l; s.append(op); }
    s.value = String(value); s.onchange = () => fire(s.value); el.append(s);
  } else if (kind === "toggle") {
    const i = document.createElement("input"); i.type = "checkbox"; i.checked = !!value; i.onchange = () => fire(i.checked); top.append(i);
  } else if (kind === "color") {
    const i = document.createElement("input"); i.type = "color"; i.value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"; i.oninput = () => fire(i.value); top.append(i);
  } else if (kind === "pad") {
    const box = document.createElement("div"); box.className = "pad"; const cur = { x: value?.x ?? 0, y: value?.y ?? 0 };
    for (const ax of ["x", "y"]) {
      const i = document.createElement("input"); i.type = "range"; i.min = min ?? -1; i.max = max ?? 1; i.step = step || 0.01; i.value = cur[ax]; i.title = ax;
      i.oninput = () => { cur[ax] = Number(i.value); o.textContent = fmt(cur); fire({ ...cur }); }; box.append(i);
    }
    o.textContent = fmt(cur); el.append(box);
  } else {
    const i = document.createElement("input"); i.type = "text"; i.value = value ?? ""; i.onchange = () => fire(i.value); el.append(i);
  }
  return el;
}
const kitKind = (p) => (p.kind === "slider" || p.kind === "toggle" || p.kind === "color" || p.kind === "pad" ? p.kind : p.options?.length ? "select" : "text");
function kitCtl(p, isScene, name) {
  const cur = isScene ? holo.scene[p.id] : obj.settings[p.id];
  const store = isScene ? state.scene : (state.mat[state.material] ??= {});
  return ctl({
    id: p.id, name: name ?? p.id.replace(/^[a-z]+\./, ""), why: p.meaning, kind: kitKind(p), min: p.min, max: p.max, step: p.step, options: p.options, unit: p.unit === "—" ? "" : p.unit,
    value: cur ?? p.default, modified: JSON.stringify(cur ?? p.default) !== JSON.stringify(p.default),
    onChange: (v) => {
      store[p.id] = v;
      if (isScene) {
        if (p.id === "studio.preset") { for (const k of Object.keys(state.scene)) if (k.startsWith("studio.") && k !== "studio.preset") delete state.scene[k]; applyScene(); renderPanel(); }
        else holo.setScene({ [p.id]: v });
      } else for (const o of objs) o.set({ [p.id]: v });
    },
  });
}
function ownCtl(c) {
  return ctl({
    id: c.id, name: c.name, why: c.why, unit: c.unit, kind: c.options ? "select" : c.toggle ? "toggle" : c.color ? "color" : "slider", min: c.min, max: c.max, step: c.step, options: c.options,
    value: own(c.id), modified: own(c.id) !== c.def,
    onChange: (v) => { state.own[c.id] = v; if (c.reinit) init(); else applyOwn(); },
  });
}
const group = (t) => { const g = document.createElement("div"); g.className = "grp"; g.textContent = t; return g; };
function renderPanel() {
  const tabs = $("#tabs"); tabs.innerHTML = "";
  const adv = document.createElement("button"); adv.id = "advToggle"; adv.textContent = advanced ? "Avançado: ligado" : "Avançado: desligado"; adv.className = advanced ? "on adv" : "adv";
  adv.title = "Mostra todos os parâmetros do holospot e do Studio, em abas"; adv.onclick = () => { advanced = !advanced; localStorage.setItem("holofoil.advanced", advanced ? "1" : "0"); renderPanel(); };
  tabs.append(adv);
  if (!advanced) {
    const p = $("#panel"); p.innerHTML = "";
    if (!obj) return;
    const byId = (id) => OWN.find((c) => c.id === id);
    // modo simples: o mínimo para acertar um look, sem grupos
    p.append(ctl({ id: "material", name: "Material", kind: "select", options: MATERIALS, value: state.material, onChange: (v) => { state.material = v; build(); } }));
    const simple = isHolo() ? ["galaxy.gain", "galaxy.turns", "galaxy.base", "comp.ink", "mask.mode"] : ["comp.foil", "comp.ink", "mask.luma", "mask.mode"];
    for (const id of simple) p.append(ownCtl(byId(id)));
    const light = SCENE_PARAMS.find((x) => x.id === "studio.preset"); if (light && usable(light)) p.append(kitCtl(light, true, "Iluminação"));
    return;
  }
  for (const t of TABS) { const b = document.createElement("button"); b.textContent = t.name; b.className = t.id === tab ? "on" : ""; b.onclick = () => { tab = t.id; renderPanel(); }; tabs.append(b); }
  const p = $("#panel"); p.innerHTML = "";
  if (!obj) return;
  if (tab === "material") {
    p.append(ctl({ id: "material", name: "Material holográfico", kind: "select", options: MATERIALS, value: state.material, onChange: (v) => { state.material = v; build(); } }));
    const reset = document.createElement("button"); reset.textContent = "Voltar ao padrão deste material"; reset.onclick = () => { delete state.mat[state.material]; build(); }; p.append(reset);
    if (isHolo()) {
      p.append(group("Galáxia holográfica (a tonalidade do padrão é a rede de difração)"));
      for (const c of GALAXY) p.append(ownCtl(c));
      p.append(group("Folha do foil tradicional (Prism do holospot)"));
      for (const q of MATERIAL_PARAMS.prism) if (usable(q) && !/^prism\.(pattern|grooveAngle|pitch|fan)$/.test(q.id)) p.append(kitCtl(q, false));
    } else {
      p.append(group(`${MATERIAL_PARAMS[state.material].length} parâmetros · passe o mouse para ver o que cada um faz`));
      for (const q of MATERIAL_PARAMS[state.material]) if (usable(q)) p.append(kitCtl(q, false));
    }
  } else if (tab === "comp") {
    for (const c of COMP) p.append(ownCtl(c));
  } else if (tab === "mask") {
    const of = (re) => MASK.filter((c) => re.test(c.id));
    p.append(group("Padrão do foil"));
    for (const c of of(/^mask\.pat/)) p.append(ownCtl(c));
    const pb = document.createElement("button"); pb.textContent = "Abrir padrão PNG (branco = foil)…";
    pb.onclick = () => pickImage(async (f) => {
      const r = await upload("maps", f); if (!r) return;
      await loadMaps(); state.own["mask.patSrc"] = r.url; applyOwn(); renderPanel(); status(`padrão salvo em ${r.file}`);
    });
    p.append(pb);
    p.append(group("Mapa de contraste (levels)"));
    for (const c of of(/^mask\.(luma|black|white|gamma|blur|lumaInv|show)$/)) p.append(ownCtl(c));
    p.append(group("Região"));
    for (const c of of(/^mask\.(mode|invert|text|soft)$/)) p.append(ownCtl(c));
    const b = document.createElement("button"); b.textContent = "Abrir máscara PNG (branco = foil)…";
    b.onclick = () => pickImage(async (f) => { U.tMask.value = await tex(URL.createObjectURL(f)); U.uHasMask.value = true; state.own["mask.mode"] = "custom"; applyOwn(); renderPanel(); });
    p.append(b, group("Janela da arte e caixa de texto (fração da carta)"));
    for (const c of of(/^mask\.(art|box)[LTRB]$/)) p.append(ownCtl(c));
  } else if (tab === "studio") {
    for (const q of sceneOf(/^studio\./)) p.append(kitCtl(q, true));
  } else if (tab === "surface") {
    p.append(group("Relevo"));
    const rb = document.createElement("button"); rb.textContent = "Abrir relevo PNG (branco = alto)…";
    rb.onclick = () => pickImage(async (f) => { const r = await upload("bumps", f); if (!r) return; state.scene["bump.map"] = r.url; applyScene(); renderPanel(); status(`relevo salvo em ${r.file} (leva um instante para aparecer)`); });
    p.append(rb);
    for (const q of sceneOf(/^bump\./)) p.append(kitCtl(q, true));
    p.append(group("Cartão")); for (const q of sceneOf(/^card\./)) p.append(kitCtl(q, true));
  } else if (tab === "display") {
    for (const q of sceneOf(/^(display|grain)\./)) p.append(kitCtl(q, true));
  } else if (tab === "view") {
    for (const c of VIEW) p.append(ownCtl(c));
  }
}

// Seletor de imagem: UM <input type="file"> preso à página e reaproveitado. Um input solto (fora do documento) pode ser
// descartado pelo navegador antes de o arquivo ser escolhido, e aí nada acontece. Zerar o valor deixa escolher o mesmo arquivo de novo.
const picker = document.createElement("input"); picker.type = "file"; picker.accept = "image/*"; picker.hidden = true; document.body.append(picker);
function pickImage(then) {
  picker.value = "";
  picker.onchange = () => { const f = picker.files[0]; if (f) Promise.resolve(then(f)).catch((e) => status(`não abriu a imagem: ${e.message ?? e}`, true)); };
  picker.click();
}
/** grava uma imagem na pasta do projeto (data/holofoil/<kind>) e devolve o endereço dela */
async function upload(kind, file) {
  const r = await (await fetch(`/api/maps?kind=${kind}&name=${encodeURIComponent(file.name)}`, { method: "POST", body: file })).json();
  if (r.error) { status(`não gravou a imagem: ${r.error}`, true); return null; }
  return r;
}
/** verso da carta: o padrão do projeto ou um PNG escolhido (lembrado neste navegador, fora dos looks) */
const BACK_DEFAULT = "/holofoil/back.png";            // opcional: ponha aqui o seu verso padrão
async function setBack(url, remember = true) {
  try {
    const t = await tex(url); U.tBack.value = t; U.uHasBack.value = true;
    if (remember) { if (url === BACK_DEFAULT) localStorage.removeItem("holofoil.back"); else localStorage.setItem("holofoil.back", url); }
    return true;
  } catch { if (url !== BACK_DEFAULT && remember) { localStorage.removeItem("holofoil.back"); return setBack(BACK_DEFAULT); } if (url === BACK_DEFAULT) U.uHasBack.value = false; return false; }
}
$("#backFile").onclick = () => pickImage(async (f) => {
  // 1) mostra na hora, direto do arquivo escolhido; 2) grava na pasta do projeto para lembrar da próxima vez
  if (!(await setBack(URL.createObjectURL(f), false))) return status(`o navegador não conseguiu ler "${f.name}" como imagem (use PNG, JPG ou WebP)`, true);
  $("#backShow").checked = true;
  let r = null;
  try { r = await upload("backs", f); } catch {}
  if (r) { localStorage.setItem("holofoil.back", r.url); status(`verso trocado e gravado em ${r.file}`); }
  else status("verso trocado só nesta sessão: o servidor não gravou o arquivo (feche e abra de novo o MTG HoloStudio)", true);
});
$("#backReset").onclick = async () => { await setBack(BACK_DEFAULT); status("verso padrão de volta"); };

/** padrões de foil disponíveis: os de base (holofoil/maps) e os que você abriu (data/holofoil/maps) */
async function loadMaps() {
  try {
    const list = await (await fetch("/api/maps")).json(), c = OWN.find((x) => x.id === "mask.patSrc");
    c.options = { "": "Nenhum (folha contínua)" };
    for (const m of list) c.options[m.url] = m.name;
  } catch {}
}

// ------------------------------------------------------------------ looks (presets)
// o look guarda TODOS os valores do Studio (tinta e foil, máscara, movimento, câmera), mexidos ou não:
// assim ele não muda se o padrão de algum controle mudar depois
// O look guarda TODAS as propriedades, mexidas ou não: cada parâmetro do material e da cena do holospot (luzes,
// relevo, cartão, imagem) com o valor em uso, e todos os do Studio. Assim o JSON descreve o look inteiro sozinho.
const portable = (v) => (typeof v === "string" && (v.startsWith(location.origin + "/holofoil/") || v.startsWith(location.origin + "/data/holofoil/")) ? v.slice(location.origin.length) : v);   // mapas do Studio: caminho relativo
function fullMaterial() {
  if (!obj) return state.mat[state.material] ?? {};
  const out = { ...(state.mat[state.material] ?? {}) };
  for (const q of MATERIAL_PARAMS[kitMaterial()]) { const v = obj.settings[q.id] ?? q.default; if (usable(q) && plain(v)) out[q.id] = portable(v); }
  return out;
}
function fullScene() {
  if (!holo || !obj) return state.scene;
  const out = { ...state.scene };
  for (const q of SCENE_PARAMS) { const v = holo.scene[q.id] ?? q.default; if (usable(q) && plain(v)) out[q.id] = portable(v); }
  return out;
}
const snapshot = () => ({ v: 1, material: state.material, mat: { ...state.mat, [state.material]: fullMaterial() }, scene: fullScene(), own: Object.fromEntries(OWN.filter((c) => !SESSION.test(c.id)).map((c) => [c.id, own(c.id)])), motion: state.motion, shots: structuredClone(state.shots) });
const SESSION = /^view\.(quality|zoom|panX|panY)$/;      // da máquina e do momento, não do look
const KEEP = /^(comp|mask)\./;
const CAMERA = /^motion\./;                              // o movimento é do vídeo, não do look
/**
 * Aplica um estado do Studio. Um look só muda a aparência (material, cena, tinta, máscara): o movimento e as tomadas
 * da câmera ficam como estão. camera: true traz também o movimento salvo (a sessão do navegador, o estado completo
 * de um vídeo).
 */
function restore(s, { camera = false } = {}) {
  state.material = s.material in MATERIALS ? s.material : "prism";
  const mine = Object.entries(state.own).filter(([k]) => SESSION.test(k) || (!camera && CAMERA.test(k)));
  state.mat = structuredClone(s.mat ?? {}); state.scene = structuredClone(s.scene ?? {}); state.own = structuredClone(s.own ?? {});
  if (camera) {
    state.motion = s.motion in MOTIONS ? s.motion : state.motion;
    if (Array.isArray(s.shots) && s.shots.length) state.shots = cleanShots(s.shots);
    for (const [k, v] of mine) if (!(k in state.own)) state.own[k] = v;     // qualidade e zoom são da máquina e do momento, não do look
  } else for (const [k, v] of mine) state.own[k] = v;                        // o movimento da câmera não é do look
  $("#motion").value = state.motion; renderMotion(); applyOwn();
  // o motor só é recriado quando a qualidade ou o modo das luzes muda (recriar a cada look acumula memória de vídeo);
  // nos outros casos troca-se a carta, e scene: true devolve a cena ao padrão antes dos ajustes do look
  if (holo && engineKey === `${own("view.quality")}|${own("view.lights")}`) build(true); else init();
}
let presets = [];
async function loadPresets(select) {
  const all = await (await fetch("/api/presets")).json();
  // O seu look com o mesmo nome de um de base toma o lugar dele no menu. Feito aqui também (não só no servidor):
  // com um servidor aberto desde antes dessa regra, o menu ficava com os dois, "Salvar" gravava o seu e o menu
  // voltava a apontar para o de base, então aplicar trazia os valores de fábrica, como se nada tivesse sido salvo.
  const mine = new Set(all.filter((p) => !p.base).map((p) => p.name));
  presets = all.filter((p) => !(p.base && mine.has(p.name)));
  const el = $("#preset"); el.innerHTML = "";
  presets.forEach((p, i) => { const o = document.createElement("option"); o.value = i; o.textContent = p.base ? `${p.name} (base)` : p.name; el.append(o); });
  if (select) { let k = presets.findIndex((p) => p.name === select && !p.base); if (k < 0) k = presets.findIndex((p) => p.name === select); if (k >= 0) el.value = k; }
  syncPresetButtons();
}
const currentPreset = () => presets[$("#preset").value];
function syncPresetButtons() {
  const p = currentPreset();
  $("#presetSave").textContent = p ? `Salvar em "${p.name}"` : "Salvar";
  $("#presetSave").disabled = !p;
  $("#presetDelete").disabled = !p || !!p.base;
  $("#presetDelete").textContent = "Remover"; delete $("#presetDelete").dataset.armed;
  $("#presetDelete").title = p?.base ? "Look de base: não dá para remover (salvar por cima cria a sua versão dele)" : "";
}
$("#preset").onchange = syncPresetButtons;
$("#presetLoad").onclick = () => {
  const p = currentPreset();
  if (!p) return;
  // "manter tinta, foil e máscara": o look troca material, luzes e relevo, e os seus ajustes de impressão ficam
  const keep = $("#presetKeep").checked ? Object.fromEntries(Object.entries(snapshot().own).filter(([k]) => KEEP.test(k))) : {};
  restore({ ...p.state, own: { ...(p.state.own ?? {}), ...keep } });
  localStorage.setItem("holofoil.preset", p.name);
  status(`look "${p.name}" aplicado${$("#presetKeep").checked ? ", mantendo a sua tinta, foil e máscara" : ""}`);
};
async function savePreset(name) {
  const snap = snapshot();
  const r = await fetch("/api/presets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, state: snap }) });
  if (!r.ok) return status("não salvou o look", true);
  await loadPresets(name); localStorage.setItem("holofoil.preset", name);
  status(`look "${name}" salvo em data/holofoil/presets com ${Object.keys(snap.mat[snap.material]).length + Object.keys(snap.scene).length + Object.keys(snap.own).length} propriedades`);
}
// Salvar: por cima do look selecionado no menu, sem digitar nada (num look de base, cria a sua versão dele, que passa a valer)
$("#presetSave").onclick = () => { const p = currentPreset(); if (p) savePreset(p.name); };
// Salvar como: look novo, com o nome digitado
$("#presetSaveAs").onclick = () => { const name = $("#presetName").value.trim(); if (!name) return status("dê um nome ao look novo", true); $("#presetName").value = ""; savePreset(name); };
$("#presetName").addEventListener("keydown", (e) => e.key === "Enter" && $("#presetSaveAs").click());
// Remover: pede um segundo clique para confirmar
$("#presetDelete").onclick = async (e) => {
  const p = currentPreset(), b = e.currentTarget;
  if (!p || p.base) return;
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Confirmar remoção"; setTimeout(() => { if (b.dataset.armed) syncPresetButtons(); }, 4000); return; }
  const r = await fetch(`/api/presets?name=${encodeURIComponent(p.name)}`, { method: "DELETE" });
  if (!r.ok) return status("não removeu o look", true);
  if (localStorage.getItem("holofoil.preset") === p.name) localStorage.removeItem("holofoil.preset");
  await loadPresets(p.name);                                           // se era a sua versão de um look de base, o de base volta ao menu
  status(`look "${p.name}" removido`);
};
$("#stateCopy").onclick = async () => { await navigator.clipboard.writeText(JSON.stringify(snapshot(), null, 2)); status("JSON do look copiado"); };
$("#resetAll").onclick = () => restore({ material: state.material });
$("#blobPaste").onclick = async () => {
  let text = "";
  try { text = await navigator.clipboard.readText(); } catch { text = prompt("Cole aqui o JSON do Copy settings do holo.spot:") ?? ""; }
  try {
    const b = JSON.parse(text);
    if (b.v === 1 && b.own) return restore(b);                          // um look do próprio Studio
    if (!b.values || !b.material) throw new Error("não parece um Copy settings do holo.spot");
    if (!(b.material in MATERIALS)) throw new Error(`o material "${b.material}" não vira carta foil aqui`);
    const mat = {}, sc = {};
    for (const [k, v] of Object.entries(b.values)) (k.startsWith(`${b.material}.`) ? mat : sc)[k] = v;
    for (const k of Object.keys(BASE_SCENE)) delete sc[k];
    restore({ material: b.material, mat: { [b.material]: mat }, scene: sc, own: state.own, motion: state.motion });
    status(`look do holo.spot aplicado (${MATERIALS[b.material]})`);
  } catch (e) { status(`colar: ${e.message}`, true); }
};

// ------------------------------------------------------------------ movimento (UI)
function renderMotion() {
  const box = $("#motionCtl"); box.innerHTML = "";
  if (state.motion === "tomadas") return renderShots(box);
  for (const c of MOTION) box.append(ownCtl(c));
}
/** Editor das tomadas: tipo, duração e aproximação de cada uma, na ordem do vídeo */
function renderShots(box) {
  const changed = () => { $("#expDur").value = shotsTotal().toFixed(1); renderMotion(); };
  state.shots.forEach((x, i) => {
    const row = document.createElement("div"); row.className = "row shot";
    const sel = document.createElement("select");
    for (const [k, d] of Object.entries(SHOTS)) { const o = document.createElement("option"); o.value = k; o.textContent = d.name; sel.append(o); }
    sel.value = x.tipo; sel.title = "Tomada";
    sel.onchange = () => { x.tipo = sel.value; x.zoom = SHOTS[x.tipo].zoom; changed(); };
    const num = (v, min, max, step, title, set) => { const n = document.createElement("input"); n.type = "number"; n.min = min; n.max = max; n.step = step; n.value = v; n.title = title; n.onchange = () => { set(Number(n.value)); state.shots = cleanShots(state.shots); changed(); }; return n; };
    const up = document.createElement("button"); up.textContent = "↑"; up.title = "Subir"; up.disabled = i === 0;
    up.onclick = () => { [state.shots[i - 1], state.shots[i]] = [state.shots[i], state.shots[i - 1]]; changed(); };
    const rm = document.createElement("button"); rm.textContent = "×"; rm.title = "Tirar"; rm.disabled = state.shots.length < 2;
    rm.onclick = () => { state.shots.splice(i, 1); changed(); };
    row.append(sel, num(x.dur, 0.3, 12, 0.1, "Duração (s)", (v) => (x.dur = v)), num(x.zoom, 0.5, 4, 0.1, "Aproximação (×)", (v) => (x.zoom = v)), up, rm);
    box.append(row);
  });
  const foot = document.createElement("div"); foot.className = "row";
  const add = document.createElement("button"); add.textContent = "+ Tomada";
  add.onclick = () => { if (state.shots.length < 24) state.shots.push({ tipo: "inteira", dur: SHOTS.inteira.dur, zoom: 1 }); changed(); };
  const tot = document.createElement("span"); tot.className = "hint"; tot.textContent = `${state.shots.length} tomadas · ${shotsTotal().toFixed(1)} s`;
  foot.append(add, tot);
  box.append(foot);
  // aberto por outra ferramenta com um endereço de retorno (o painel do Combalista): manda as tomadas de volta
  if (RETORNO) {
    const send = document.createElement("button"); send.className = "primary"; send.textContent = "Enviar look e tomadas de volta";
    send.title = "Grava de onde o Studio foi aberto o estado inteiro desta tela: o look (material, luzes, tinta, máscara), as tomadas, a versão da carta escolhida aqui e o fundo";
    send.onclick = async () => {
      try {
        const r = await fetch(RETORNO, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shots: state.shots, look: currentPreset()?.name ?? null, state: snapshot(), carta: cardSource(), fundo: $("#expBg").value }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
        status(j.message || "tomadas enviadas");
      } catch (e) { status(`enviar: ${e.message}`, true); }
    };
    const r2 = document.createElement("div"); r2.className = "row"; r2.append(send); box.append(r2);
  }
}
for (const [v, l] of Object.entries(MOTIONS)) { const o = document.createElement("option"); o.value = v; o.textContent = l; $("#motion").append(o); }
$("#motion").value = state.motion;
$("#motion").onchange = (e) => { state.motion = e.target.value; renderMotion(); if (state.motion === "tomadas") $("#expDur").value = shotsTotal().toFixed(1); };
for (const [v, l] of Object.entries(SIZES)) { const o = document.createElement("option"); o.value = v; o.textContent = l; $("#expSize").append(o); }
$("#expSize").onchange = resize;

// ------------------------------------------------------------------ exportar
const slug = () => (state.cardLabel ?? "carta").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\.[a-z]+$/i, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 48) || "carta";
const blobOf = () => new Promise((ok) => out.toBlob(ok, "image/png"));
$("#expStill").onclick = async () => { const r = await renderStill(); $("#expInfo").textContent = `PNG salvo: ${r.file}`; };
/**
 * Renderiza um clipe determinístico: quadro a quadro, sem relógio. Com a duração igual ao período do movimento,
 * o clipe fecha em laço. Devolve a resposta do servidor: { dir, file?, error? } (caminhos relativos à pasta).
 */
async function renderClip({ duration = 4, fps = 30, format = "webm", background = "transparent", onFrame } = {}) {
  if (busy) throw new Error("a render is already running");
  const n = Math.max(1, Math.round(fps * duration));
  busy = true;
  try {
    await holo.ready();
    $("#expBg").value = background === "transparent" ? "transparent" : "bg";
    const { job } = await (await fetch(`/api/export/start?name=${slug()}-${state.material}`, { method: "POST" })).json();
    for (let i = 0; i < n; i++) {
      draw(i / fps, { dt: 1 / fps });
      const r = await fetch(`/api/export/frame?job=${job}&i=${i}`, { method: "POST", body: await blobOf() });
      if (!r.ok) throw new Error("o servidor recusou um quadro");
      onFrame?.(i + 1, n);
    }
    onFrame?.(n, n, "encode");
    return await (await fetch(`/api/export/finish?job=${job}&fps=${fps}&fmt=${format}&alpha=${background === "transparent" ? 1 : 0}`, { method: "POST" })).json();
  } finally { busy = false; last = performance.now(); }
}
async function renderStill(t = clock) {
  draw(t); draw(t);
  return await (await fetch(`/api/still?name=${slug()}-${state.material}`, { method: "POST", body: await blobOf() })).json();
}
$("#expVideo").onclick = async () => {
  if (busy) return;
  $("#expVideo").disabled = true;
  try {
    const r = await renderClip({
      duration: Number($("#expDur").value) || 4, fps: Number($("#expFps").value) || 30, format: $("#expFmt").value,
      background: $("#expBg").value === "transparent" ? "transparent" : "bg",
      onFrame: (i, n, phase) => { $("#expInfo").textContent = phase ? "codificando…" : `quadro ${i} de ${n}`; },
    });
    $("#expInfo").textContent = r.error ? `Quadros em ${r.dir}. ${r.error}` : `Pronto: ${r.file ?? r.dir}`;
  } catch (e) { $("#expInfo").textContent = `Falhou: ${e.message}`; }
  $("#expVideo").disabled = false;
};

// ------------------------------------------------------------------ logo do criador (holofoil/brand/ggcrafts.svg|png|webp)
{
  const img = $("#makerLogo"), files = ["/holofoil/brand/ggcrafts.svg", "/holofoil/brand/ggcrafts.png", "/holofoil/brand/ggcrafts.webp"];
  let k = 0;
  img.onload = () => { img.hidden = false; $(".maker .wordmark").hidden = true; };
  img.onerror = () => { if (++k < files.length) img.src = files[k]; };        // sem arquivo: fica o nome em texto
  img.src = files[0];
}

// ------------------------------------------------------------------ automação (window.holostudio e parâmetros na URL)
/** Tamanho do quadro exportado (a automação pode pedir o vertical dos shorts) */
function setSize(wh) {
  if (!AUTO_SIZES[wh]) throw new Error(`size "${wh}" is not supported: ${Object.keys(AUTO_SIZES).join(", ")}`);
  const sel = $("#expSize");
  if (![...sel.options].some((o) => o.value === wh)) { const o = document.createElement("option"); o.value = wh; o.textContent = AUTO_SIZES[wh]; sel.append(o); }
  sel.value = wh; resize();
}
function setShots(list) {
  const clean = cleanShots(typeof list === "string" ? JSON.parse(list) : list);
  if (!clean.length) throw new Error(`no valid shots. Types: ${Object.keys(SHOTS).join(", ")}`);
  state.shots = clean; state.motion = "tomadas"; $("#motion").value = "tomadas"; renderMotion();
  return shotsTotal();
}
// Para agentes e scripts (render.mjs, o Skill e o Agent do repositório): tudo o que a interface faz, por código.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle() { await wait(300); await Promise.all(objs.map((o) => o.ready)); await holo.ready(); await wait(200); }

/**
 * Carrega uma carta do Scryfall pelo nome (inglês ou português, com tolerância a erro) e, se quiser, pela edição
 * (código da coleção, ex. "eoe"), pelo número de colecionador e pelo idioma. Ou uma imagem própria: { image }.
 */
async function loadCard({ name, set, number, lang, face = 0, image } = {}) {
  if (image) {
    // sem a arte, a carta sairia em branco: melhor falhar e avisar quem pediu
    if (!(await setArt(image, decodeURIComponent(String(image).split("/").pop())))) throw new Error(`could not load the image "${image}"`);
    return { image };
  }
  if (!name) throw new Error("loadCard: missing the card name");
  // nome oficial em inglês: busca exata; senão a sugestão mais parecida (aceita português e erros de digitação)
  let en = null;
  const exact = await api(`/cards/named?exact=${encodeURIComponent(name)}`).catch(() => null);
  if (exact?.name) en = exact.name;
  else { const sg = (await suggest(name))[0]; if (!sg) throw new Error(`no card similar to "${name}"`); en = sg.name; }
  const parts = [`!"${en}"`, "game:paper"];
  if (set) parts.push(`set:${String(set).toLowerCase()}`);
  if (number) parts.push(`cn:"${number}"`);
  const q = (langPart) => api(`/cards/search?q=${encodeURIComponent([...parts, langPart].join(" "))}&unique=prints&include_multilingual=true&include_extras=true&order=released&dir=desc`);
  let r = await q(lang && lang !== "any" ? `lang:${lang}` : lang === "any" ? "lang:any" : "lang:en");   // sem idioma: inglês; se não houver, qualquer um
  if (!(r.data ?? []).length && !lang) r = await q("lang:any");
  const list = (r.data ?? []).filter((c) => imgOf(c));
  if (!list.length) throw new Error(`"${en}"${set ? ` in set ${set}` : ""}${number ? ` #${number}` : ""}: no printing with an image`);
  // espelha na interface: nome, menu de versões e frente/verso
  picked = { name: en, shown: name }; $("#cardName").value = name;
  prints = list; const sel = $("#cardPrint"); sel.innerHTML = "";
  prints.forEach((c, i) => { const o = document.createElement("option"); o.value = i; o.textContent = printLabel(c); sel.append(o); });
  sel.disabled = false; sel.value = "0";
  const back = face === "back" || face === 1 || face === "1";
  $("#cardFace").value = back ? "1" : "0";
  await usePrint();
  const c = prints[0];
  return { name: c.name, printedName: ptName(c) ?? null, set: c.set, setName: c.set_name, number: c.collector_number, lang: c.lang, image: imgOf(c, back ? 1 : 0), scryfall: c.scryfall_uri };
}
/** Aplica um look pelo nome (os de base e os seus) ou um estado completo (o JSON de "Copiar JSON") */
function applyLook(look) {
  if (look && typeof look === "object") { restore(look.state ?? look); return look.name ?? "custom"; }
  const want = norm(look);
  const p = presets.find((x) => norm(x.name) === want || norm(toEnglish(x.name)) === want) ?? presets.find((x) => norm(x.name).includes(want) || norm(toEnglish(x.name)).includes(want));
  if (!p) throw new Error(`look "${look}" does not exist. Looks: ${presets.map((x) => `${x.name}${toEnglish(x.name) !== x.name ? ` (${toEnglish(x.name)})` : ""}`).join(", ")}`);
  restore(p.state); return p.name;
}
/** Muda qualquer parâmetro por id: do Studio (comp., mask., galaxy., motion., view.), da cena (studio., bump., card., display.…) ou do material (prism., vortex.…) */
function setParams(values = {}) {
  let rebuild = false;
  for (const [k, v] of Object.entries(values)) {
    if (k === "material") { state.material = v; rebuild = true; }
    else if (OWN.some((c) => c.id === k)) state.own[k] = v;
    else if (SCENE_PARAMS.some((q) => q.id === k)) state.scene[k] = v;
    else { (state.mat[state.material] ??= {})[k] = v; for (const o of objs) o.set({ [k]: v }); }
  }
  if (rebuild) build(); else { applyScene(); applyOwn(); }
  renderPanel();
}
function setMotion(type, { amplitude, period, tiltX, tiltY } = {}) {
  if (!(type in MOTIONS)) throw new Error(`motion "${type}" does not exist: ${Object.keys(MOTIONS).join(", ")}`);
  state.motion = type; $("#motion").value = type;
  if (amplitude != null) state.own["motion.amp"] = Number(amplitude);
  if (period != null) state.own["motion.period"] = Number(period);
  if (tiltX != null) state.own["motion.rx"] = Number(tiltX);
  if (tiltY != null) state.own["motion.ry"] = Number(tiltY);
  renderMotion();
}
window.holostudio = {
  version: 1,
  loadCard, applyLook, setParams, setMotion, setShots, setSize,
  shotTypes: () => Object.fromEntries(Object.entries(SHOTS).map(([k, d]) => [k, { name: d.name, dur: d.dur, zoom: d.zoom }])),
  setBack: (url) => setBack(url),
  showBack: (on = true) => { $("#backShow").checked = !!on; },
  render: async (o = {}) => { await settle(); return renderClip(o); },
  still: async (t) => { await settle(); return renderStill(t ?? 0); },
  looks: () => presets.map((p) => ({ name: p.name, base: !!p.base, material: p.state?.material })),
  materials: () => ({ ...MATERIALS }), motions: () => Object.keys(MOTIONS),
  params: () => ({ studio: OWN.map((c) => c.id), scene: SCENE_PARAMS.map((q) => q.id), material: (MATERIAL_PARAMS[kitMaterial()] ?? []).map((q) => q.id) }),
  snapshot, ready: settle,
};

/** O estado vem no próprio parâmetro (JSON) ou num endereço deste servidor que devolve o JSON */
async function readState(v) {
  const text = v.trim();
  if (text.startsWith("{")) return JSON.parse(text);
  if (!/^\/[\w/.%?=&-]+$/.test(text)) throw new Error("estado: use o JSON do Studio ou um endereço deste servidor");
  const r = await fetch(text);
  if (!r.ok) throw new Error(`estado: HTTP ${r.status}`);
  const j = await r.json();
  return j.state ?? j.estado ?? j;
}
/** Parâmetros na URL: abre, monta e (com render=…) renderiza sozinho. O resultado fica em window.holostudioResult. */
async function runFromUrl(q) {
  const out = { ok: false };
  try {
    // estado: o JSON completo do Studio (o de "Copiar JSON", ou o devolvido ao painel), com o look e as tomadas
    if (q.has("estado")) { restore(await readState(q.get("estado")), { camera: true }); out.state = true; }
    if (q.has("look")) out.look = applyLook(q.get("look"));
    const params = {};
    for (const [k, v] of q) if (k.startsWith("p.")) params[k.slice(2)] = v === "true" ? true : v === "false" ? false : v !== "" && !isNaN(Number(v)) ? Number(v) : v;
    if (q.has("material")) params.material = q.get("material");
    if (Object.keys(params).length) setParams(params);
    if (q.has("motion") || q.has("amp") || q.has("period")) setMotion(q.get("motion") ?? state.motion, { amplitude: q.get("amp"), period: q.get("period"), tiltX: q.get("tiltx"), tiltY: q.get("tilty") });
    if (q.has("zoom")) { state.own["view.zoom"] = Number(q.get("zoom")); frameCamera(); }
    if (q.has("size")) setSize(q.get("size"));
    if (q.has("bg")) $("#expBg").value = q.get("bg") === "transparent" ? "transparent" : "bg";
    if (q.has("shots")) out.shotsDuration = setShots(q.get("shots"));
    if (q.has("back")) await setBack(q.get("back"));
    if (q.has("card") || q.has("image")) out.card = await loadCard({ name: q.get("card"), set: q.get("set"), number: q.get("number"), lang: q.get("lang"), face: q.get("face"), image: q.get("image") });
    if (q.get("show") === "back") $("#backShow").checked = true;
    const r = q.get("render");
    if (r === "still") out.result = await holostudio.still(Number(q.get("t") ?? 0));
    else if (r) out.result = await holostudio.render({ duration: Number(q.get("duration") ?? 4), fps: Number(q.get("fps") ?? 30), format: ["mov", "webm", "mp4", "png"].includes(r) ? r : (q.get("format") ?? "webm"), background: q.get("bg") ?? "transparent" });
    out.ok = !out.result?.error;
    if (out.result?.error) out.error = out.result.error;
  } catch (e) { out.error = String(e?.message ?? e); }
  window.holostudioResult = out;
  if (q.has("job")) await fetch(`/api/automation/result?id=${encodeURIComponent(q.get("job"))}`, { method: "POST", body: JSON.stringify(out) }).catch(() => {});
  document.title = out.ok ? "HOLOSTUDIO DONE" : "HOLOSTUDIO ERROR";
  status(out.ok ? `automação: ${out.result?.file ?? out.result?.dir ?? "pronto"}` : `automação: ${out.error}`, !out.ok);
}

// ------------------------------------------------------------------ início
window.__studio = { scene: () => holo.scene, info: () => holo.info, state, snapshot, restore, setArt, draw, ready: async () => { await obj?.ready; return true; } };
renderMotion(); applyOwn();
setBack(localStorage.getItem("holofoil.back") || BACK_DEFAULT);
$("#presetKeep").checked = false;                                   // o navegador pode devolver a caixa marcada ao recarregar
await loadMaps();
await loadPresets(localStorage.getItem("holofoil.preset"));
// volta ao que estava na tela da última vez (ajustes ainda não salvos incluídos); senão, o primeiro look
let saved = null;
try { saved = JSON.parse(localStorage.getItem("holofoil.session") ?? "null"); } catch {}
const urlQ = new URLSearchParams(location.search);
const automated = ["card", "image", "look", "render", "material", "shots", "estado"].some((k) => urlQ.has(k));
// automação parte sempre do mesmo lugar (o primeiro look), nunca da sessão salva no navegador
if (saved?.v === 1 && !automated) restore(saved, { camera: true }); else if (presets[0]) restore(presets[0].state); else init();
let lastSession = "";
setInterval(() => { const j = JSON.stringify(snapshot()); if (j !== lastSession) { lastSession = j; try { localStorage.setItem("holofoil.session", j); } catch {} } }, 1000);
requestAnimationFrame(loop);
if (automated) settle().then(() => runFromUrl(urlQ));
