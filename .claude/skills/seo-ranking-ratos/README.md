# SEO Ranking Ratos

> Skill de Claude Code feita pela [**Ratos de IA**](https://ratosdeia.com.br), parte do curso [**Claude Code OS**](https://ratosdeia.com.br/claudeos/).

Coach de ranqueamento do teu site no **Google e nas IAs** (ChatGPT, Perplexity, AI Overviews). SEO + AEO + GEO num fluxo só.

Não é um auditor que cospe um relatório gigante e some. É um **ciclo com memória**: trabalha em sessões curtas que avançam um plano vivo por site, pegando a próxima tarefa de maior impacto, executando de verdade (edita o HTML, gera schema, reestrutura conteúdo) e registrando o avanço. E **mede de verdade** se a tua marca aparece quando alguém pergunta pras IAs.

Funciona pra **qualquer site, nicho e país** — na primeira execução faz um setup conversacional que adapta ao teu projeto.

## Sobre

Essa é uma versão **genérica e open source** da skill que a gente usa internamente na [Ratos de IA](https://ratosdeia.com.br) pra ranquear os próprios sites. Ela nasceu de um estudo real: a gente testou 4 ferramentas de SEO/GEO (Semrush, `claude-seo`, `geo-seo-claude`, `claude-rank`) no mesmo site, no mesmo dia, e destilou o que sobrou de útil num playbook honesto + um loop de execução.

Decidimos liberar porque faz parte da filosofia do [**Claude Code OS**](https://ratosdeia.com.br/claudeos/): skills reais, resolvendo problemas reais, que tu pode estudar e adaptar. Se quiser aprender a construir skills assim, o curso explica tudo.

## O que ela faz diferente

A maioria das ferramentas de "SEO pra IA" é *one-shot*: roda, cospe um audit + plano, e acabou. Essa é de outra categoria:

- **Loop com memória** — um `SEO-PLANO.md` por site guarda backlog priorizado, o que já foi feito e um diário. A skill continua de onde parou.
- **Playbook anti-hype** — a estratégia (`playbook.md`) é destilada de dezenas de fontes **e calibrada contra o guia oficial do Google**. Separa o que ranqueia de verdade dos truques que só rendem nas IAs de fora. Sem promessa milagrosa.
- **Mede AI visibility de verdade** — o script `ai-visibility.py` pergunta pras IAs (via DataForSEO) e mede share of voice: a tua marca aparece? em que posição vs concorrentes? que fontes a IA cita? É a métrica que quase nenhuma ferramenta entrega.
- **Citability Score** — dá a cada página uma nota 0-100 de "prontidão pra ser citada", que tu move sessão a sessão.
- **Híbrida** — roda sozinha, mas se tu tiver um motor de audit profundo instalado (ver abaixo), ela delega o diagnóstico e fica mais forte.

## Instalação

```bash
# 1. Clonar o repo
git clone `seo-ranking-ratos`

# 2. Copiar a skill para a pasta do Claude Code
cp -r seo-ranking-ratos ~/.claude/skills/seo-ranking-ratos

# 3. Pronto. Abre o Claude Code e diz "vamos mexer no SEO do meu site".
```

Na primeira execução, a skill faz um **setup conversacional** perguntando o site, a marca/nicho, os concorrentes, onde salvar o plano e (opcional) as credenciais do DataForSEO.

## Como rodar uma sessão

Depois de configurada, é só chamar `/seo-ranking` (ou dizer "ranquear o site", "AEO", "aparecer nas IAs"). Cada sessão:

1. **Identifica o site** e abre o plano vivo dele
2. **Propõe 1-3 tarefas** de maior impacto/menor esforço (tu aprova)
3. **Executa de verdade** — gera robots/sitemap/llms.txt/schema, reestrutura conteúdo no formato-resposta, ou mede AI visibility
4. **Registra** o avanço no `SEO-PLANO.md` (a memória entre sessões)

Aos poucos, sessão por sessão, o site sobe.

## Medição real de IA (opcional)

O `ai-visibility.py` usa a API do [DataForSEO](https://dataforseo.com) (paga, mas barata: ~US$ 0,03 por pergunta). Ele roda os prompts que um comprador digitaria e mede quem as IAs citam.

**Sem querer gastar?** Roda em `--dry-run`: a skill imprime os prompts pra tu perguntar pras IAs na mão e anotar o resultado. O baseline sai de graça.

```bash
# modo manual (grátis)
python3 scripts/ai-visibility.py --brand "Minha Marca" --prompts-file prompts.txt --dry-run

# medindo de verdade (com credenciais DataForSEO no .env)
python3 scripts/ai-visibility.py --brand "Minha Marca" --domain minhamarca.com \
  --competitors "Rival=rival.com" --platforms chatgpt,perplexity \
  --prompts-file prompts.txt --out ai-visibility-log.csv
```

## Motores de audit complementares (opcional)

Essa skill traz um audit leve embutido e roda 100% sozinha. Mas se tu quiser um **diagnóstico técnico bem mais profundo** (crawl real, render, dados de campo, citability por bloco), vale instalar um desses ao lado — a skill detecta e delega o seed do plano pra ele:

| Skill | Boa pra | Custo/fricção |
|-------|---------|---------------|
| [**claude-seo**](https://github.com/agricidaniel/claude-seo) | Suíte SEO mais completa: técnico + demanda real (Keyword Planner) + plano priorizado | Grátis (MIT), mas setup pesado (projeto Google Cloud, várias APIs) |
| **geo-seo-claude** | GEO-nativa, 5 subagentes, análise plataforma por plataforma | Grátis (MIT), leve de instalar, gasta ~320k tokens por audit |
| **claude-rank** | Scanner técnico rápido, auto-fix de robots/sitemap/llms/JSON-LD | Grátis (MIT), `npx`, sem API key |

Nenhuma delas mede AI visibility de verdade nem gera a lista de prompts — é justamente o buraco que o `ai-visibility.py` fecha. Elas são o **motor de audit**, essa skill é o **coach + a medição**.

## Filosofia por trás

1. **Não existe hack de "SEO pra IA".** Aparecer nas IAs é fazer bom SEO fundamental + uma camada de menções pela web, com paciência. Quem vende truque milagroso tá vendendo hype.
2. **A métrica virou menção, não clique.** "Aqui não tem clique, tem menção." Por isso a skill mede share of voice nas IAs, não só posição no Google.
3. **O Google é a fonte de verdade pro Google.** Onde os vídeos de gringo divergem do guia oficial do Google, o playbook segue o Google (e diz onde os truques ainda rendem nas IAs de fora).

## Criado por

Feito com Claude Code pela [**Ratos de IA**](https://ratosdeia.com.br) — projeto educacional da [DobraLabs](https://dobralabs.com.br), laboratório de IA e tecnologia.

- **Canal no YouTube:** [@ratosdeia](https://youtube.com/@ratosdeia)
- **Newsletter:** [dobralabs.substack.com](https://dobralabs.substack.com)
- **Instagram/TikTok:** [@ratosdeia](https://instagram.com/ratosdeia)
- **Curso:** [Claude Code OS](https://ratosdeia.com.br/claudeos/)

Gostou da skill? Dá um ⭐ no repo e segue a [Ratos de IA](https://ratosdeia.com.br).

## Licença

🐀 Fica à vontade pra adaptar, modificar e tirar o máximo que der dessa skill.

Se compartilhares com alguém ou postares uma versão tua por aí, um crédito pra [**@ratosdeia**](https://ratosdeia.com.br) cai bem e ajuda a manter o projeto vivo pra gente seguir liberando material novo. Valeu!

Pra quem curte formalidade: tá licenciada sob [CC BY 4.0](./LICENSE).

## Disclaimer

Essa skill foi construída com Claude Code. Funciona bem, mas:

- **DataForSEO cobra por query.** A medição de IA custa centavos, mas tu é responsável pelo consumo da tua conta. Sem credencial, roda no modo manual de graça.
- **Os scores são heurísticas, não garantia.** Um Citability Score 90 não significa que a IA vai te citar. Significa que a página tem os fatores que costumam correlacionar com citação. Julgamento continua sendo teu.
- **SEO/GEO é jogo de médio prazo.** A skill te dá o processo e os dados, não uma bola de cristal. Resultado vem de sessões consistentes, não de um audit único.

Use com consciência e calibra com teu próprio julgamento.
