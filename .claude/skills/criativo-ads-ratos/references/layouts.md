# Layouts

Nove layouts. Cada um é uma classe no `<body>`, junto com o tema. Tudo já vem dimensionado pelo
formato — não escrever `font-size` nem `color` dentro da peça.

```html
<body class="t-dark l-top">      <!-- tema + layout -->
```

Temas: `t-dark` (fundo escuro), `t-light` (fundo claro), `t-accent` (fundo na cor da marca).
Variar tema entre as peças do lote é o jeito mais barato de o feed não parecer um anúncio repetido.

## O esqueleto (igual em todos)

```html
<body class="TEMA LAYOUT">
  <div class="bg" style="--shift:260px"><img src="../assets/img/AD01.png"></div>  <!-- só l-bleed/l-split -->
  <div class="scrim"></div>                                                       <!-- véu de leitura -->
  <header class="topo"><img class="logo" src="../assets/logo.png"></header>
  <div class="wrap"> ...conteúdo... </div>
  <footer class="rodape"><span>@marca</span><span class="site">marca.com.br</span></footer>
</body>
```

`.topo` aceita `.centro` / `.direita`. `.wrap` é o miolo. `<div class="empurra"></div>` dentro do
`.wrap` joga o que vem depois pro rodapé (usado pra grudar o CTA embaixo).

## Catálogo

| Layout | Quando usa | Precisa imagem |
|---|---|---|
| `l-top` | editorial. headline em cima, CTA embaixo. **o mais usado** | não |
| `l-mid` | bloco único centralizado, uma frase só | não |
| `l-quote` | depoimento, print de review, frase de cliente | não |
| `l-bleed` | imagem tomando a peça inteira, texto por cima | sim |
| `l-card` | imagem num cartão, fundo liso. bom pra print de produto | sim |
| `l-split` | imagem em cima, texto embaixo. bom pra foto de pessoa e mockup | sim |
| `l-price` | oferta, preço, desconto. fundo de funil | não |
| `l-stat` | número grande: "31 aulas", "3x mais rápido" | não |
| `l-list` | checklist, benefícios, antes/depois em duas colunas | não |

## Peças de texto (sem imagem)

### l-top — editorial
```html
<div class="wrap">
  <span class="badge">curso online</span>
  <h1 class="headline h-xl">tu ainda faz<br><span class="hl">tudo na mão?</span></h1>
  <p class="subhead">o mesmo relatório, 40 minutos por semana, todo santo mês</p>
  <div class="empurra"></div>
  <span class="cta">quero ver como</span>
</div>
```
`.h-xl` / `.h-l` / `.h-m` / `.h-s` = tamanho do título. Headline longa desce um degrau.
`.headline.serif` troca pra fonte display; `+ .italic` deixa itálico. `<span class="hl">` pinta
a palavra na cor da marca. `.hl-box` pinta o fundo dela (grifa-texto).

### l-quote — depoimento
```html
<div class="wrap">
  <span class="aspas">“</span>
  <h1 class="headline serif italic h-l">montei em uma tarde<br>o que a agência cobrava por mês</h1>
  <p class="subhead">Ana R., dona de clínica</p>
</div>
```
Tudo centraliza sozinho. Depoimento **precisa** de nome e contexto, senão vira frase de motivação.

### l-price — oferta
```html
<div class="wrap">
  <span class="badge vazado">turma de março</span>
  <h1 class="headline h-m">tudo, de uma vez só</h1>
  <div class="price"><span class="cifrao">R$</span>97</div>
  <p class="parcela">à vista, ou 12x de R$ 9,70</p>
  <span class="price-old">de R$ 197</span>
  <div class="empurra"></div>
  <span class="cta">garantir vaga</span>
</div>
```
`.price-old` só entra se o preço cheio for verdade. Preço riscado inventado é o caminho mais curto
pra reprovação na Meta e pra perder o cliente.

### l-stat — número
```html
<div class="wrap">
  <div class="stat">31</div>
  <p class="stat-label">aulas, com o arquivo pronto pra rodar no fim de cada uma</p>
  <div class="linha" style="--linha-w:160px"></div>
  <div class="empurra"></div>
  <span class="cta vazado">ver as aulas</span>
</div>
```
Número curto: 1 a 3 caracteres. "1.847" não funciona em `l-stat`, funciona em `l-top`.

### l-list — checklist e antes/depois
```html
<div class="wrap">
  <h1 class="headline h-m">a mesma segunda-feira</h1>
  <div class="cols">
    <div>
      <div class="col-tit">hoje</div>
      <ul class="list cortado"><li>abre 6 abas</li><li>copia na mão</li><li>refaz o gráfico</li></ul>
    </div>
    <div>
      <div class="col-tit on">depois</div>
      <ul class="list check"><li>roda 1 comando</li><li>lê o resumo</li><li>vai almoçar</li></ul>
    </div>
  </div>
  <div class="empurra"></div>
  <span class="cta">quero esse depois</span>
</div>
```
Uma coluna só = `.list` sozinha (marcador `→`) ou `.list.check` (`✓`). Máximo 4 itens por coluna,
3 palavras por item. `.cols` no 1x1 fica apertado: prefere 4x5 ou 9x16 pra antes/depois.

## Peças com imagem

### l-bleed — imagem tomando tudo
```html
<div class="bg" style="--shift:300px;--zoom:1.15"><img src="../assets/img/AD03.png"></div>
<div class="scrim"></div>
<div class="wrap">
  <h1 class="headline serif h-xl sombra">ninguém<br>nasce sabendo</h1>
  <p class="body sombra">é a primeira hora que assusta. depois vira rotina.</p>
  <span class="cta">começar do zero</span>
</div>
```
`--shift` desce a imagem, `--zoom` compensa a borda que sobra. A regra de leitura tá em
[imagem.md](imagem.md) e é a coisa mais fácil de errar aqui.

Véus: `.scrim` (padrão, escurece o topo), `.scrim.suave`, `.scrim.baixo` (escurece a base, quando o
texto vai embaixo), `.lens` (véu uniforme, pra imagem clara e cheia). `.sombra` no texto quando ele
cai sobre área clara.

### l-card e l-split
```html
<div class="wrap">
  <h1 class="headline h-m">o print que ninguém acredita</h1>
  <div class="card"><img src="../assets/img/print.png"></div>
</div>
```
`l-card` é o único que aceita print de tela sem ficar amador: o cartão dá moldura. `.card.tracejado`
usa a borda tracejada na cor da marca. `l-split` é imagem colada no topo, texto embaixo — melhor
pra foto de pessoa real.

## Regras que valem pra qualquer layout

1. **Uma mensagem por peça.** Dor OU preço OU prova. Misturou, não comunica nenhuma.
2. **Máximo 15-20 palavras visíveis.** Ad não é carrossel.
3. **Sempre CTA.** Mesmo discreto (`.cta.link`).
4. **Alinhamento à esquerda** por padrão. Centralizado só em `l-quote` e `l-mid`.
5. **Não inventar cor dentro da peça.** Precisou de uma cor que não existe? volta no `brand.yaml`.
6. **Não mexer em `font-size` na peça.** Título grande demais? troca `.h-xl` por `.h-l`.
7. **Variar entre as peças do lote:** tema, layout e tamanho de título. Cinco peças iguais em fundo
   escuro com badge amarelo é um anúncio só, repetido cinco vezes.
