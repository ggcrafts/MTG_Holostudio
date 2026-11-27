// ============================================================
//  Idioma da interface: português (o texto do código) ou inglês.
//
//  A interface é escrita em português. Em inglês, este módulo troca o texto na própria página: cada nó de texto
//  e os atributos placeholder/title passam por um dicionário (frases exatas) e por alguns padrões (frases com
//  valores, como mensagens de status). Um MutationObserver traduz o que o app.js escreve depois. O texto original
//  fica guardado por nó, então voltar ao português restaura tudo. Nomes de cartas e de looks seus não mudam.
// ============================================================

const EN = {
  // topo e página
  "MTG HoloStudio": "MTG HoloStudio",
  "cartas holofoil · motor holo.spot": "holofoil cards · holo.spot engine",
  "criado por": "created by",
  "carregando o holospot…": "loading holospot…",
  // carta
  "Carta": "Card",
  "Nome da carta, em português ou inglês": "Card name, in English or Portuguese",
  "Versões: escolha uma carta": "Printings: pick a card",
  "Idioma das versões listadas": "Language of the listed printings",
  "PT e EN": "PT and EN", "Só português": "Portuguese only", "Só inglês": "English only", "Todos os idiomas": "All languages",
  "Frente": "Front", "Verso": "Back",
  "Abrir imagem…": "Open image…", "Do projeto…": "From project…", "Da pasta cards…": "From cards folder…",
  "Verso: abrir PNG…": "Back: open PNG…", "Verso padrão": "Default back", "mostrar o verso": "show the back",
  "Arraste uma imagem de carta para a janela, ou busque pelo nome.": "Drop a card image on the window, or search by name.",
  "buscando versões…": "searching printings…", "Nenhuma versão com imagem": "No printing with an image",
  "Versões: falhou a busca": "Printings: search failed", "Nenhuma carta parecida.": "No similar card.",
  "Nenhuma imagem de carta em public/jobs ainda.": "No card images in public/jobs yet.",
  "Nenhuma imagem na pasta cards/ ainda.": "No images in the cards/ folder yet.",
  "sem borda": "borderless", "full art": "full art", "arte estendida": "extended art", "etched": "etched",
  "invertida": "inverted", "sem texto": "textless", "moldura antiga": "old frame", "futurista": "future frame",
  "promo": "promo", "só foil": "foil only", "showcase": "showcase",
  // look
  "Look": "Look", "Aplicar": "Apply", "manter tinta, foil e máscara": "keep ink, foil and mask",
  "Ao aplicar um look, troca material, luzes e relevo e mantém os seus ajustes das abas Tinta e foil e Máscara":
    "When applying a look, change material, lights and relief but keep your Ink and foil and Mask settings",
  "Salvar": "Save", "Remover": "Remove", "Confirmar remoção": "Confirm removal",
  "Nome do look novo": "New look name", "Salvar como": "Save as",
  "Cola o JSON do botão </> (Copy settings) do holo.spot": "Pastes the JSON from holo.spot's </> (Copy settings) button",
  "Colar do holo.spot": "Paste from holo.spot", "Copiar JSON": "Copy JSON", "Zerar": "Reset",
  "Look de base: não dá para remover (salvar por cima cria a sua versão dele)": "Base look: can't be removed (saving over it creates your own version)",
  "Foil clássico": "Classic foil", "Foil só na arte": "Foil on art only", "Arco-íris concêntrico": "Concentric rainbow",
  "Galáxia (glitter)": "Galaxy (glitter)", "Gelo rachado": "Cracked ice", "Pontilhado": "Dotted", "Vórtice dourado": "Golden vortex",
  // movimento
  "Movimento": "Motion", "animar": "animate",
  "Manual (mouse)": "Manual (mouse)", "Balanço": "Sway", "Varredura": "Sweep", "Órbita": "Orbit", "Giro 360°": "360° spin",
  "Tomadas (câmera)": "Shots (camera)", "Macro no nome": "Macro on the name", "Macro na arte": "Macro on the art", "Macro no texto": "Macro on the text",
  "Macro no artista": "Macro on the artist", "Passada no foil": "Foil pass", "Afastar e girar": "Pull back and spin", "Passeio dramático": "Dramatic fly-over",
  "Carta inteira": "Whole card", "Tomada": "Shot", "Duração (s)": "Duration (s)", "Aproximação (×)": "Zoom (×)", "Subir": "Move up", "Tirar": "Remove",
  "+ Tomada": "+ Shot", "Enviar look e tomadas de volta": "Send look and shots back", "Grava de onde o Studio foi aberto o estado inteiro desta tela: o look (material, luzes, tinta, máscara), as tomadas, a versão da carta escolhida aqui e o fundo": "Saves the whole state of this screen where the Studio was opened from: the look (material, lights, ink, mask), the shots, the card printing picked here and the background",
  "tomadas enviadas": "shots sent",
  "estado: use o JSON do Studio ou um endereço deste servidor": "estado: use the Studio JSON or an address on this server",
  "Amplitude": "Amplitude", "Período": "Period", "Inclinação base X": "Base tilt X", "Inclinação base Y": "Base tilt Y",
  // exportar
  "Exportar": "Export", "Fundo transparente": "Transparent background", "Com o fundo": "With background",
  "Duração": "Duration", "MOV ProRes 4444 (alpha, After Effects)": "MOV ProRes 4444 (alpha, After Effects)",
  "WebM VP9 (alpha, HyperFrames)": "WebM VP9 (alpha, HyperFrames)", "Só a sequência PNG": "PNG sequence only",
  "PNG deste quadro": "PNG of this frame", "Renderizar clipe": "Render clip", "codificando…": "encoding…",
  // zoom e status
  "Afastar": "Zoom out", "Aproximar": "Zoom in", "Voltar a 100% e centralizar": "Back to 100% and centre",
  "JSON do look copiado": "Look JSON copied", "dê um nome ao look novo": "name the new look",
  "não salvou o look": "the look was not saved", "não removeu o look": "the look was not removed",
  "verso padrão de volta": "default back restored", "o servidor recusou um quadro": "the server refused a frame",
  "não parece um Copy settings do holo.spot": "this doesn't look like a holo.spot Copy settings",
  "Cole aqui o JSON do Copy settings do holo.spot:": "Paste the holo.spot Copy settings JSON here:",
  // painel
  "Avançado: ligado": "Advanced: on", "Avançado: desligado": "Advanced: off",
  "Mostra todos os parâmetros do holospot e do Studio, em abas": "Shows every holospot and Studio parameter, in tabs",
  "Material": "Material", "Tinta e foil": "Ink and foil", "Máscara": "Mask", "Luzes": "Lights", "Superfície": "Surface",
  "Imagem": "Image", "Câmera": "Camera", "Relevo": "Relief", "Cartão": "Card stock", "Iluminação": "Lighting",
  "Material holográfico": "Holographic material", "Voltar ao padrão deste material": "Reset this material",
  "Galaxy (holográfico pela tonalidade)": "Galaxy (holographic by tone)", "Surge (holográfico em linhas)": "Surge (holographic lines)",
  "Prism Rainbow (foil clássico)": "Prism Rainbow (classic foil)", "Gold Shatter (gelo rachado)": "Gold Shatter (cracked ice)",
  "Nebula Glitter (galáxia)": "Nebula Glitter (galaxy)", "Sky Sparkle (pontilhado)": "Sky Sparkle (dotted)",
  "Gilded Vortex (espirais)": "Gilded Vortex (spirals)", "Volume Hologram (imagem 3D)": "Volume Hologram (3D image)",
  // tinta e foil
  "Intensidade do foil": "Foil intensity", "Densidade da tinta": "Ink density", "Luz difusa na arte": "Diffuse light on art",
  "Verniz (reflexo por cima)": "Varnish (top reflection)", "Brilho da área sem foil": "Brightness without foil",
  "Base branca geral": "Overall white base",
  // máscara
  "Onde vai o foil": "Where the foil goes", "Carta inteira": "Whole card", "Só a arte": "Art only", "Só a moldura": "Frame only",
  "Máscara própria (PNG)": "Custom mask (PNG)", "Inverter máscara": "Invert mask", "Caixa de texto opaca": "Opaque text box",
  "Suavidade da borda": "Edge softness", "Padrão do foil": "Foil pattern", "Nenhum (folha contínua)": "None (continuous foil)",
  "Galaxy (confete)": "Galaxy (confetti)", "Galaxy": "Galaxy", "Surge": "Surge",
  "Padrão: intensidade": "Pattern: intensity", "Padrão: ponto preto": "Pattern: black point", "Padrão: ponto branco": "Pattern: white point",
  "Inverter o padrão": "Invert pattern", "Canais do padrão": "Pattern channels",
  "Luminosidade: máscara e tonalidade": "Luminance: mask and tone", "R = máscara, G = tonalidade": "R = mask, G = tone",
  "Mapa de contraste (levels)": "Contrast map (levels)", "Mapa de contraste da arte": "Art contrast map",
  "Levels: ponto preto": "Levels: black point", "Levels: ponto branco": "Levels: white point", "Levels: meios-tons (gama)": "Levels: midtones (gamma)",
  "Suavizar o mapa": "Soften map", "Inverter o mapa": "Invert map", "Ver o mapa (preto e branco)": "View map (black and white)",
  "Região": "Region", "Abrir máscara PNG (branco = foil)…": "Open mask PNG (white = foil)…",
  "Abrir padrão PNG (branco = foil)…": "Open pattern PNG (white = foil)…", "Abrir relevo PNG (branco = alto)…": "Open relief PNG (white = high)…",
  "Janela da arte e caixa de texto (fração da carta)": "Art window and text box (fraction of card)",
  "Arte: esquerda": "Art: left", "Arte: topo": "Art: top", "Arte: direita": "Art: right", "Arte: base": "Art: bottom",
  "Texto: esquerda": "Text: left", "Texto: topo": "Text: top", "Texto: direita": "Text: right", "Texto: base": "Text: bottom",
  // galaxy / surge
  "Galáxia holográfica (a tonalidade do padrão é a rede de difração)": "Holographic galaxy (the pattern's tone is the diffraction grating)",
  "Folha do foil tradicional (Prism do holospot)": "Traditional foil layer (holospot Prism)",
  "Holográfico: intensidade": "Holographic: intensity", "Giro pela tonalidade": "Rotation by tone",
  "Divisão de cor pela tonalidade": "Colour split by tone", "Passo médio da ranhura": "Mean groove pitch",
  "Ângulo base da ranhura": "Base groove angle", "Abertura do brilho": "Sparkle spread", "Reflexo prateado": "Silver reflection",
  "Foil tradicional (pela arte)": "Traditional foil (by art)", "Foil tradicional: ângulo": "Traditional foil: angle",
  "Ruído estelar": "Star noise", "Ruído estelar: tamanho": "Star noise: size", "Ruído estelar: densidade": "Star noise: density",
  "Ruído na tonalidade": "Tone noise", "Suavizar a tonalidade": "Soften tone", "Ver a tonalidade como cor": "View tone as colour",
  // câmera
  "Zoom": "Zoom", "Deslocamento X": "Offset X", "Deslocamento Y": "Offset Y", "Lente (campo de visão)": "Lens (field of view)",
  "Cor do fundo": "Background colour", "Qualidade do holospot": "holospot quality", "Baixa": "Low", "Média": "Medium", "Alta": "High",
  "Luzes": "Lights", "Acompanham a câmera": "Follow the camera", "Paradas no mundo": "Fixed in the world",
};

