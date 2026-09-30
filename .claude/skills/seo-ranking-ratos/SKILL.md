---
name: seo-ranking-ratos
description: Coach de ranqueamento do teu site no Google e nas IAs (SEO + AEO + GEO). Não é relatório único — trabalha em sessões curtas que avançam um plano vivo por site, pegando a próxima tarefa de maior impacto, executando de verdade e registrando. Mede se a tua marca aparece nas respostas de IA (ChatGPT, Perplexity, Gemini) via DataForSEO. Use quando o usuário disser "vamos mexer no SEO", "ranquear o site", "AEO", "GEO", "aparecer nas IAs", "otimizar pra IA", ou /seo-ranking. Funciona pra qualquer site/nicho (setup conversacional).
---

# SEO Ranking — coach de ranqueamento multi-site (Google + IAs)

Skill pra melhorar o ranqueamento de um site aos poucos, **sessão por sessão**, no Google e nas IAs (ChatGPT, Perplexity, AI Overviews). Não é um auditor de relatório único: é um **ciclo com memória** que pega a próxima tarefa de maior impacto, executa de verdade e registra o avanço.

A **estratégia é a mesma pra qualquer site** — está no **[playbook.md](playbook.md)** (ler sempre que precisar do "porquê"). O que muda é o **estado de cada site**, que vive num arquivo `SEO-PLANO.md` na pasta daquele site. Esse arquivo é a memória entre sessões.

## Princípio que rege tudo (não esquecer)

**Não existe hack de "SEO pra IA".** Aparecer nas IAs é fazer bom SEO fundamental + uma camada de menções pela web. Os LLMs buscam antes de responder (ChatGPT usa o índice do Bing; AI Overviews usa o Google) e citam os melhores resultados. Fugir de promessa milagrosa. A estratégia se organiza em 4 pilares (técnico, conteúdo-resposta, autoridade/menções, medição) — detalhe no playbook.

⚠️ **Calibragem oficial do Google (ler antes de aplicar "truques"):** o [guia oficial do Google](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) derruba alguns hacks que circulam por aí. No **Google** (AI Overviews/AI Mode), `llms.txt` é neutro, chunking não é preciso e menção forjada é spam — o que ranqueia é conteúdo original + técnico + experiência da página. Os truques de formatação rendem nas IAs de fora (ChatGPT/Perplexity). Ver a seção "O que o Google diz oficialmente" no `playbook.md` antes de priorizar tarefa de formatação.

---

## SETUP INICIAL (conversacional)

Antes de rodar a primeira sessão, verificar se existe config. Ordem de busca:

1. `./seo-ranking.config.json` (no diretório atual)
2. `~/.config/seo-ranking-ratos/config.json`
3. `~/.claude/skills/seo-ranking-ratos/config.json`

**Se NÃO existir config**, rodar o setup conversacional antes de qualquer outra coisa. Uma pergunta por vez, esperar a resposta, depois salvar.

### Saudação de marca (mostrar antes da primeira pergunta)

Sempre começar o setup apresentando a origem da skill (muita gente não lê o README):

