# Design system de vídeo · Dra. Gabriela Castello

Medido em 2026-10-14 nos vídeos editados pela equipe (Drive `[03] Social Media/2026`), em
`clientes/gabriela-castello/referencias/` (os MP4 ficam fora do git; os frames em `frames/`).
Fontes: `caixinha-efeito-colateral-caneta` (720x1280, 51s), `caixinha-veneno-idosos`
(1080x1920, 41s), `caixinha-mounjaro-cerebro` (1080x1920, 50s), `extracao-vivendo-sobrevivendo`
(25s), `extracao-executivo-estresse` (127s), `extracao-nao-mata-engorda` (108s).

## O espírito

Minimalista e caro. A edição não aparece: nada de pílula colorida, tarja, cartão animado ou
som a cada corte. A força vem do **ritmo de enquadramento**, da **tipografia** (uma sans limpa e
uma serifa itálica de revista) e de **inserções de imagem** quando a fala pede. Branco sobre o
vídeo; o vinho e o amarelo da marca entram pouco, em caixas de título e numa palavra de ênfase.

## Tipografia

| papel | fonte | tamanho (1080x1920) | cor | onde |
|---|---|---|---|---|
| legenda corrida | **Montserrat Regular** | ~52 px | branco, sombra preta suave | centro, y ≈ 64% da altura (≈1230) |
| palavra/frase-chave | **Playfair Display Italic** | ~86 px, até 2 linhas | branco, mesma sombra | mesmo lugar, substitui a legenda corrida |
| título de abertura (extração) | Playfair Display Black, caixa alta | ~110 px | branco | topo ou centro; com uma caixa vinho embaixo com subtítulo em Montserrat caixa alta |
| frase de impacto (extração) | mistura: Montserrat + Playfair Italic na mesma frase | 70-110 px | branco; a palavra final às vezes em amarelo | solta sobre o vídeo, canto superior ou centro |

As duas fontes são do Google Fonts (OFL) e ficam em `.claude/skills/edicao-completa/fontes/`.
Nenhuma legenda tem fundo, contorno colorido ou caixa.

## Legenda

- 1 a 3 palavras por bloco, bloco de ~0,5 a 1,0 s. Nunca uma frase inteira.
- Bloco inteiro aparece de uma vez (não é palavra a palavra acendendo).
- Entrada com um **desfoque curto** (blur que resolve em ~130 ms) e saída por fade; nas
  trocas rápidas chega a ficar um frame borrado.
- Palavra-chave vira bloco próprio em Playfair Italic, dura mais (1 a 2 s), pode ter 2 linhas
  ("alimentos muito processados", "o músculo é responsável pelo metabolismo do corpo").
  Na caixinha de 51 s tinha 8 desses; ritmo de um a cada 6 s.
- Sem "né", sem repetição, com pontuação natural (a vírgula aparece: "refluxo,").

## Enquadramento e ritmo (caixinha)

- Tela cheia 9:16, **adesivo da caixinha nativo, sem cobrir**. Zoom e corte levam o adesivo junto.
- Corte a cada **2 a 5 s** (média 3,6 s), em fronteira de frase. Dois tipos que se alternam:
  - **salto parado**: volta pra 1.00 ou pula pra 1.07-1.12 e fica parado;
  - **aproximação lenta**: de 1.00 a ~1.14 ao longo de 3-4 s (≈4,5 %/s), e corta de volta pra 1.00.
  Padrão medido: push · 1.00 · 1.07 · 1.00 · push · 1.00 · 1.12 · 1.00 · push · 1.00 · 1.10 · 1.00 · push.
- Centro do zoom no rosto/colo (x 0.5, y ≈ 0.48 do frame).
- **Flash branco** só no primeiro corte (fim da leitura da pergunta): 5 frames subindo até o
  branco, corte no pico, 6 frames voltando. Nenhum outro flash no vídeo.
- Sem cartão final: o vídeo termina nela falando.

## Som

- Trilha instrumental suave, **~19 dB abaixo da voz**, estéreo, contínua.
- Efeito sonoro em **1 a cada 5 cortes** (no flash e em 3 saltos), nunca em todos.
- Voz limpa, sem compressão agressiva.

## Inserções (medido em 2026-10-15 nos vídeos de extração)

| vídeo | inserções/min | duração média | tempo coberto | onde |
|---|---|---|---|---|
| executivo-estresse (127 s) | 6,6 | 4,8 s | 52 % | 11 tela inteira, 3 metade de baixo |
| nao-mata-engorda (108 s) | 7,8 | 2,2 s | 28 % | 8 tela inteira, 4 metade de cima, 2 de baixo |

Os sete tipos que aparecem, do mais ao menos comum:

1. **Stock em tela inteira**, corte seco, 2 a 5 s, às vezes com texto grande por cima
   (Playfair Italic caixa alta, branco, alinhado à esquerda, ~110 px, no terço de baixo:
   "8 A 10 MIL / CALORIAS / EM 1 DIA").
2. **Stock ou 3D na metade de baixo**, ela em cima (legenda sobe pra logo acima da divisa).
3. **Cartão de título**: Playfair Black caixa alta branco + caixa vinho com subtítulo em
   Montserrat caixa alta ("ESTRESSE / ENGORDA MESMO?", "O QUE NÃO MATA / ENGORDA!"). Abre o
   vídeo, sobre stock em cima e ela embaixo.
4. **Print de notícia** (um ou vários empilhados/rodados), tela inteira ou metade, com a
   etiqueta "NOTÍCIA".
5. **Foto da pessoa citada** em tela inteira, com @ pequeno.
6. **Stock na metade de cima**, ela embaixo.
7. **Flashback**: o próprio vídeo dela em preto e branco, granulado, bordas desfocadas.

A caixinha original não tem inserção nenhuma; o Francisco pediu que a skill trouxesse esse
ritmo de extração pra caixinha (v6).

## Extração (vídeo longo cortado)

- Abre com título: palavra grande em Playfair Black caixa alta + caixa vinho com a pergunta
  em Montserrat caixa alta ("ESTRESSE / ENGORDA MESMO?", "O QUE NÃO MATA / ENGORDA!").
- **Tela dividida** = metade de cima com imagem de apoio (stock, print de notícia, 3D de
  órgão, foto de pessoa citada), metade de baixo com ela. Entra na hora em que ela cita a coisa.
  Às vezes a imagem de apoio toma a tela inteira por 1-2 s.
- **Flashback**: quando ela narra uma lembrança, o próprio vídeo dela vira preto e branco,
  granulado, com bordas desfocadas e moldura preta, como filme antigo.
- Tratamento de cor quente e suave, sem vinheta forte.

## O que o Francisco pediu por cima do padrão medido (2026-10-14)

A caixinha editada pela skill segue o padrão acima **mais**: inserções de vídeo de banco em
tela dividida (o layout da extração, metade de baixo) nas palavras que dão imagem, legenda
maior (64/104 px em vez de 52/86), efeitos sonoros em mais pontos (salto, inserção, frase-chave,
ênfase, flash) e a voz com redução de eco. "Sem SFX o vídeo fica sem impacto; parece que só
legendou e cortou."

## O que a edição da casa NÃO faz

Legenda com fundo ou pílula · palavra acendendo em cor · tarja · lista animada · cartão final
com nome · som em todo corte · zoom acima de ~1.15 · cobrir elemento nativo do story.
