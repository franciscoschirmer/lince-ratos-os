# criativo-ads-ratos

Skill do Claude Code que monta **criativo de anúncio pra Meta Ads** (Instagram e Facebook) na
identidade da tua marca. HTML renderizado em PNG, nos três formatos, com as safe zones da Meta
já resolvidas.

Faz parte do kit da **Ratos de IA** (curso [Claude Code OS](https://ratosdeia.com.br/claudeos/)).

## Por que HTML e não gerador de imagem

Modelo de imagem escreve texto torto, quebra acento e não deixa editar. Preço errado vira uma
imagem nova. Aqui o texto é HTML: sai nítido, com acento certo, e trocar "R$ 97" por "R$ 47" é
trocar uma linha e renderizar de novo.

Imagem generativa entra onde ela é boa: ilustração e cena de fundo. E é opcional.

## O que ela faz

- **Descobre a tua marca sozinha.** Varre o projeto atrás do teu guia de marca, do contexto do
  negócio e do tom de voz. Não achou? pesquisa teu site, ou te faz seis perguntas
- Trava tudo num `brand.yaml`. **Nenhum layout tem cor escrita dentro**: trocar de cliente é
  trocar um arquivo
- **9 layouts** prontos: headline editorial, depoimento, imagem full, cartão, foto + texto,
  oferta com preço, número grande, checklist e antes/depois
- **3 formatos**: 1:1 quadrado, 4:5 feed e 9:16 story/reels. A mesma peça vira os três
- **Safe zones da Meta embutidas.** O 9:16 já respeita o corte do Reels (35% da base), não só o
  do Stories. Tem modo de conferência que desenha as zonas mortas por cima do render
- Revisa tudo num **contact sheet** só, em vez de abrir dez PNGs

## Três jeitos de usar

Ela identifica de onde tu está vindo e não te faz repetir o que já disse:

| Tu chega com | O que ela faz |
|---|---|
| **a copy já escrita** | não reescreve nada. escolhe o layout e monta |
| **só a ideia** do produto | propõe 4-5 ângulos, tu escolhe, ela escreve a copy e monta |
| **anúncio de referência** que tu gostou | lê a estrutura e remonta na tua marca |

No modo referência ela copia **estrutura**: o ângulo, a hierarquia, a fórmula da headline. Não
copia a frase, o número nem o depoimento do concorrente. Isso não é só ética, é o que reprova
na Meta e o que não converte (o anúncio dele funciona pra oferta dele).

## Instalação

Baixa o zip `criativo-ads-ratos.zip` na plataforma do curso e descompacta dentro da pasta de
skills do Claude Code:

```bash
unzip ~/Downloads/criativo-ads-ratos.zip -d ~/.claude/skills/
```

Se a pasta `~/.claude/skills/` não existir, cria antes (`mkdir -p ~/.claude/skills`).

Ou mais fácil: abre o Claude Code, arrasta o zip pra conversa e pede pra ele instalar.

Depois é só pedir: "faz uns criativos pro meu curso", "criativo pra story", ou chamar
`/criativo-ads-ratos`.

## O que precisa ter na máquina

- **Node** e o **Chromium do Playwright**. A skill instala sozinha na primeira vez
  (`npx playwright install chromium`), leva uns 2 minutos e é uma vez só
- **Gerador de imagem: opcional.** Seis dos nove layouts não usam imagem nenhuma

Se tu quiser ilustração, ela se conecta com o que tu já tem:

| Onde gera | O que precisa | Custo |
|---|---|---|
| plano do ChatGPT | login do Codex (`npx @openai/codex login`) | zero, usa o teu plano |
| skill `image-gen-ratos` | uma chave da FAL | ~$0.06 por imagem |
| skill `nanobanana-ratos` | uma chave do Google AI Studio | tem camada grátis |

Ela pergunta qual usar. Se tu não tiver nenhum, ela diz e segue sem imagem.

## Como é usar

```
tu:    preciso de criativo pro meu app de agendamento
skill: [varre o projeto] achei teu guia de marca e o tom de voz. violeta sobre roxo,
       Fraunces + DM Sans, "você" e sem inglês. confere?
tu:    confere
skill: quais formatos? 4:5 e 9:16 é o padrão pra Meta hoje
tu:    esses dois
skill: teus ângulos, escolhe os que valem:
       1. dor — "marcou. e não apareceu."
       2. prova — "60% menos falta"
       3. oferta — "menos que um corte · R$ 49"
       ...
tu:    1, 2 e 3
skill: [escreve a copy, tu aprova, ela monta e renderiza]
       contact sheet em pecas/_contact-sheet.png
```

Duas paradas antes de qualquer render: os ângulos e a copy. Descobrir que o ângulo tava errado
depois de dez PNGs é o desperdício clássico.

## O que sai

```
meu-lote/
  brand.yaml              a tua marca. mexeu? roda: node assets/theme.mjs
  copy.md                 a copy aprovada, uma peça por bloco
  assets/                 o tema gerado, o CSS, o logo, as ilustrações
  pecas/
    AD01-4x5.html  ->  AD01-4x5.png
    AD01-9x16.html ->  AD01-9x16.png
    _contact-sheet.png
```

A pasta é **auto-contida**: dá pra mandar ela inteira pro teu cliente ou pro teu designer sem
a skill instalada do outro lado.

## O que ela não faz

- **Vídeo e motion.** Hoje é peça estática. Fica pra uma próxima versão
- **Não inventa número.** Preço, quantidade e prazo saem da tua boca. O que ficar em aberto ela
  pergunta, não chuta
- **Não promete resultado.** "31 aulas com arquivo pronto" no lugar de "domine IA em 30 dias".
  Não é frescura: promessa de resultado garantido reprova na Meta e para a conta

## Licença

CC BY 4.0. Usa, adapta, roda pro teu cliente. Só mantém o crédito.
