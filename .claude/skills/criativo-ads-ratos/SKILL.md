---
name: criativo-ads-ratos
description: >
  Cria criativos de anúncio pra Meta Ads (Instagram e Facebook) na identidade de qualquer marca:
  HTML renderizado em PNG por Playwright, nos três formatos (1:1 quadrado, 4:5 feed e 9:16
  story/reels), com as safe zones da Meta já embutidas. Roda um setup que descobre a marca do
  projeto (paleta, fontes, logo, tom de voz) e trava tudo num brand.yaml, então nenhuma cor fica
  escrita dentro da peça. Aceita três entradas: copy já pronta, só a ideia do produto (aí ela
  propõe ângulos e escreve a copy), ou anúncios de referência pra remontar a estrutura na marca do
  user. Ilustração é opcional e plugável nas skills de imagem que ele já tem (gpt-image2-ratos,
  image-gen-ratos, nanobanana-ratos) — os layouts tipográficos rodam sem nenhuma.
  Use quando pedirem "criativo", "criativo pra ads", "anúncio", "ad", "arte pro Meta Ads", "banner
  de campanha", "peça de story", "criativo 4:5", "gera uns criativos", "anúncio pra Instagram",
  "criativo desse concorrente na minha marca", ou quando mandarem copy/print de anúncio pra virar
  arte. Também dispara em /criativo-ads-ratos.
---

# Criativo Ads — anúncios pra Meta Ads, na marca de quem paga

Monta anúncio estático em HTML e renderiza em PNG. O HTML dá o que gerador de imagem não dá:
texto nítido, acento certo, preço editável e a mesma peça nos três formatos sem redesenhar.

**A regra que segura tudo:** cor, fonte e forma vivem no `brand.yaml` da marca. O layout não sabe
de quem é o anúncio. Trocar de cliente é trocar um arquivo.

## Antes de mexer em qualquer coisa

Lê os references conforme a fase. Não improvisa cor, tamanho nem margem — está tudo travado neles.

| Fase | Leia |
|---|---|
| descobrir a marca | [references/marca.md](references/marca.md) |
| entender de onde o user está vindo | [references/entradas.md](references/entradas.md) |
| escrever a copy | [references/copy.md](references/copy.md) |
| montar a peça | [references/layouts.md](references/layouts.md) |
| escolher formato e safe zone | [references/formatos.md](references/formatos.md) |
| gerar ou encaixar imagem | [references/imagem.md](references/imagem.md) |

## Dependências

- **Node + Playwright chromium** — o `render.mjs` instala o chromium sozinho na primeira
  execução (uns 2 minutos, só na primeira vez). Não precisa avisar o user antes, só deixar rodar
- **Gerador de imagem: opcional.** Seis dos nove layouts não usam imagem nenhuma

## Fluxo

### 1. Setup da marca (uma vez por marca)

Procura o brand guide no projeto, senão pesquisa o site e a Biblioteca de Anúncios, senão faz seis
perguntas. Sai um `brand.yaml`. Receita em [marca.md](references/marca.md).

```bash
bash <skill>/assets/scaffold.sh <workdir> [brand.yaml existente]
```

Monta o lote auto-contido (CSS, scripts, `brand.yaml`) e já gera o `theme.css`. Workdir sugerido:
dentro da pasta de tráfego do cliente. Mexeu no `brand.yaml` depois? `node assets/theme.mjs`.

**CHECKPOINT:** renderiza uma peça de teste nos três temas e confirma paleta e fonte com o user.
Marca errada contamina o lote inteiro.

### 2. Entrada e copy

Identifica o modo (copy pronta / ideia / referência) e segue [entradas.md](references/entradas.md).

**CHECKPOINT:** ângulos aprovados antes de escrever a copy. Copy aprovada antes de montar HTML.
Duas paradas em texto custam nada; dez PNGs do ângulo errado custam a rodada.

### 3. Formatos

Pergunta quais: 1:1, 4:5, 9:16 ou todos. Default sensato pra Meta hoje: **4:5 + 9:16**.
Monta primeiro no formato principal, aprova, depois deriva os outros.

### 4. Montar as peças

Uma peça por arquivo em `pecas/<NOME>-<formato>.html`, a partir de `assets/peca.template.html`.
Escolhe tema (`t-dark`/`t-light`/`t-accent`) e layout (nove opções). **Varia entre as peças** —
lote inteiro na mesma cara é um anúncio repetido.

Precisa de ilustração? [imagem.md](references/imagem.md):

```bash
bash assets/gen-image.sh assets/img/AD03.png "<prompt em ingles>" 9x16 [codex|fal|nano]
```

### 5. Render e revisão

```bash
node assets/render.mjs pecas/AD01-4x5.html          # tamanho sai do próprio HTML
node assets/variar.mjs pecas/AD01-4x5.html 9x16 1x1 # mesma peça, outros formatos
node assets/contact-sheet.mjs pecas/                # tudo num grid só, pra revisar
```

**Revisa sempre em contact sheet**, nunca abrindo dez PNGs soltos: queima contexto e trava máquina
fraca. No 9:16, adiciona `guias` na classe do body pra ver as danger zones da Meta, e tira antes de
entregar.

**CHECKPOINT:** mostra o contact sheet e coleta ajuste peça a peça.

## Estrutura do lote

```
lote/
  brand.yaml              a marca. mudou? node assets/theme.mjs
  copy.md                 a copy aprovada, uma peça por bloco
  assets/
    theme.css             GERADO. não editar na mão
    marca.json            GERADO. handle, site, logo, tom
    css/                  base.css + fmt-1x1 / fmt-4x5 / fmt-9x16
    logo.png              PNG transparente da marca
    img/                  ilustrações
    *.mjs *.sh            os scripts, copiados pelo scaffold
  pecas/
    AD01-4x5.html -> AD01-4x5.png
    AD01-9x16.html -> AD01-9x16.png
    _contact-sheet.png
```

O lote é auto-contido de propósito: dá pra mandar a pasta pro cliente ou pro designer sem a skill
instalada.

## O que não fazer

1. **Escrever cor ou fonte dentro da peça.** Precisou de uma cor nova? volta no `brand.yaml`
2. **Mexer em `font-size` na peça.** Título não cabe? desce um degrau (`.h-xl` → `.h-l`)
3. **Reescrever copy aprovada** sem avisar
4. **Renderizar antes de aprovar ângulo e copy**
5. **Ocupar as danger zones do story** pra "aproveitar espaço"
6. **Pedir texto pro gerador de imagem.** Texto é HTML, sempre
7. **Copiar anúncio de concorrente ao pé da letra.** Estrutura sim, frase e prova não

## Atualizar a skill

Quando sair versão nova:

1. Ler o `VERSION` local pra saber de onde parte
2. Ler o `CHANGELOG.md` e aplicar as versões maiores **em ordem**
3. **Nunca tocar** no `brand.yaml`, no `copy.md`, na pasta `pecas/` nem em `assets/img/` de
   nenhum lote do user. É o trabalho dele
4. **Nunca sobrescrever** `assets/theme.css` nem `assets/marca.json` de um lote: são gerados
5. Backup `.bak` de todo arquivo antes de editar
6. Se o bloco local divergir do "ANTES" do changelog, é customização: perguntar antes

Lote antigo segue funcionando com o CSS que ele já tem. Pra levar melhoria de CSS pra um lote
velho, copiar `assets/css/*.css` da skill por cima e renderizar de novo.

## Ainda não faz (v1)

Vídeo e motion. Fica pra v2. Hoje ela entrega peça estática nos três formatos, e é isso.
