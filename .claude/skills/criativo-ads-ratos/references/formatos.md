# Formatos e safe zones

Três formatos, um CSS cada. O formato é o `<link>` de `css/fmt-*.css` na peça — o `render.mjs` lê
dali e já sabe o tamanho. Não passa largura/altura na mão.

| Formato | Tamanho | CSS | Onde roda |
|---|---|---|---|
| 4:5 | 1080×1350 | `fmt-4x5.css` | feed do Instagram e Facebook. **o default** |
| 9:16 | 1080×1920 | `fmt-9x16.css` | Stories, Reels, Audience Network |
| 1:1 | 1080×1080 | `fmt-1x1.css` | feed antigo, Marketplace, alguns posicionamentos de parceiro |

**Sempre perguntar quais o user quer** antes de montar. O default sensato pra Meta hoje é 4:5 + 9:16.
1:1 só entra se ele pedir ou se o anúncio for rodar em posicionamento que corta o 4:5.

## Danger zones do 9:16 (a parte que mais estraga peça)

No Story a Meta desenha por cima da tua arte:

- **topo ~250px (13%)** — foto de perfil, nome, "patrocinado"
- **base 330px (17%)** — só Stories: botão de CTA, "enviar mensagem", barra de progresso
- **base 672px (35%)** — Reels: legenda, @, áudio, botões. É o corte mais agressivo (linha em 1248px)

O `fmt-9x16.css` já reserva isso no padding, e o **default é o corte do Reels (672px)**, não o do
Stories. Motivo: conjunto de anúncio quase sempre inclui Reels, e é mais barato deixar respiro do
que descobrir depois que o CTA sumiu atrás da legenda. Por isso o conteúdo fica agrupado na faixa
de cima e do meio, e o terço de baixo fica vazio de propósito.

Peça que roda **só em Stories** libera até 330px:

```html
<body class="t-dark l-top story-only">
```

**Não tirar esse respiro** pra "aproveitar espaço": o que entra ali some atrás da UI.

Pra conferir, adiciona `guias` na classe do body e renderiza:

```html
<body class="t-dark l-bleed guias">
```

Faixa vermelha em cima e embaixo = zona morta. Linha amarela = corte do Reels. Tirar a classe antes
de entregar.

## 4:5 e 1:1

**4:5 não tem danger zone.** Perfil e legenda ficam fora da imagem. Usa o quadro todo.
Única ressalva: se a peça também vai virar post no perfil, a grade corta em 1:1 no centro — o que
estiver no topo e na base some ali. Nesse caso, mantém o essencial no miolo.

**1:1** é o mais apertado. Headline longa não cabe: ou encurta a copy, ou desce um degrau de título
(`.h-xl` → `.h-l`). Antes/depois em duas colunas fica sufocado no 1:1.

## Fazer a mesma peça em outro formato

```bash
node assets/variar.mjs pecas/AD01-4x5.html 9x16 1x1
```

Clona o HTML, troca o CSS de formato, renomeia e reescala o `--shift` da imagem proporcional à
altura. **O `--shift` novo é chute** — sempre renderiza e confere, porque a proporção da imagem
muda e o sujeito pode voltar pra trás do texto.

Depois de variar, três coisas pra olhar no render:

1. a headline ainda cabe nas mesmas linhas? (o `<br>` que funcionava no 4:5 pode ficar torto no 1:1)
2. o sujeito da imagem saiu de baixo do texto?
3. no 9:16, sobrou base vazia de verdade?

O que muda entre formatos é só tamanho e respiro. Se precisou mudar a copy pra caber, a copy tava
comprida demais desde o começo.