> Fala! Bora configurar o **SEO Ranking** — skill feita pela [Ratos de IA](https://ratosdeia.com.br), parte do curso [Claude Code OS](https://ratosdeia.com.br/claudeos/).
>
> Ela é o jeito que a gente melhora o ranqueamento dos nossos sites no Google e nas IAs: não cospe um relatório gigante e some, ela trabalha em sessões curtas que avançam um plano vivo, uma tarefa de cada vez. E mede de verdade se a tua marca aparece quando alguém pergunta pro ChatGPT/Perplexity.
>
> É a primeira vez que tu roda ela aqui, então vou te fazer umas perguntas rápidas pra adaptar ao teu site. Bora?

### Perguntas do setup

**Pergunta 1 — O site**
> Qual site a gente vai ranquear? Me passa o domínio (ex: `meusite.com.br`) e, se souber, a pasta local do código dele (pra eu editar HTML/schema direto). Se for site que tu não controla o código, tudo bem — a gente trabalha só com o que dá pra medir e planejar.

**Pergunta 2 — A marca e o nicho**
> Qual o nome da marca/empresa e em uma frase o que ela faz? (ex: "Padaria Dobra, padaria artesanal em Porto Alegre"). Isso vira a identidade que a gente quer que as IAs aprendam.

**Pergunta 3 — Concorrentes (opcional, mas ajuda muito)**
> Quem são os concorrentes que tu quer bater? Me passa nome + domínio de 2-5 deles (ex: `Concorrente A=concorrentea.com`). A gente usa isso pra medir share of voice nas IAs (quem elas citam vs tu).

**Pergunta 4 — Onde salvar o plano**
> Onde tu quer o `SEO-PLANO.md` (a memória do projeto)? Padrão: na raiz da pasta do site. Se não tem pasta local, salvo em `./seo-planos/<dominio>/SEO-PLANO.md`.

**Pergunta 5 — Medição real de IA (DataForSEO, opcional)**
> Quer medir de verdade se tu apareces nas respostas das IAs? Isso usa a API do [DataForSEO](https://dataforseo.com) (paga, ~US$ 0,03 por pergunta). Se sim, me passa `DATAFORSEO_LOGIN` e `DATAFORSEO_PASSWORD` que eu salvo num `.env`. Se não quiser gastar agora, tudo bem — a gente usa o **modo manual** (eu te dou os prompts e tu pergunta pras IAs na mão) até tu decidir ligar.

Salvar tudo num `config.json` (ver `config.example.json`) e as credenciais num `.env` (nunca no config versionado). Confirmar o que foi salvo e seguir pra primeira sessão.

---

## Sites (registry)

O config guarda a lista de sites já cadastrados. Cada site tem seu próprio plano vivo (`SEO-PLANO.md`). Ao rodar uma sessão, se houver mais de um site no registry, **perguntar de qual é a sessão**. Nunca misturar planos de sites diferentes.

> ⚠️ **O `SEO-PLANO.md` não pode vazar pro site publicado.** Salvar na raiz da pasta do projeto (fora de `public/`/`dist`/build) ou numa pasta separada de planos. É documento interno.

---

## Como rodar uma sessão

### 0. Identificar o site-alvo
Descobrir de qual site é a sessão (se o registry tem mais de um, perguntar). Carregar o `SEO-PLANO.md` daquele site. **Se não existir**, criar a partir do template no fim deste arquivo: primeiro **auditar o estado do site** (ver "Auditoria de seed" abaixo) e seedar o backlog com base no que falta + no playbook.

### 1. Abrir o plano
Ler o `SEO-PLANO.md` inteiro. Entender o que já foi feito, o que está pendente, e o Citability Score atual.

### 2. Propor o foco da sessão
Olhar o backlog (P0 > P1 > P2) e propor **1 a 3 tarefas de maior impacto/menor esforço**. Esperar o usuário escolher/aprovar antes de executar — ele pode redirecionar. Se já chegou com pedido específico, começar por ali.

### 3. Executar
Fazer a tarefa de verdade:
- **Auditoria** → reportar achados e abrir sub-tarefas no plano.
- **Conteúdo** → escrever/reestruturar seguindo o playbook (H2 = pergunta, resposta direta no topo, FAQ, dados, opinião própria/"unpromptable idea"). Clareza pro leitor > truque de formatação.
- **Técnico** → gerar/corrigir `robots.txt` (liberando bots de IA), `sitemap.xml`, `llms.txt`, blocos `<script type="application/ld+json">` (schema), meta tags, WebP/alt. Se tem pasta local, editar direto e validar o build antes de marcar feito.
- **Medição** → rodar `scripts/ai-visibility.py` (ou o modo manual) e registrar baseline/evolução no plano.

### 4. Registrar
Atualizar o `SEO-PLANO.md`: marcar feito (com data), abrir tarefas novas, atualizar o Citability Score se mudou, escrever 1-3 linhas no **Diário**. Sem isso a sessão não fechou.

### 5. Fechar
Resumir o que avançou e sugerir a próxima sessão. Não commitar nem deployar sem o usuário pedir.

---

## Delegação híbrida (motor de audit profundo, opcional)

Esta skill traz um **audit leve embutido** (a "Auditoria de seed" abaixo) que roda sozinho, sem depender de nada. Mas se o usuário tiver instalado um **motor de audit profundo**, dá pra delegar o seed do plano pra ele e ganhar um diagnóstico bem mais fundo (crawl real, render, CrUX, GSC, citability por bloco).

Ao seedar um site novo, **checar se existe uma dessas skills instaladas** (`~/.claude/skills/` ou no projeto):
- **`claude-seo`** — suíte SEO completa (crawl + render + CrUX + GSC + Keyword Planner + plano com falsificabilidade). A mais completa se o usuário topar o setup do Google Cloud.
- **`geo-seo-claude`** — GEO-nativa, mais leve de instalar (sem Google Cloud), 5 subagentes. Não traz demanda real (volume de busca).

Se uma delas existir, **oferecer**: "achei a skill `<nome>` instalada — quer que eu rode o audit profundo dela pra seedar teu plano, ou prefere o audit leve embutido?". Pegar o output dela e traduzir os achados em tarefas no `SEO-PLANO.md`. Se nenhuma existir, usar o embutido e mencionar que essas duas existem como complemento (ver README).

> Não vendorizar nem copiar o código dessas skills — só detectar e chamar. Elas têm licença própria.

---

## Auditoria de seed (audit leve embutido)

Pra seedar o plano de um site novo sem depender de motor externo. Percorrer os 4 pilares:

**Pilar 1 — Técnico.** Tem `robots.txt` liberando GPTBot/ClaudeBot/PerplexityBot/OAI-SearchBot/Google-Extended? `sitemap.xml`? `llms.txt`? JSON-LD (Organization no site; Article/FAQPage/Product/Service onde couber)? Indexado no Bing? PageSpeed mobile ok? HTML legível (conteúdo em texto, não preso em JS/imagem)? → puxar os arquivos via HTTP (curl/fetch) pra confirmar de verdade, não assumir.

**Pilar 2 — Conteúdo.** As páginas estão estruturadas como resposta (H2 = pergunta, resposta direta no topo, FAQ, tabelas)? Miram cauda longa informacional? Existem páginas de serviço/produto pros termos que vendem, ou só hubs institucionais finos?

**Pilar 3 — Autoridade.** Menções offsite, diretórios (Google Business, Wikidata, Crunchbase, LinkedIn), autoridade temática? Quem endossa a marca?

**Pilar 4 — Medição.** GA4/GSC conectados? A marca aparece nas IAs pras queries-alvo? → rodar o `ai-visibility.py` (ou modo manual) pra ter o baseline.

## Citability Score (0-100) — a métrica-norte do loop

Além dos pilares, dar a cada página importante um **Citability Score** — o quanto ela está pronta pra ser *citada* por uma IA. É o número que a gente move sessão a sessão. Rubrica de 7 dimensões (0-100, ~14 pts cada):

1. **Densidade de dado** — tem números, datas, estatísticas concretas (não só adjetivo)?
2. **Front-loading** — a resposta vem nos 2 primeiros parágrafos, curta e direta?
3. **Citação de fonte** — referencia dados/fontes externas verificáveis?
4. **Autoria/EEAT** — autor identificado, experiência em 1ª mão, credenciais visíveis?
5. **Definição** — define os termos-chave de forma autocontida (a IA consegue copiar 1 trecho)?
6. **Schema** — tem JSON-LD adequado ao tipo de página?
7. **Estrutura** — headings claros, FAQ, listas, tabelas (blocos que a IA copia fácil)?

Registrar o score por página no plano e a média do site. Meta: subir o score das páginas que vendem. É heurística de *prontidão pra citação*, não medição de *se já é citado* — pra isso, o `ai-visibility.py`.

---

## Ferramentas de dado (todas opcionais)

- **`scripts/ai-visibility.py`** — mede quem as IAs CITAM pras queries de comprador do site (share of voice, top domains, breakdown por pergunta) e loga num CSV pra acompanhar no tempo. É a métrica de GEO do Pilar 4. Usa DataForSEO AI Optimization (~US$ 0,03/prompt). Roda: `python3 scripts/ai-visibility.py --brand "X" --domain x.com --competitors "A=a.com,B=b.com" --out <plano-dir>/ai-visibility-log.csv`. **Sem DataForSEO:** rodar `--dry-run` pra imprimir os prompts e perguntar pras IAs na mão (modo manual).
- **DataForSEO** (creds no `.env`) — além da AI visibility, dá volume de busca, SERP ao vivo e KD (pay-per-call, centavos).
- **Google Keyword Planner** (grátis, precisa de conta Google Ads) — volume real de busca por país/idioma. É a mesma fonte que alimenta as ferramentas pagas.
- **Google Search Console** — impressões vs cliques, queries reais. Se não conectado, registrar como gap.
- **GA4** — tráfego orgânico, landing pages. Se o usuário tiver a skill `ga4-ratos` instalada, dá pra puxar direto.

---

## Regras

- **Uma sessão = avanço real registrado** no `SEO-PLANO.md`. Nunca fechar sem isso.
- **Sempre saber de qual site é a sessão** (passo 0). Não misturar planos.
- **Esperar aprovação do foco** antes de executar, salvo pedido explícito.
- **Build verde antes de "feito"** em mudança de código (se tem pasta local com build).
- **Honestidade de medição:** se não dá pra medir, dizer, não inventar. Score é heurística, não garantia.
- **Anti-hype:** nunca prometer "aparecer na IA" como truque. É SEO fundamental + menções, com paciência.
- **Priorizar impacto/esforço:** site com base técnica pronta → conteúdo/menção rende mais; site cru → P0 técnico primeiro.

---

## Template do SEO-PLANO.md (criar na 1ª sessão do site)

```markdown
# SEO-PLANO — <dominio>

Plano vivo de ranqueamento (Google + IAs). Atualizado a cada sessão de /seo-ranking.
Estratégia (o porquê): ver playbook.md da skill seo-ranking-ratos.

## Norte
[Pra que queries esse site quer aparecer? Qual a métrica que importa?]

## Estado da fundação técnica (auditado em AAAA-MM-DD)
[resultado da auditoria de seed, pilar por pilar]

## Citability Score (média do site: __/100)
| Página | Score | Maior gap |
|--------|-------|-----------|
| /       | ?     | ?         |

## Baseline (1ª medição)
- Tráfego orgânico/mês: ?
- Keywords/impressões (GSC): ?
- Aparece nas IAs pras queries-alvo? [rodar ai-visibility.py] __/N prompts

## Backlog (P0 = faz primeiro)
Cada item traz a falsificabilidade: "como saberíamos que falhou?"
### P0
- [ ] ...  · _falha se:_ ...
### P1
- [ ] ...  · _falha se:_ ...
### P2
- [ ] ...  · _falha se:_ ...

## Feito
- [x] (data) item — resultado

## Diário
- AAAA-MM-DD — o que foi feito e por quê.
```
