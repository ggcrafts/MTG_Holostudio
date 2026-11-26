# MTG HoloStudio

Gerador de cartas holofoil de Magic. Abre no navegador, usa a placa de vídeo e mostra a carta em 3D, ao vivo,
reagindo à inclinação. Serve para criar looks de foil, ajustar cada parâmetro e exportar imagens e clipes.

## Rodar

Precisa só do [Node.js](https://nodejs.org) 20 ou mais novo. Não há dependências para instalar.

```
node server.mjs
```

No Windows, dois cliques em `MTG HoloStudio.cmd`. O Studio abre em http://127.0.0.1:4517/holofoil/.

Para exportar clipes (MOV, WebM, MP4) é preciso ter o `ffmpeg` no PATH, ou a variável `FFMPEG_PATH`
apontando para ele. Sem ffmpeg, a exportação entrega a sequência PNG.

Em máquina fraca, abra com `?quality=low` no fim do endereço.

## O que ele faz

- **Folha de verdade.** O motor do [holo.spot](https://www.holo.spot) (`vendor/holospot`) desenha a carta
  holográfica em 3D com difração espectral. Materiais do kit: Prism Rainbow, Gold Shatter, Nebula Glitter,
  Sky Sparkle, Gilded Vortex e Volume Hologram.
- **Arte impressa por cima.** A tinta filtra a luz do metal (folha × tinta), a base branca bloqueia a folha
  onde a máscara manda, o verniz devolve os reflexos fortes por cima.
- **Materiais holográficos próprios.** *Galaxy* e *Surge* usam um mapa como rede de difração: a tonalidade do
  mapa define, ponto a ponto, a direção e o passo da ranhura, então um degradê de cinza vira um degradê de
  espectro. Por baixo vai o foil tradicional, mascarado pela arte.
- **Máscaras.** Mapa de contraste da arte com levels (branco mostra o foil, preto quase nada), região (carta
  inteira, só a arte, só a moldura, PNG próprio), caixa de texto opaca e padrão do foil.
- **Carta.** Busca por nome no Scryfall, com sugestões por semelhança e menu de versões; arquivo local;
  arrastar e soltar; ou imagens deixadas na pasta `cards/`. Verso por PNG próprio.
- **Looks.** Cada look guarda todas as propriedades. Os de base ficam em `holofoil/presets-base.json`; os seus,
  em `data/holofoil/presets/`. "Colar do holo.spot" aceita o JSON do botão `</>` (Copy settings) do site.
- **Exportar.** PNG do quadro ou clipe em MOV ProRes 4444 com alpha, WebM VP9 com alpha ou MP4, mais a
  sequência PNG, em `output/holofoil/<carta>/`. Com a duração igual ao período do movimento, o clipe fecha em laço.
- **Interface.** Modo simples com meia dúzia de controles e modo avançado com todos; zoom de 20% a 500%
  com a roda do mouse.

## Pastas

| Caminho | O que é |
|---|---|
| `server.mjs` | Servidor local (só 127.0.0.1): arquivos estáticos, looks, uploads, exportação com ffmpeg |
| `holofoil/index.html`, `style.css`, `app.js` | A interface e a composição folha + tinta, mais o shader de difração do Galaxy e do Surge |
| `holofoil/presets-base.json` | Looks de base |
| `holofoil/maps/` | Perfis holográficos: `galaxy.png` (tons de cinza) e `surge.png` (R = máscara, G = tonalidade) |
| `holofoil/bumps/` | Mapas de relevo próprios |
| `vendor/holospot`, `vendor/three` | Motor holográfico e three.js (não editar) |
| `cards/` | Suas imagens de carta (fora do Git) |
| `data/`, `output/` | Seus looks, uploads e exportações (fora do Git) |

Um verso padrão é opcional: salve-o como `holofoil/back.png`.

## Editar os mapas

- **Galaxy** (`holofoil/maps/galaxy.png`): tons de cinza. O mesmo tom é máscara (onde há folha) e tonalidade
  (que cor e em que ângulo aquele ponto acende).
- **Surge** (`holofoil/maps/surge.png`): no canal vermelho, as linhas (máscara); no verde, a tonalidade; o azul
  é ignorado. Em "Canais do padrão", na aba Máscara, dá para alternar entre os dois modos.

## Créditos e licenças

- Motor holográfico: [holospot](https://github.com/dmitrykurash/holospot), de Dmitry Kurash, licença MIT
  (`vendor/holospot/LICENSE`). A pasta `vendor/holospot` traz só o necessário para rodar (`dist`, `assets`,
  documentação e schema).
- [three.js](https://threejs.org), licença MIT (`vendor/three/LICENSE`).
- Dados e imagens de cartas vêm do [Scryfall](https://scryfall.com) em tempo de uso; nenhuma imagem de carta
  está no repositório.

MTG HoloStudio é um projeto de fã, não oficial, sem afiliação nem endosso da Wizards of the Coast.
Magic: The Gathering e as imagens das cartas são propriedade da Wizards of the Coast LLC.
