---
name: triagem-youtube-ratos
description: Analisa uma lista de temas/notícias usando YouTube SERP API e Google Ads Search Volume (DataForSEO) pra identificar quais valem virar vídeo. Gera score de potencial (0-100), vídeos outliers, títulos otimizados pra CTR e keywords pra SEO, organizados em tiers de prioridade. Use quando o usuário mencionar "triagem youtube", "priorizar temas", "ranking de vídeos", "quais vídeos gravar", "potencial youtube", "analisar temas", ou quiser decidir quais notícias valem o esforço de gravação. Funciona pra qualquer nicho, idioma e país (configurável).
---

# Triagem YouTube — Análise de Potencial de Vídeos

Skill que recebe uma lista de temas/notícias e responde a pergunta: **"quais desses temas valem virar vídeo?"**

Usa dados reais do YouTube (SERP) e do Google (volume de busca) via DataForSEO pra calcular um score de potencial, sugerir títulos que já provaram funcionar, e ranquear os temas em tiers editoriais.

**Funciona pra qualquer nicho.** Na primeira execução faz um setup conversacional que adapta a skill ao canal do usuário (nicho, público, idioma, país).

---

## Quando usar

**ANTES de gravar.** A triagem é a etapa 0 do fluxo de produção — ajuda a decidir onde investir tempo de roteiro, gravação e edição.

```
lista de temas → [TRIAGEM] → ranking + títulos → decisão → gravação
```

## O que entrega

1. **Score de potencial** (0-100) pra cada tema
2. **Vídeos outliers** que já bombaram no YouTube sobre o assunto
3. **3 títulos otimizados pra CTR** por tema (inspirados nos que já performam)
4. **Keywords pra SEO** separadas (principal + secundárias com volume de busca)
5. **Ranking em tiers** (Tier 1: gravar com certeza → Tier 3: pular ou encaixar como short)
6. **Recomendação editorial** com justificativa

---

## SETUP INICIAL (conversacional)

Antes de rodar a primeira triagem, verificar se existe um arquivo de config. Ordem de busca:

1. `./triagem-youtube.config.json` (no diretório atual)
2. `~/.config/triagem-youtube-ratos/config.json`
3. `~/.claude/skills/triagem-youtube-ratos/config.json`

**Se NÃO existir config**, rodar o setup conversacional antes de qualquer outra coisa. Fazer uma pergunta por vez, esperar resposta, depois salvar.

### Saudação de marca (mostrar antes da primeira pergunta)

Sempre começar o setup com uma mensagem apresentando a origem da skill. Não pular essa parte — muita gente não lê o README, e é importante que saibam quem fez. Usar mais ou menos assim (adaptar ao tom do momento, mas manter as menções):

