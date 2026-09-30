---
name: apresentacao-comercial
description: Gera apresentações comerciais em HTML navegável (teclado, clique, swipe) com arco de storytelling estruturado em 8 atos. Use sempre que o usuário pedir pra montar uma apresentação de proposta comercial, deck de venda, pitch pra cliente, apresentação de projeto, ou disser "faz uma apresentação da proposta", "monta o deck", "apresentação pra cliente X", "deck comercial", "apresentar a proposta em slides". Diferente de uma proposta em página scroll, esta gera um deck navegável pra apresentar ao vivo. Sempre constrói a narrativa com o usuário em texto ANTES de montar os slides. Na primeira execução, faz um mini-setup pra detectar/configurar o sistema visual e contexto do negócio.
---

# Apresentação Comercial

Gera um HTML único, auto-contido, com múltiplos slides navegáveis (teclado, clique, swipe), estruturado como um arco de storytelling pra apresentar propostas comerciais ao vivo.

**Não é uma página em scroll** (cliente lê sozinho no email) — é um **deck navegável** (apresenta ao vivo). Cada slide é um beat narrativo, não uma seção de documento.

## Quando usar

- "faz uma apresentação da proposta pra [cliente]"
- "monta o deck comercial"
- "quero apresentar essa proposta em slides"
- "faz um pitch pra cliente X"
- "apresentação navegável da proposta"

## Quando NÃO usar

- Proposta pro cliente ler no e-mail (página em scroll) → outra skill
- Slide único pra colar em outro deck → outra skill
- Apresentação genérica (palestra, aula) sem arco comercial → outra skill

---

## Fase 0 — Setup inicial (primeira execução)

Antes de qualquer coisa, verificar se já existe contexto configurado. Procurar nesta ordem:

**Contexto de negócio:**
1. `./_contexto/empresa.md` (padrão RatosOS / Claude Code OS)
2. `./_contexto/preferencias.md`
3. `./_contexto/estrategia.md`
4. `./CLAUDE.md` (contexto geral do projeto)

**Sistema visual:**
1. `./marca/design-guide.md` (padrão RatosOS)
2. `./design.md` ou `./design-guide.md` (raiz do projeto)
3. `./.claude/design.md`
4. `~/.claude/design.md` (global do usuário)

### Cenário A — Achou RatosOS ou design.md

Perguntar pro usuário em UMA mensagem curta:

> Vi que tens contexto configurado aqui (`marca/design-guide.md` e/ou `_contexto/empresa.md`). Quer que eu use como base pra apresentação, ou prefere montar do zero?
>
> 1. Usar o que já tem (recomendado)
> 2. Montar do zero e ignorar
> 3. Misturar: usar contexto do negócio, mas design custom pra essa apresentação

Esperar resposta antes de prosseguir.

### Cenário B — Não achou nada

Perguntar pro usuário:

> Não achei contexto configurado aqui. Pra montar uma apresentação no teu estilo, posso:
>
> 1. **Setup rápido agora** (~5 perguntas: marca, cores, fonte, tom, exemplos) — eu salvo em `design.md` pra reusar
> 2. **Usar template neutro** (preto/branco minimalista) — sem perder tempo configurando
> 3. **Tu me passa um design.md/PDF/site de referência** — eu leio e adapto
>
> Qual prefere?

### Cenário C — Setup rápido escolhido

Fazer essas perguntas em UMA mensagem (não fragmentar):

1. Nome da marca/empresa que vai aparecer no deck
2. Cor principal de destaque (hex ou descrição: "azul Petrobras", "verde Fruki", etc)
3. Tom de comunicação (formal / direto / casual / técnico)
4. Fonte preferida (ou "padrão neutro" pra usar Inter)
5. Tem algum site/PDF de referência visual? (opcional)

Com as respostas, gerar `design.md` na raiz do projeto e perguntar se pode salvar (não salvar sem permissão).

### Cenário D — Já rodou antes nesta sessão

Pular setup, ir direto pra Fase 1.

---

## Fase 1 — Construir o arco narrativo (em texto, com o usuário)

Antes de gerar qualquer HTML, conversar com o usuário pra montar o arco. O arco segue 8 atos (detalhes em `references/storytelling.md`):

```
ATO 1 — Situação
  Capa (bookend de abertura)
  Chamado — como o cliente chegou até nós
  Descoberta — o que o cliente já sabia (dados próprios)
  Contexto/Perfil — quem é o público final

ATO 2 — Tensão
  Punchline — o ponto de virada, a frase de dor

ATO 3 — Tese
  Como a gente lê isso
  Objetivo — o que queremos entregar

ATO 4 — Solução
  Framework/Modelo (opcional)
  Programa (formato, estrutura)
  Conteúdo
  Bônus (se houver)

ATO 5 — Prova
  Depoimentos / Cases

ATO 6 — Investimento
  Preço
  Simulações (se aplicável)

ATO 7 — Fechamento
  Objetivo (opcional, padrão "fechamento positivo")
  CTA — próximos passos
  Capa final (bookend)
```