// frases com valores (mensagens de status, rótulos montados)
const FX = { "sem borda": "borderless", "arte estendida": "extended art", "invertida": "inverted", "sem texto": "textless", "moldura antiga": "old frame", "futurista": "future frame", "só foil": "foil only" };
const PATTERNS = [
  [/^(\d+) tomadas · ([\d.]+) s$/, (m) => `${m[1]} shots · ${m[2]} s`],
  [/^enviar: (.+)$/, (m) => `send: ${m[1]}`],
  [/^(.+) \(base\)$/, (m) => `${tr(m[1])} (base)`],
  [/^Salvar em "(.+)"$/, (m) => `Save to "${tr(m[1])}"`],
  [/^(.+) · qualidade (.+)$/, (m) => `${tr(m[1])} · quality ${m[2]}`],
  [/^compilando (.+)…$/, (m) => `compiling ${tr(m[1])}…`],
  [/^(\d+) parâmetros · passe o mouse para ver o que cada um faz$/, (m) => `${m[1]} parameters`],
  [/^(\d+) versões de (.+)$/, (m) => `${m[1]} printings of ${m[2]}`],
  [/^buscando as versões de "(.+)"…$/, (m) => `searching printings of "${m[1]}"…`],
  [/^"(.+)": nenhuma versão com imagem$/, (m) => `"${m[1]}": no printing with an image`],
  [/^Scryfall não respondeu \((.*)\)\.$/, (m) => `Scryfall did not respond (${m[1]}).`],
  [/^look "(.+)" aplicado, mantendo a sua tinta, foil e máscara$/, (m) => `look "${tr(m[1])}" applied, keeping your ink, foil and mask`],
  [/^look "(.+)" aplicado$/, (m) => `look "${tr(m[1])}" applied`],
  [/^look "(.+)" removido$/, (m) => `look "${tr(m[1])}" removed`],
  [/^look "(.+)" salvo em (\S+) com (\d+) propriedades$/, (m) => `look "${tr(m[1])}" saved to ${m[2]} with ${m[3]} properties`],
  [/^look do holo\.spot aplicado \((.+)\)$/, (m) => `holo.spot look applied (${tr(m[1])})`],
  [/^o material "(.+)" não vira carta foil aqui$/, (m) => `material "${m[1]}" can't be a foil card here`],
  [/^colar: (.+)$/, (m) => `paste: ${tr(m[1])}`],
  [/^erro no holospot: (.+)$/, (m) => `holospot error: ${m[1]}`],
  [/^PNG salvo: (.+)$/, (m) => `PNG saved: ${m[1]}`],
  [/^Pronto: (.+)$/, (m) => `Done: ${m[1]}`],
  [/^Falhou: (.+)$/, (m) => `Failed: ${m[1]}`],
  [/^Quadros em (\S+)\. (.*)$/, (m) => `Frames in ${m[1]}. ${m[2]}`],
  [/^quadro (\d+) de (\d+)$/, (m) => `frame ${m[1]} of ${m[2]}`],
  [/^padrão salvo em (.+)$/, (m) => `pattern saved to ${m[1]}`],
  [/^padrão do foil: (.+)$/, (m) => `foil pattern: ${m[1]}`],
  [/^relevo salvo em (.+) \(leva um instante para aparecer\)$/, (m) => `relief saved to ${m[1]} (takes a moment to appear)`],
  [/^verso trocado e gravado em (.+)$/, (m) => `back changed and saved to ${m[1]}`],
  [/^verso trocado só nesta sessão: .*$/, () => "back changed for this session only: the server did not save the file (close and reopen the Studio)"],
  [/^o navegador não conseguiu ler "(.+)" como imagem \(use PNG, JPG ou WebP\)$/, (m) => `the browser could not read "${m[1]}" as an image (use PNG, JPG or WebP)`],
  [/^não abriu a imagem: (.+)$/, (m) => `could not open the image: ${m[1]}`],
  [/^não gravou a imagem: (.+)$/, (m) => `could not save the image: ${m[1]}`],
  [/^não abriu (.+)$/, (m) => `could not open ${m[1]}`],
  [/^Scryfall: (.+)$/, (m) => `Scryfall: ${m[1]}`],
  // versões no menu: "EOE #382 · Edge of Eternities · 2025 · EN · sem borda, só foil"
  [/^([A-Z0-9]+ #\S+ · .+ · \d{4} · [A-Z]+) · (.+)$/, (m) => `${m[1]} · ${m[2].split(", ").map((x) => FX[x] ?? x).join(", ")}`],
  [/^automação: (.+)$/, (m) => `automation: ${tr(m[1])}`],
];

let lang = "pt";
try { lang = localStorage.getItem("holofoil.lang") === "en" ? "en" : "pt"; } catch {}

/** Tradução de uma frase (sem espaços nas pontas); devolve a própria frase se não houver */
export function tr(s) {
  if (lang === "pt" || !s) return s;
  if (Object.prototype.hasOwnProperty.call(EN, s)) return EN[s];
  for (const [re, f] of PATTERNS) { const m = re.exec(s); if (m) return f(m); }
  return s;
}
/** Nome em inglês, qualquer que seja o idioma da interface (para a automação aceitar os dois) */
export const toEnglish = (s) => (Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s);
const wrap = (s) => { const t = s.trim(); if (!t) return s; const r = tr(t); return r === t ? s : s.replace(t, r); };

// texto original por nó / atributo, para voltar ao português e para não traduzir duas vezes
const origText = new WeakMap(), shownText = new WeakMap(), origAttr = new WeakMap();
const ATTRS = ["placeholder", "title"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA"]);

function doText(n) {
  const cur = n.data;
  if (shownText.get(n) !== cur) origText.set(n, cur);         // o app.js escreveu um texto novo
  const out = lang === "en" ? wrap(origText.get(n)) : origText.get(n);
  shownText.set(n, out);
  if (cur !== out) n.data = out;
}
function doAttrs(el) {
  let o = origAttr.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    o ??= {}; const v = el.getAttribute(a);
    if (o[`${a}:shown`] !== v) o[a] = v;
    const out = lang === "en" ? wrap(o[a]) : o[a];
    o[`${a}:shown`] = out;
    if (v !== out) el.setAttribute(a, out);
  }
  if (o) origAttr.set(el, o);
}
function walk(root) {
  if (root.nodeType === 3) { if (!SKIP.has(root.parentNode?.nodeName)) doText(root); return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
  doAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) {
    if (n.nodeType === 1) { if (!SKIP.has(n.nodeName)) doAttrs(n); }
    else if (!SKIP.has(n.parentNode?.nodeName)) doText(n);
  }
}

const obs = new MutationObserver((list) => {
  for (const m of list) {
    if (m.type === "characterData") doText(m.target);
    else if (m.type === "attributes") doAttrs(m.target);
    else for (const n of m.addedNodes) walk(n);
  }
});

export function setLang(l) {
  lang = l === "en" ? "en" : "pt";
  try { localStorage.setItem("holofoil.lang", lang); } catch {}
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  obs.disconnect();
  walk(document.documentElement);
  obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  for (const b of document.querySelectorAll("[data-lang]")) b.classList.toggle("on", b.dataset.lang === lang);
}
export const getLang = () => lang;

// caixas do navegador (prompt) também
const nativePrompt = window.prompt.bind(window);
window.prompt = (msg, def) => nativePrompt(tr(msg), def);

for (const b of document.querySelectorAll("[data-lang]")) b.onclick = () => setLang(b.dataset.lang);
setLang(lang);