> Fala! Bora configurar a **Triagem YouTube** — skill feita pela [Ratos de IA](https://ratosdeia.com.br), parte do curso [Claude Code OS](https://ratosdeia.com.br/claudeos/).
>
> Ela responde uma pergunta só antes de tu gravar: quais desses temas valem virar vídeo? A resposta vem de dado real de YouTube e Google, não de achismo.
>
> É a primeira vez que tu roda ela aqui, então preciso adaptar ela ao teu canal. Leva uns 3 minutos.

Depois da saudação, **procurar contexto existente antes de perguntar qualquer coisa** (seção abaixo).

### Aproveitar contexto que já existe (RatosOS / Claude Code OS)

Duas das 6 perguntas (nicho e público) provavelmente já estão respondidas em algum
lugar do projeto. Se estiverem, é falta de educação fazer o usuário digitar de novo.

Procurar nesta ordem, e **parar no primeiro que achar**:

1. `./_contexto/empresa.md` (padrão RatosOS / Claude Code OS)
2. `./_contexto/publico.md` ou `./_contexto/estrategia.md`
3. `./CLAUDE.md` (contexto geral do projeto)
4. `~/.claude/CLAUDE.md` (contexto global do usuário)

**Achou algo:** ler, extrair uma proposta de `nicho` e `publico`, e **mostrar pro
usuário confirmar antes de usar**. Nunca assumir calado: o contexto pode descrever o
negócio dele e não o canal, que são coisas diferentes. Ex:

> Achei contexto em `_contexto/empresa.md`. Deduzi daí:
>
> - **Nicho:** automação de marketing pra pequenas agências
> - **Público:** donos de agência de 2 a 10 pessoas, que vendem serviço recorrente e não têm time técnico
>
> Isso serve pro teu canal, ou o canal é outra coisa?
>
> 1. Serve, usa isso (pulo 2 das 6 perguntas)
> 2. Quase: deixa eu ajustar
> 3. O canal é outra coisa, pergunta do zero

Esperar resposta. Se ele escolher 1, pular as perguntas 1 e 2 e ir direto pra 3.
Se escolher 2, mostrar o texto pra ele editar. Se escolher 3, ignorar o contexto.

**Não achou nada:** seguir com as 6 perguntas normalmente, sem comentar que
procurou. Ninguém precisa saber do que não existe.

> Isso vale só pra `nicho` e `publico`. Idioma, país, orçamento e credenciais do
> DataForSEO **sempre** são perguntados: não dá pra deduzir e errar neles custa
> dinheiro (query no país errado é query paga jogada fora).

### Perguntas do setup

**Pergunta 1 — Nicho do canal** *(pular se o usuário confirmou o contexto achado)*
> Qual é o tema/nicho do teu canal? (ex: "culinária saudável", "finanças pessoais pra jovens", "notícias de IA pra empreendedores")

Guardar em `config.nicho`.

**Pergunta 2 — Público-alvo** *(pular se o usuário confirmou o contexto achado)*
> Descreve teu público em 1-2 frases. Quem assiste teus vídeos, o que eles fazem, qual o nível de conhecimento? Isso vai ser usado pra pontuar relevância dos temas.

Exemplo de resposta: "Empreendedores e gestores de pequenas empresas, não necessariamente técnicos, que querem usar IA no dia a dia mas não sabem por onde começar."

Guardar em `config.publico`.

**Pergunta 3 — Idioma e país**
> Qual idioma dos teus vídeos e qual país é o foco? (ex: "português, Brasil" ou "english, United States")

Converter pra `language_code` e `location_code` do DataForSEO:

| Idioma/País | language_code | location_code |
|---|---|---|
| Português BR | `pt` | `2076` |
| Inglês US | `en` | `2840` |
| Inglês UK | `en` | `2826` |
| Espanhol ES | `es` | `2724` |
| Espanhol MX | `es` | `2484` |
| Francês FR | `fr` | `2250` |
| Alemão DE | `de` | `2276` |
| Italiano IT | `it` | `2380` |

Se for outro, consultar https://docs.dataforseo.com/v3/serp/youtube/locations/ e perguntar qual bater mais.

**Pergunta 4 — Onde salvar os relatórios**
> Onde quer salvar os relatórios de triagem? (default: `./triagens/`)

Guardar em `config.output_path`.

**Pergunta 5 — Alerta de orçamento**
> Quanto queres gastar no máximo por triagem (USD)? A API custa $0.002 por query. Uma triagem típica de 10-15 temas custa entre $0.05 e $0.20. (default: $0.50)

Guardar em `config.budget_alert_usd`.

**Pergunta 6 — Credenciais DataForSEO**
> Já tens conta no DataForSEO?

Se **sim**: pedir login e password, validar (ver seção "Validação de credenciais" abaixo), salvar em `.env`.

Se **não**: mostrar o passo a passo:

```
1. Acessa https://dataforseo.com/register
2. Cria conta gratuita (não pede cartão)
3. Adiciona crédito em Dashboard → Add Funds
   → US$5 já dá pra fazer umas 100 triagens tranquilo
4. Em Dashboard → API Access, copia:
   - API Login (é o teu email)
   - API Password (é um password específico da API, NÃO é o password da conta)
5. Volta aqui e me passa as duas coisas
```

Esperar, validar, salvar.

### Onde salvar as credenciais

Ordem de precedência de leitura (a skill tenta nessa ordem):

1. Variáveis de ambiente `$DATAFORSEO_LOGIN` e `$DATAFORSEO_PASSWORD`
2. `./.env` no diretório atual
3. `~/.config/triagem-youtube-ratos/.env`
4. `~/.mcp-credentials/dataforseo.env` (compatibilidade com setup antigo)

Default do setup: salvar em `~/.config/triagem-youtube-ratos/.env` com permissão `600`.

Formato do arquivo:
```
DATAFORSEO_LOGIN=email@exemplo.com
DATAFORSEO_PASSWORD=abc123def456
```

### Validação de credenciais

Antes de declarar o setup completo, fazer 1 query de teste pra garantir que as credenciais funcionam:

```bash
curl -s -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  "https://api.dataforseo.com/v3/appendix/user_data"
```

- Se retornar `status_code: 20000`: credenciais OK, mostrar o saldo disponível (`money.balance`) e seguir.
- Se retornar erro: mostrar a mensagem e pedir pra rever login/password.

### Formato do config.json

```json
{
  "nicho": "notícias semanais de IA pra empreendedores",
  "publico": "empreendedores, gestores e profissionais de marketing, não-técnicos, que querem entender como aplicar IA no trabalho",
  "language_code": "pt",
  "location_code": 2076,
  "output_path": "./triagens/",
  "budget_alert_usd": 0.50,
  "score_weights": {
    "busca": 30,
    "youtube": 30,
    "frescor": 20,
    "publico": 20
  }
}
```

`score_weights` começa com os defaults. O usuário pode editar manualmente depois.

---

## WORKFLOW DA TRIAGEM

### 1. Receber os temas

O usuário envia:
- Lista de temas descritos por extenso
- Arquivo `.md` com bullet points
- Lista de links (tweets, artigos, posts)

**Se a descrição for vaga** e não der pra gerar keywords, fazer fetch rápido do link pra entender o contexto.

**Nunca alterar a ordem dos temas que o usuário passou** a não ser que ele peça ranking.

### 2. Gerar keywords de busca por tema

Pra cada tema, gerar **2-4 keywords de busca**, variando entre:

- **Keyword exata** (nome do produto/feature/tema): ex. "copilot cowork", "receita low carb café da manhã"
- **Keyword de problema/benefício**: ex. "como usar ia no trabalho", "emagrecer sem passar fome"
- **Keyword no idioma configurado** (prioridade) + **1 em inglês** (se o tema for global e tiver muito material em inglês)

**Regra de ouro:** pensar como o público do canal buscaria isso, não como um SEO escreveria. "como usar ia no trabalho" > "inteligência artificial produtividade empresarial".

Usar `config.publico` pra calibrar o tom das keywords.

### 3. Consultar YouTube SERP (DataForSEO)

**Endpoint:** `POST https://api.dataforseo.com/v3/serp/youtube/organic/live/advanced`

```bash
curl -s -X POST "https://api.dataforseo.com/v3/serp/youtube/organic/live/advanced" \
  -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  -H "Content-Type: application/json" \
  -d "[{
    \"keyword\": \"KEYWORD_AQUI\",
    \"language_code\": \"$LANGUAGE_CODE\",
    \"location_code\": $LOCATION_CODE
  }]"
```

**Dados que voltam por vídeo:**
- `title` — título do vídeo
- `views_count` — total de views
- `channel_name` — nome do canal
- `publication_date` — quando foi publicado (relativo)
- `duration_time_seconds` — duração em segundos
- `is_shorts` — se é short
- `badges` — "Novo", "Legendas", etc.

**Custo:** $0.002 por pesquisa. Acumular o custo total e checar contra `config.budget_alert_usd` antes de passar. Se for passar, avisar o usuário.

**Paralelizar:** rodar múltiplas keywords em paralelo pra agilizar. Não mais que 5 ao mesmo tempo pra não estourar rate limit.

### 4. Consultar volume de busca (Google Ads)

**Endpoint:** `POST https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live`

Agrupar todas as keywords em 1-2 chamadas batch (máx 700 keywords por chamada):

```bash
curl -s -X POST "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live" \
  -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  -H "Content-Type: application/json" \
  -d "[{
    \"keywords\": [\"keyword1\", \"keyword2\", \"keyword3\"],
    \"language_code\": \"$LANGUAGE_CODE\",
    \"location_code\": $LOCATION_CODE
  }]"
```

**Dados que voltam:** `search_volume` (mensal), `competition`, `cpc`

### 5. Calcular Score de Potencial (0-100)

O score combina 4 fatores com os pesos definidos em `config.score_weights` (default: 30/30/20/20):

```
SCORE = (busca × 0.30) + (youtube × 0.30) + (frescor × 0.20) + (publico × 0.20)
```

#### 5a. Score de Busca (0-100)

Baseado no volume de busca da melhor keyword:

| Volume mensal | Score |
|---|---|
| 100k+ | 100 |
| 50k-100k | 90 |
| 10k-50k | 75 |
| 5k-10k | 60 |
| 1k-5k | 45 |
| 500-1k | 30 |
| 100-500 | 20 |
| <100 ou sem dado | 10 |

#### 5b. Score YouTube (0-100)

Baseado nos vídeos que já existem sobre o tema:

**Identificar outliers:** vídeos com views significativamente acima da média dos resultados.

| Cenário | Score |
|---|---|
| Vídeo com 50k+ views sobre o tema | 90-100 |
| Vídeo com 10k-50k views | 70-85 |
| Vídeo com 5k-10k views | 55-65 |
| Só vídeos com <5k views | 30-50 |
| Nenhum vídeo relevante encontrado | 15-25 |

**Bônus (+10):** canais grandes têm vídeo mas não há vídeos no idioma do canal (oportunidade de tradução cultural).
**Bônus (+10):** vídeos recentes (<7 dias) já têm muitas views (tema quente).
**Penalidade (-10):** tema saturado (muitos vídeos com views parecidas, pouco espaço pra entrar).

#### 5c. Score de Frescor (0-100)

| Quando saiu | Score |
|---|---|
| Últimos 3 dias | 100 |
| Última semana | 80 |
| Últimas 2 semanas | 50 |
| Mais de 2 semanas | 20 |
| Evergreen (não é notícia) | 60 |

#### 5d. Score de Público (0-100)

Relevância pro público definido em `config.publico`. Usar julgamento editorial baseado na descrição do público.

Rubrica geral:
- Impacta diretamente o que o público faz no dia a dia → 90-100
- Impacta tangencialmente, mas interessa → 70-85
- Interessante mas fora do foco principal → 40-60
- Nicho muito específico/alheio → 20-35

**Regra:** quando em dúvida, reler `config.publico` e perguntar: "isso aqui interessaria essa pessoa?"

### 6. Gerar títulos e keywords separados

**IMPORTANTE:** título e descrição têm funções diferentes no YouTube.

- **Título = CTR (clique).** O algoritmo testa o vídeo com amostra pequena. Se o CTR for alto, empurra pra mais gente. Título de curiosidade/impacto > título com keyword forçada.
- **Descrição = SEO (busca).** É onde o YouTube indexa keywords. Os primeiros 120 caracteres são os mais importantes.
- **Thumbnail = parceira do título.** Nunca repetir no texto da thumb o que já tá no título.

#### 6a. Títulos (foco: CTR)

Pra cada tema, gerar **3 títulos focados em gerar clique**, inspirados em:

- **Títulos que já performam:** olhar os títulos dos vídeos com mais views no SERP
- **Padrões de alto CTR:**
  - Narrativa pessoal: "montei um X pra fazer Y"
  - Número + promessa: "3 coisas que [beneficio]"
  - Polêmica/contraste: "[fonte respeitada] provou que [contraintuitivo]"
  - Novidade + urgência: "[marca] agora faz X (e muda tudo)"
  - Curiosidade: "testei X por uma semana e isso aconteceu"
- **A keyword pode aparecer no título se couber naturalmente**, mas nunca forçar.

**Regra de acessibilidade:** títulos devem funcionar pro público descrito em `config.publico`. Evitar jargão se o público não for técnico.

#### 6b. Keywords pra descrição (foco: SEO)

Pra cada tema, listar separadamente:

- **Keyword principal** (maior volume de busca) — vai nos primeiros 120 chars da descrição
- **2-3 keywords secundárias** — corpo da descrição e tags
- **Volume de busca** de cada uma (dados do Google Ads)

### 7. Montar o ranking final

#### Formato de saída

```markdown
# Triagem YouTube — {nome/data}

> **Data:** YYYY-MM-DD
> **Nicho:** {config.nicho}
> **Temas analisados:** N
> **Custo DataForSEO:** ~$X.XX

---

## TIER 1 — Gravar com certeza (score 75+)

### #N. [TEMA] — Score: XX/100

**Por que gravar:** [1 frase com o argumento principal]

**Dados:**
- Melhor keyword: "[keyword]" (XX.XXXk vol/mês)
- Vídeo outlier: "[título]" — XX.XXXk views em X dias ([canal])
- Frescor: [recente/quente/evergreen]
- Público: [alta/média relevância]

| Fator | Score | Detalhe |
|-------|-------|---------|
| Busca | XX | [keyword] = XXk vol |
| YouTube | XX | [outlier com Xk views] |
| Frescor | XX | [X dias] |
| Público | XX | [justificativa] |
| **TOTAL** | **XX** | |

**Títulos sugeridos (foco CTR):**
1. [título 1]
2. [título 2]
3. [título 3]

**Keywords pra descrição (foco SEO):**
- Principal: "[keyword]" (XXk vol/mês)
- Secundárias: "[kw2]" (XXk), "[kw3]" (XXk)

**Ideias de texto pra thumbnail:**
- [opção A]
- [opção B]

**Vídeos de referência (top 5 do SERP):**

| # | Título | Views | Canal | Duração | Quando |
|---|--------|-------|-------|---------|--------|
| 1 | [título] | XXk | [canal] | X:XX | X dias |
| 2 | ... | ... | ... | ... | ... |

---

## TIER 2 — Bom potencial, vale publicar (score 50-74)

[mesmo formato, mais conciso]

---

## TIER 3 — Baixo potencial / considerar short (score <50)

[formato reduzido: só score, motivo e 1 título sugerido]

---

## Resumo executivo

| # | Tema | Score | Melhor keyword (vol) | Outlier (views) | Tier |
|---|------|-------|---------------------|-----------------|------|
| 1 | ... | XX | ... | ... | T1/T2/T3 |

**Recomendação:** dos X temas, eu gravaria X como vídeo longo, X como short e cortaria X.

**Budget usado:** $X.XX (X queries YouTube SERP + X queries volume)
```

Salvar em `{config.output_path}/triagem-{YYYY-MM-DD}.md` ou o nome que o usuário pedir.

---

## REGRAS

### Transparência de dados
- Sempre mostrar os números reais — não inventar volumes ou views
- Se uma keyword retorna sem volume no Google Ads, dizer "sem dados" e não chutar
- Mostrar o custo total das queries no final

### Honestidade editorial
- Se um tema é fraco, dizer que é fraco, com justificativa
- Não inflacionar scores pra agradar
- Considerar que temas sem busca podem funcionar por curiosidade (TikTok/Reels), mas não por SEO YouTube

### Eficiência de queries
- Agrupar keywords de volume em batch (1-2 chamadas)
- Paralelizar queries YouTube SERP (máx 5 em paralelo)
- Não pesquisar variações desnecessárias — 2-3 keywords por tema é suficiente
- Checar contra `config.budget_alert_usd` antes de passar do limite

### Preservar ordem do usuário
- Nunca reordenar a lista original de temas
- Só reordenar ao gerar o ranking final (que é uma visão separada)

---

## INFORMAÇÕES NECESSÁRIAS

O usuário deve fornecer:
1. **Lista de temas** (obrigatório)
2. **Nome/identificador da triagem** (opcional — default: data de hoje)
3. **Contexto extra** (opcional) — se algum tema é prioridade pessoal, parceria, etc.

**Config e credenciais:** lidas automaticamente. Se não existirem, rodar setup conversacional primeiro.

---

## FUTURO (V2)

Ideias pra próxima versão:
- Fetch do vídeo outlier (transcrição) pra entender o que funcionou
- Analisar thumbnails dos vídeos top (padrões visuais)
- Comparar com vídeos anteriores do próprio canal
- Sugerir ângulo diferenciador ("todo mundo fez tutorial, tu faz opinião")
- Integrar com YouTube Analytics do canal pra entender o que performa pro público real