O arco é flexível. Nem toda proposta tem todos os beats. Mas a ordem importa: problema antes de solução, tese antes de formato.

Para cada beat, alinhar com o usuário:
- Qual o título do slide
- Qual a mensagem central (1 frase)
- Quais dados/frases entram
- Qual template recomendado (1-10)

**Só partir pra Fase 2 depois que o usuário aprovar o arco completo.**

---

## Fase 2 — Montar o HTML

Com o arco aprovado, escolher o template certo pra cada beat (ver `references/templates.md`) e montar o HTML final usando as variáveis CSS do design system carregado (ou do fallback neutro).

Salvar em local sugerido pelo usuário, default `./apresentacao-{cliente}.html` na raiz do projeto.

---

## Sistema visual (variáveis)

Todos os templates usam **variáveis CSS** injetadas no `<style>` do `base.html` e propagadas pros slides via `:root`. As variáveis padrão são:

```css
:root {
  --color-bg: #FFFFFF;
  --color-surface: #F7F7F7;
  --color-text: #111111;
  --color-text-soft: #555555;
  --color-text-mute: #999999;
  --color-border: #BBBBBB;
  --color-accent: #111111;       /* cor principal da marca */
  --color-accent-soft: #F2F2F2;  /* versão suave */
  --color-accent-text: #333333;  /* cor de destaque em texto */
  --color-card-strong: #111111;  /* fundo de card de destaque máximo */
  --color-card-soft: #F2F2F2;    /* fundo de card neutro */
  --color-card-dark: #111111;    /* fundo de card escuro/contraste */
  --font-main: 'Inter', system-ui, sans-serif;
  --font-accent: 'Inter', serif;
}
```

Quando o `design.md` do usuário definir cores/fontes diferentes, sobrescrever essas variáveis. Ver `references/design-fallback.md` pra detalhes.

---

## Templates de slide disponíveis

10 templates principais — escolher os que fizerem sentido pra cada proposta. Um mesmo template pode ser usado várias vezes. Beats do arco podem ser pulados quando não se aplicam.

**Regra simples:** cada slide = uma ideia. Se tá enfiando 3 ideias num slide, quebra. Se tá esticando 1 ideia em 2 slides, junta.

HTML completo de cada template em `references/templates.md`.

| # | Template | Uso típico |
|---|----------|-----------|
| 1 | Capa bookend | Abertura e fechamento — pode ser fundo limpo, foto, ou imagem com box pro logo do cliente |
| 2 | Stat dupla | Dois números grandes com descrição (dados da pesquisa do cliente) |
| 3 | Pergunta em box | A pergunta do cliente, frase do chamado |
| 4 | Grid categórico | Setores × desafios, segmentos × dores |
| 5 | Punchline solta | Frase de virada, ponto de tensão |
| 6 | Comparação 2 cards | Hard + soft, antes + depois, dois produtos lado a lado |
| 7 | Título de ato | Abertura de ato narrativo (tipografia grande) |
| 8 | Equação visual | A + B + C = resultado |
| 9 | Lista com cards | Conteúdo programático, funcionalidades, tópicos |
| 10 | Preço + CTA | Investimento, próximos passos, fechamento |

---

## Arquitetura do HTML final

- Arquivo único, auto-contido
- Cada slide é um iframe com `srcdoc` (isolamento de CSS)
- Container pai controla navegação (setas, clique nas bordas, swipe mobile, F fullscreen)
- Contador no canto inferior esquerdo (`1/10`)
- Hint de navegação some após 5s
- Scaling tela cheia: 1280×720 como base, escala pra ocupar o viewport mantendo proporção 16:9
- Fundo da página acompanha o slide ativo (detecta `background-color` do iframe)
- Pronto pra PDF por padrão: `@media print` ativado quando o navegador exporta como PDF (Cmd+P → Save as PDF)

Template do container em `assets/base.html`.

---

## Regras

1. **Sempre confirmar o arco em texto antes de gerar HTML.** Não há atalho.
2. **Storytelling > exaustividade.** Menos slides bem construídos > muitos slides com info repetida.
3. **Bookend visual.** Capa no começo e no fim, iguais ou variação próxima.
4. **Sem CTA é incompleto.** Todo deck precisa de slide de próximo passo antes do bookend final.
5. **Cliente como protagonista.** O deck começa com o CLIENTE falando (a pergunta dele), não com tu se apresentando.
6. **Tensão antes de solução.** O slide 5 (punchline) é o momento mais importante — sem ele, o deck vira lista de features.
7. **Construir valor antes do preço.** Nunca mostrar valor antes de gerar desejo.
8. **Quebras de linha harmônicas.** Em todo subtítulo, descrição ou parágrafo de 2+ linhas, controlar a quebra com `<br>` em ponto natural (após pontuação forte, entre cláusulas, antes de conectores). Evita linhas órfãs/viúvas.
9. **Viewport meta em CADA slide (iframe).** Todo HTML de slide (srcdoc) deve começar com `<meta charset="UTF-8"><meta name="viewport" content="width=1280,initial-scale=1">`. Sem isso, Safari mobile renderiza com viewport default (~980px) e corta o lado direito.

---

## Antipadrões de escrita (evitar — cara de IA)

Copy de deck comercial é afirmativa e direta. Os vícios abaixo denunciam texto gerado por IA. Reler o texto de todo slide e tirar:

1. **Dicotomia "não é X, é Y"** (a pior). "não é A, é B", "não se trata de X, e sim de Y", "mais do que X, é Y", "deixa de ser X pra virar Y". Ir direto pra afirmação concreta.
2. **Regra de três oca.** Três adjetivos/itens em série só pelo ritmo: "rápido, simples e poderoso", "claro, direto e eficiente". Ficar com o que significa algo.
3. **Chavão de palco.** "isso muda tudo", "o jogo virou", "o pulo do gato", "a virada de chave", "o futuro é agora", "bora?". Manjado e vazio.
4. **Metáfora batida.** "ponta do iceberg", "divisor de águas", "santo graal", "cereja do bolo", "a chave que destrava". Trocar por concreto.
5. **"não apenas... mas também" / "não só... como também".** Mesma família da dicotomia. Afirmar direto.
6. **Pergunta retórica de venda.** "e se eu te dissesse que...", "já parou pra pensar...", "imagina poder...". Começar pela afirmação.
7. **Superlativo vazio.** "revolucionário", "poderoso", "incrível", "game changer", "transformador", "definitivo". Mostrar o efeito concreto em vez de adjetivar.
8. **Fecho de redação.** "no fim das contas", "ao final do dia", "a real é que", "em resumo". Só dizer a coisa.
9. **Travessão dramático.** Usar `—` pra criar suspense ou emendar oração. Ponto final resolve.

**Regra-mãe:** se a frase nega algo só pra valorizar o que vem depois, reescrever começando pela afirmação. Comparações reais (antes/depois, dois cenários em **cards distintos**) são legítimas — o vício é a negação retórica dentro da mesma frase.

---

## Padrões narrativos validados

### Fechamento positivo (objetivo depois do preço)

Em vez de acabar com preço > CTA, a sequência que funciona melhor é:

```
investimento > (bônus opcional) > (prova social opcional) > objetivo > CTA > bookend
```

O objetivo ("o que o projeto entrega") depois do preço fecha a apresentação com valor, não com custo.

### Slide resumo antes do detalhe

Antes de detalhar cada produto/etapa individualmente, mostrar um slide "nossa proposta" com todas as etapas lado a lado. Funciona como mapa visual antes de mergulhar nos detalhes.

### Ponte narrativa entre problema e tese

Depois do cenário atual (dores) e antes da tese (como a gente lê), colocar um slide ponte com frase curta tipo "as ferramentas já existem. falta saber como começar." (template 5, punchline).

---

## Fluxo típico de uso

```
Usuário: "monta um deck da proposta pro [cliente X]"

Skill (primeira vez):
1. Detecta contexto disponível (RatosOS / design.md / nada)
2. Pergunta como proceder (cenário A/B/C)
3. Carrega o sistema visual escolhido

Skill (sempre):
4. Lê contexto do cliente (CLAUDE.md / arquivos da pasta / conversa)
5. Pergunta o que faltar (valor, escopo, formato)
6. Propõe arco narrativo em texto (quantidade de slides varia)
7. Itera com o usuário nos beats
8. Quando aprovado, gera o HTML completo
9. Salva no caminho combinado
10. Oferece abrir no browser pra revisar
```

---

## Referências

- `references/storytelling.md` — arco narrativo detalhado com exemplos genéricos
- `references/templates.md` — HTML de cada um dos 10 templates (com variáveis CSS)
- `references/design-fallback.md` — sistema neutro + como configurar `design.md`
- `assets/base.html` — container navegável (scaffold)
